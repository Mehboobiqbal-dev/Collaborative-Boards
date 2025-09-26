import { PrismaClient, Prisma } from '@prisma/client'
import { cacheService } from '../utils/cache'
import { CardWithRelations } from '../types'
import logger from '../utils/logger'

const prisma = new PrismaClient()

export class CardService {
  async createCard(listId: string, userId: string, data: {
    title: string
    description?: string
    labels?: string[]
    assigneeId?: string
    dueDate?: Date
  }) {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { boardId: true },
    })

    if (!list) {
      throw new Error('List not found')
    }

    await this.checkBoardAccess(list.boardId, userId)

    const maxPosition = await prisma.card.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })

    const newPosition = maxPosition ? maxPosition.position + 1 : 0

    const card = await prisma.card.create({
      data: {
        listId,
        title: data.title,
        description: data.description,
        labels: data.labels || [],
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        position: newPosition,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    await cacheService.invalidateBoardCache(list.boardId)

    logger.info('Card created', { cardId: card.id, listId, userId, title: data.title })

    return card
  }

  async getCard(cardId: string, userId: string): Promise<CardWithRelations> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          select: { boardId: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    await this.checkBoardAccess(card.list.boardId, userId)

    return card
  }

  async updateCard(cardId: string, userId: string, data: {
    title?: string
    description?: string
    labels?: string[]
    assigneeId?: string
    dueDate?: Date
    position?: number
    listId?: string
  }) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { listId: true, list: { select: { boardId: true } } },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    await this.checkBoardAccess(card.list.boardId, userId)

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.labels !== undefined) updateData.labels = data.labels
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
    if (data.position !== undefined) updateData.position = data.position
    if (data.listId !== undefined) updateData.listId = data.listId

    updateData.version = { increment: 1 }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    await cacheService.invalidateBoardCache(card.list.boardId)

    logger.info('Card updated', { cardId, userId, fields: Object.keys(updateData) })

    return updatedCard
  }

  async deleteCard(cardId: string, userId: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { listId: true, list: { select: { boardId: true } } },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    await this.checkBoardAccess(card.list.boardId, userId)

    await prisma.card.delete({
      where: { id: cardId },
    })

    await cacheService.invalidateBoardCache(card.list.boardId)

    logger.info('Card deleted', { cardId, userId })

    return { message: 'Card deleted successfully' }
  }

  async moveCard(cardId: string, userId: string, newListId: string, newPosition: number) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { listId: true, position: true, list: { select: { boardId: true } } },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    const newList = await prisma.list.findUnique({
      where: { id: newListId },
      select: { boardId: true },
    })

    if (!newList) {
      throw new Error('Target list not found')
    }

    if (card.list.boardId !== newList.boardId) {
      throw new Error('Cannot move card between different boards')
    }

    await this.checkBoardAccess(card.list.boardId, userId)

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (card.listId === newListId) {
        if (newPosition > card.position) {
          await tx.card.updateMany({
            where: {
              listId: newListId,
              position: { gt: card.position, lte: newPosition },
            },
            data: { position: { decrement: 1 } },
          })
        } else if (newPosition < card.position) {
          await tx.card.updateMany({
            where: {
              listId: newListId,
              position: { gte: newPosition, lt: card.position },
            },
            data: { position: { increment: 1 } },
          })
        }
      } else {
        await tx.card.updateMany({
          where: {
            listId: card.listId,
            position: { gt: card.position },
          },
          data: { position: { decrement: 1 } },
        })

        await tx.card.updateMany({
          where: {
            listId: newListId,
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        })
      }

      return tx.card.update({
        where: { id: cardId },
        data: {
          listId: newListId,
          position: newPosition,
          version: { increment: 1 },
        },
      })
    })

    await cacheService.invalidateBoardCache(card.list.boardId)

    logger.info('Card moved', {
      cardId,
      userId,
      fromListId: card.listId,
      toListId: newListId,
      fromPosition: card.position,
      toPosition: newPosition,
    })

    return transaction
  }

  async searchCards(userId: string, filters: {
    query?: string
    labels?: string[]
    assignee?: string
    dueFrom?: Date
    dueTo?: Date
    boardId?: string
    listId?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters.boardId) {
      where.list = { board: { members: { some: { userId } } } }
      if (filters.boardId) {
        where.list.boardId = filters.boardId
      }
    } else {
      where.list = { board: { members: { some: { userId } } } }
    }

    if (filters.listId) {
      where.listId = filters.listId
    }

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ]
    }

    if (filters.labels && filters.labels.length > 0) {
      where.labels = { hasSome: filters.labels }
    }

    if (filters.assignee) {
      where.assigneeId = filters.assignee
    }

    if (filters.dueFrom || filters.dueTo) {
      where.dueDate = {}
      if (filters.dueFrom) where.dueDate.gte = filters.dueFrom
      if (filters.dueTo) where.dueDate.lte = filters.dueTo
    }

    const cards = await prisma.card.findMany({
      where,
      include: {
        list: {
          select: { id: true, title: true, boardId: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    })

    const total = await prisma.card.count({ where })

    return { cards, total, limit: filters.limit || 50, offset: filters.offset || 0 }
  }

  private async checkBoardAccess(boardId: string, userId: string) {
    const member = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    })

    if (!member) {
      throw new Error('Access denied: not a board member')
    }
  }
}

export const cardService = new CardService()

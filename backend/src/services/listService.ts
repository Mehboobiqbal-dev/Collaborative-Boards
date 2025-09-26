import { PrismaClient, Prisma } from '@prisma/client'
import { cacheService } from '../utils/cache'
import logger from '../utils/logger'

const prisma = new PrismaClient()

export class ListService {
  async createList(boardId: string, userId: string, title: string, position?: number) {
    await this.checkBoardAccess(boardId, userId)

    const maxPosition = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })

    const newPosition = position ?? (maxPosition ? maxPosition.position + 1 : 0)

    const list = await prisma.list.create({
      data: {
        boardId,
        title,
        position: newPosition,
      },
    })

    await cacheService.invalidateBoardCache(boardId)

    logger.info('List created', { listId: list.id, boardId, userId, title })

    return list
  }

  async updateList(listId: string, userId: string, title?: string, position?: number) {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { boardId: true },
    })

    if (!list) {
      throw new Error('List not found')
    }

    await this.checkBoardAccess(list.boardId, userId)

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (position !== undefined) updateData.position = position

    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: updateData,
    })

    await cacheService.invalidateBoardCache(list.boardId)

    logger.info('List updated', { listId, userId, title, position })

    return updatedList
  }

  async deleteList(listId: string, userId: string) {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { boardId: true },
    })

    if (!list) {
      throw new Error('List not found')
    }

    await this.checkBoardAccess(list.boardId, userId)

    await prisma.list.delete({
      where: { id: listId },
    })

    await cacheService.invalidateBoardCache(list.boardId)

    logger.info('List deleted', { listId, userId })

    return { message: 'List deleted successfully' }
  }

  async reorderList(listId: string, userId: string, newPosition: number) {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { boardId: true, position: true },
    })

    if (!list) {
      throw new Error('List not found')
    }

    await this.checkBoardAccess(list.boardId, userId)

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (newPosition > list.position) {
        await tx.list.updateMany({
          where: {
            boardId: list.boardId,
            position: { gt: list.position, lte: newPosition },
          },
          data: { position: { decrement: 1 } },
        })
      } else if (newPosition < list.position) {
        await tx.list.updateMany({
          where: {
            boardId: list.boardId,
            position: { gte: newPosition, lt: list.position },
          },
          data: { position: { increment: 1 } },
        })
      }

      return tx.list.update({
        where: { id: listId },
        data: { position: newPosition },
      })
    })

    await cacheService.invalidateBoardCache(list.boardId)

    logger.info('List reordered', { listId, userId, oldPosition: list.position, newPosition })

    return transaction
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

export const listService = new ListService()

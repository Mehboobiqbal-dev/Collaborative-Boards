import { PrismaClient } from '@prisma/client'
import { cacheService } from '../utils/cache'
import logger from '../utils/logger'

const prisma = new PrismaClient()

export class CommentService {
  async addComment(cardId: string, userId: string, content: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        list: {
          select: { boardId: true },
        },
      },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    await this.checkBoardAccess(card.list.boardId, userId)

    const comment = await prisma.comment.create({
      data: {
        cardId,
        authorId: userId,
        content,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    await cacheService.invalidateBoardCache(card.list.boardId)

    logger.info('Comment added', { commentId: comment.id, cardId, userId })

    return comment
  }

  async getCardComments(cardId: string, userId: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        list: {
          select: { boardId: true },
        },
      },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    await this.checkBoardAccess(card.list.boardId, userId)

    return prisma.comment.findMany({
      where: { cardId },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
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

export const commentService = new CommentService()

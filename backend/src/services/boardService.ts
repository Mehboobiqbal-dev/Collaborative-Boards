import { PrismaClient } from '@prisma/client'
import { cacheService } from '../utils/cache'
import { BoardWithRelations, BoardMemberRole } from '../types'
import logger from '../utils/logger'

const prisma = new PrismaClient()

export class BoardService {
  async createBoard(ownerId: string, title: string) {
    const board = await prisma.board.create({
      data: {
        title,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    await cacheService.invalidateBoardCache(board.id)

    logger.info('Board created', { boardId: board.id, ownerId, title })

    return board
  }

  async getBoard(boardId: string, userId: string): Promise<BoardWithRelations> {
    const cachedBoard = await cacheService.getBoardSnapshot(boardId)
    if (cachedBoard) {
      return cachedBoard
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
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
            },
          },
        },
      },
    })

    if (!board) {
      throw new Error('Board not found')
    }

    const isMember = board.members.some(member => member.userId === userId)
    if (!isMember) {
      throw new Error('Access denied: not a board member')
    }

    await cacheService.setBoardSnapshot(boardId, board)

    return board
  }

  async updateBoard(boardId: string, userId: string, title: string) {
    await this.checkBoardPermission(boardId, userId, ['ADMIN', 'MEMBER'])

    const board = await prisma.board.update({
      where: { id: boardId },
      data: { title },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    await cacheService.invalidateBoardCache(boardId)

    logger.info('Board updated', { boardId, userId, title })

    return board
  }

  async deleteBoard(boardId: string, userId: string) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    })

    if (!board) {
      throw new Error('Board not found')
    }

    if (board.ownerId !== userId) {
      throw new Error('Access denied: only board owner can delete board')
    }

    await prisma.board.delete({
      where: { id: boardId },
    })

    await cacheService.invalidateBoardCache(boardId)

    logger.info('Board deleted', { boardId, userId })

    return { message: 'Board deleted successfully' }
  }

  async addBoardMember(boardId: string, ownerId: string, email: string, role: string) {
    await this.checkBoardPermission(boardId, ownerId, ['ADMIN'])

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new Error('User not found')
    }

    const existingMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      throw new Error('User is already a board member')
    }

    const member = await prisma.boardMember.create({
      data: {
        boardId,
        userId: user.id,
        role: role as any,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    await cacheService.invalidateBoardCache(boardId)

    logger.info('Board member added', { boardId, userId: user.id, role, addedBy: ownerId })

    return member
  }

  async updateBoardMember(boardId: string, ownerId: string, memberId: string, role: string) {
    await this.checkBoardPermission(boardId, ownerId, ['ADMIN'])

    const member = await prisma.boardMember.update({
      where: { id: memberId },
      data: { role: role as any },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    await cacheService.invalidateBoardCache(boardId)

    logger.info('Board member role updated', { boardId, memberId, role, updatedBy: ownerId })

    return member
  }

  async removeBoardMember(boardId: string, ownerId: string, memberId: string) {
    await this.checkBoardPermission(boardId, ownerId, ['ADMIN'])

    const member = await prisma.boardMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    })

    if (!member) {
      throw new Error('Board member not found')
    }

    if (member.userId === ownerId) {
      throw new Error('Cannot remove board owner')
    }

    await prisma.boardMember.delete({
      where: { id: memberId },
    })

    await cacheService.invalidateBoardCache(boardId)

    logger.info('Board member removed', { boardId, memberId, removedBy: ownerId })

    return { message: 'Member removed successfully' }
  }

  async checkBoardPermission(boardId: string, userId: string, allowedRoles: string[]) {
    const member = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    })

    if (!member || !allowedRoles.includes(member.role)) {
      throw new Error('Access denied: insufficient permissions')
    }
  }

  async getUserBoards(userId: string) {
    return prisma.boardMember.findMany({
      where: { userId },
      include: {
        board: {
          include: {
            owner: {
              select: { id: true, name: true },
            },
            _count: {
              select: { lists: true, members: true },
            },
          },
        },
      },
    })
  }
}

export const boardService = new BoardService()

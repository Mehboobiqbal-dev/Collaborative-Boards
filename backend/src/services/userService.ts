import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class UserService {
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  async searchUsers(query: string, boardId?: string) {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (boardId) {
      where.boardMembers = {
        some: { boardId },
      }
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
    })
  }
}

export const userService = new UserService()

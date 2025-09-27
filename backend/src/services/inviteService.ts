import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { boardService } from './boardService'
import logger from '../utils/logger'

const prisma = new PrismaClient()

export class InviteService {
  async createInvite(boardId: string, inviterId: string, email: string, role: string = 'MEMBER') {
    // Check if inviter has permission to invite
    await boardService.checkBoardPermission(boardId, inviterId, ['ADMIN'])

    // Check if user already exists and is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      const existingMember = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId,
            userId: existingUser.id
          }
        }
      })
      if (existingMember) {
        throw new Error('User is already a member of this board')
      }
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.boardInvite.findUnique({
      where: {
        boardId_email: {
          boardId,
          email
        }
      }
    })

    if (existingInvite && !existingInvite.accepted && existingInvite.expiresAt > new Date()) {
      throw new Error('Invite already sent to this email')
    }

    // Delete expired invite if exists
    if (existingInvite && existingInvite.expiresAt <= new Date()) {
      await prisma.boardInvite.delete({
        where: { id: existingInvite.id }
      })
    }

    // Create new invite
    const inviteToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invite = await prisma.boardInvite.create({
      data: {
        boardId,
        email,
        role,
        invitedBy: inviterId,
        token: inviteToken,
        expiresAt
      },
      include: {
        board: {
          select: { id: true, title: true }
        },
        inviter: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    logger.info('Board invite created', { 
      inviteId: invite.id, 
      boardId, 
      email, 
      inviterId 
    })

    return invite
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await prisma.boardInvite.findUnique({
      where: { token },
      include: {
        board: {
          select: { id: true, title: true }
        },
        inviter: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!invite) {
      throw new Error('Invalid invite token')
    }

    if (invite.accepted) {
      throw new Error('Invite has already been accepted')
    }

    if (invite.expiresAt < new Date()) {
      throw new Error('Invite has expired')
    }

    // Verify the user's email matches the invite
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.email !== invite.email) {
      throw new Error('Email does not match the invite')
    }

    // Check if user is already a member
    const existingMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: invite.boardId,
          userId
        }
      }
    })

    if (existingMember) {
      throw new Error('User is already a member of this board')
    }

    // Create board membership
    await prisma.boardMember.create({
      data: {
        boardId: invite.boardId,
        userId,
        role: invite.role
      }
    })

    // Mark invite as accepted
    await prisma.boardInvite.update({
      where: { id: invite.id },
      data: {
        accepted: true,
        acceptedAt: new Date()
      }
    })

    logger.info('Board invite accepted', { 
      inviteId: invite.id, 
      boardId: invite.boardId, 
      userId 
    })

    return {
      message: 'Successfully joined the board',
      board: invite.board
    }
  }

  async getInviteDetails(token: string) {
    const invite = await prisma.boardInvite.findUnique({
      where: { token },
      include: {
        board: {
          select: { id: true, title: true }
        },
        inviter: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!invite) {
      throw new Error('Invalid invite token')
    }

    if (invite.accepted) {
      throw new Error('Invite has already been accepted')
    }

    if (invite.expiresAt < new Date()) {
      throw new Error('Invite has expired')
    }

    return invite
  }

  async getUserInvites(email: string) {
    const invites = await prisma.boardInvite.findMany({
      where: {
        email,
        accepted: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        board: {
          select: { id: true, title: true }
        },
        inviter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return invites
  }

  async cancelInvite(inviteId: string, inviterId: string) {
    const invite = await prisma.boardInvite.findUnique({
      where: { id: inviteId },
      include: { board: true }
    })

    if (!invite) {
      throw new Error('Invite not found')
    }

    // Check if user has permission to cancel invite
    await boardService.checkBoardPermission(invite.boardId, inviterId, ['ADMIN'])

    await prisma.boardInvite.delete({
      where: { id: inviteId }
    })

    logger.info('Board invite cancelled', { 
      inviteId, 
      boardId: invite.boardId, 
      inviterId 
    })

    return { message: 'Invite cancelled successfully' }
  }

  async getBoardInvites(boardId: string, requesterId: string) {
    // Check if user has permission to view invites
    await boardService.checkBoardPermission(boardId, requesterId, ['ADMIN'])

    const invites = await prisma.boardInvite.findMany({
      where: {
        boardId,
        accepted: false
      },
      include: {
        inviter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return invites
  }

  async cleanupExpiredInvites() {
    const result = await prisma.boardInvite.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    logger.info('Cleaned up expired invites', { count: result.count })
    return result
  }
}

export const inviteService = new InviteService()

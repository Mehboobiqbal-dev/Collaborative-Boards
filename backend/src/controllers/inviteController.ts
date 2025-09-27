import { Request, Response } from 'express'
import { AuthRequest } from '../types'
import { inviteService } from '../services/inviteService'
import { validateRequest } from '../middleware/validation'
import { z } from 'zod'

const createInviteSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['MEMBER', 'ADMIN']).optional().default('MEMBER')
})

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export const createInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params
    const { email, role } = req.body
    const inviterId = req.user!.id

    const invite = await inviteService.createInvite(boardId, inviterId, email, role)

    res.status(201).json({
      message: 'Invite sent successfully',
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        board: invite.board,
        inviter: invite.inviter
      }
    })
  } catch (error) {
    console.error('Error creating invite:', error)
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to create invite' 
    })
  }
}

export const acceptInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body
    const userId = req.user!.id

    const result = await inviteService.acceptInvite(token, userId)

    res.json(result)
  } catch (error) {
    console.error('Error accepting invite:', error)
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to accept invite' 
    })
  }
}

export const getInviteDetails = async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    const invite = await inviteService.getInviteDetails(token)

    res.json({
      board: invite.board,
      inviter: invite.inviter,
      role: invite.role,
      expiresAt: invite.expiresAt
    })
  } catch (error) {
    console.error('Error getting invite details:', error)
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to get invite details' 
    })
  }
}

export const getUserInvites = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!
    const invites = await inviteService.getUserInvites(user.email)

    res.json({ invites })
  } catch (error) {
    console.error('Error getting user invites:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get invites' 
    })
  }
}

export const cancelInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { inviteId } = req.params
    const inviterId = req.user!.id

    const result = await inviteService.cancelInvite(inviteId, inviterId)

    res.json(result)
  } catch (error) {
    console.error('Error cancelling invite:', error)
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to cancel invite' 
    })
  }
}

export const getBoardInvites = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params
    const requesterId = req.user!.id

    const invites = await inviteService.getBoardInvites(boardId, requesterId)

    res.json({ invites })
  } catch (error) {
    console.error('Error getting board invites:', error)
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to get board invites' 
    })
  }
}

export const cleanupExpiredInvites = async (req: Request, res: Response) => {
  try {
    const result = await inviteService.cleanupExpiredInvites()

    res.json({
      message: 'Expired invites cleaned up successfully',
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error cleaning up invites:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to cleanup invites' 
    })
  }
}

export {
  createInviteSchema,
  acceptInviteSchema
}

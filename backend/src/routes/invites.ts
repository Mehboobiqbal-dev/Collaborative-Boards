import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import {
  createInvite,
  acceptInvite,
  getInviteDetails,
  getUserInvites,
  cancelInvite,
  getBoardInvites,
  cleanupExpiredInvites,
  createInviteSchema,
  acceptInviteSchema
} from '../controllers/inviteController'

const router = express.Router()

// Public route - get invite details without authentication
router.get('/invite/:token', getInviteDetails)

// Protected routes
router.use(authenticateToken)

// Get user's pending invites
router.get('/invites', getUserInvites)

// Accept an invite
router.post('/invites/accept', validateRequest(acceptInviteSchema), acceptInvite)

// Board-specific invite management (requires board access)
router.post('/boards/:boardId/invites', validateRequest(createInviteSchema), createInvite)
router.get('/boards/:boardId/invites', getBoardInvites)
router.delete('/invites/:inviteId', cancelInvite)

// Admin route - cleanup expired invites
router.delete('/invites/cleanup', cleanupExpiredInvites)

export default router

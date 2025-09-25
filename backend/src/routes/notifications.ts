import { Router } from 'express'
import {
  getNotifications,
  markAsRead,
} from '../controllers/notificationController'
import { authenticateToken } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { markNotificationReadSchema } from '../utils/validation'

const router = Router()

router.use(authenticateToken)

router.get('/', getNotifications)
router.patch('/:id/read', validateRequest(markNotificationReadSchema), markAsRead)

export default router

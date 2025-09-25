import { Router } from 'express'
import {
  addComment,
  getCardComments,
} from '../controllers/commentController'
import { authenticateToken } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import { createCommentSchema } from '../utils/validation'

const router = Router()

router.use(authenticateToken)

router.get('/cards/:cardId/comments', getCardComments)
router.post('/cards/:cardId/comments', validateRequest(createCommentSchema), addComment)

export default router

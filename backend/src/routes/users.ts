import { Router } from 'express'
import {
  getCurrentUser,
  getUser,
  searchUsers,
} from '../controllers/userController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

router.use(authenticateToken)

router.get('/me', getCurrentUser)
router.get('/search', searchUsers)
router.get('/:id', getUser)

export default router

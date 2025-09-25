import { Router } from 'express'
import {
  createList,
  updateList,
  deleteList,
} from '../controllers/listController'
import { authenticateToken } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import {
  createListSchema,
  updateListSchema,
} from '../utils/validation'

const router = Router()

router.use(authenticateToken)

router.post('/boards/:boardId/lists', validateRequest(createListSchema), createList)
router.patch('/:id', validateRequest(updateListSchema), updateList)
router.delete('/:id', deleteList)

export default router

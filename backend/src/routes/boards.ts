import { Router } from 'express'
import {
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  updateBoardMember,
  removeBoardMember,
  getUserBoards,
} from '../controllers/boardController'
import { authenticateToken } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'
import {
  createBoardSchema,
  updateBoardSchema,
  addBoardMemberSchema,
  updateBoardMemberSchema,
} from '../utils/validation'

const router = Router()

router.use(authenticateToken)

router.get('/', getUserBoards)
router.post('/', validateRequest(createBoardSchema), createBoard)

router.get('/:id', getBoard)
router.patch('/:id', validateRequest(updateBoardSchema), updateBoard)
router.delete('/:id', deleteBoard)

router.post('/:id/members', validateRequest(addBoardMemberSchema), addBoardMember)
router.patch('/:boardId/members/:memberId', validateRequest(updateBoardMemberSchema), updateBoardMember)
router.delete('/:boardId/members/:memberId', removeBoardMember)

export default router

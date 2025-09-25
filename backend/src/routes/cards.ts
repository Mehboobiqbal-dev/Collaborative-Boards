import { Router } from 'express'
import {
  createCard,
  getCard,
  updateCard,
  deleteCard,
  moveCard,
  searchCards,
} from '../controllers/cardController'
import { authenticateToken } from '../middleware/auth'
import { validateRequest, validateQuery } from '../middleware/validation'
import {
  createCardSchema,
  updateCardSchema,
  searchCardsSchema,
} from '../utils/validation'

const router = Router()

router.use(authenticateToken)

router.post('/lists/:listId/cards', validateRequest(createCardSchema), createCard)

router.get('/search', validateQuery(searchCardsSchema), searchCards)

router.get('/:id', getCard)
router.patch('/:id', validateRequest(updateCardSchema), updateCard)
router.delete('/:id', deleteCard)

router.post('/:id/move', moveCard)

export default router

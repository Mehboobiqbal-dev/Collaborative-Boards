import { Response } from 'express'
import { cardService } from '../services/cardService'
import { AuthRequest } from '../types'

export const createCard = async (req: AuthRequest, res: Response) => {
  const card = await cardService.createCard(req.params.listId, req.user!.id, req.body)

  res.status(201).json(card)
}

export const getCard = async (req: AuthRequest, res: Response) => {
  const card = await cardService.getCard(req.params.id, req.user!.id)

  res.json(card)
}

export const updateCard = async (req: AuthRequest, res: Response) => {
  const card = await cardService.updateCard(req.params.id, req.user!.id, req.body)

  res.json(card)
}

export const deleteCard = async (req: AuthRequest, res: Response) => {
  const result = await cardService.deleteCard(req.params.id, req.user!.id)

  res.json(result)
}

export const moveCard = async (req: AuthRequest, res: Response) => {
  const card = await cardService.moveCard(
    req.params.id,
    req.user!.id,
    req.body.listId,
    req.body.position
  )

  res.json(card)
}

export const searchCards = async (req: AuthRequest, res: Response) => {
  const query = req.query as any

  const filters = {
    query: query.query,
    labels: query.labels ? query.labels.split(',') : undefined,
    assignee: query.assignee,
    dueFrom: query.dueFrom ? new Date(query.dueFrom) : undefined,
    dueTo: query.dueTo ? new Date(query.dueTo) : undefined,
    boardId: query.boardId,
    listId: query.listId,
    limit: query.limit ? parseInt(query.limit) : undefined,
    offset: query.offset ? parseInt(query.offset) : undefined,
  }

  const result = await cardService.searchCards(req.user!.id, filters)

  res.json(result)
}

import { Response } from 'express'
import { listService } from '../services/listService'
import { AuthRequest } from '../types'

export const createList = async (req: AuthRequest, res: Response) => {
  const list = await listService.createList(
    req.params.boardId,
    req.user!.id,
    req.body.title,
    req.body.position
  )

  res.status(201).json(list)
}

export const updateList = async (req: AuthRequest, res: Response) => {
  const list = await listService.updateList(
    req.params.id,
    req.user!.id,
    req.body.title,
    req.body.position
  )

  res.json(list)
}

export const deleteList = async (req: AuthRequest, res: Response) => {
  const result = await listService.deleteList(req.params.id, req.user!.id)

  res.json(result)
}

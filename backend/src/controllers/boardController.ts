import { Response } from 'express'
import { boardService } from '../services/boardService'
import { AuthRequest } from '../types'

export const createBoard = async (req: AuthRequest, res: Response) => {
  const board = await boardService.createBoard(req.user!.id, req.body.title)

  res.status(201).json(board)
}

export const getBoard = async (req: AuthRequest, res: Response) => {
  const board = await boardService.getBoard(req.params.id, req.user!.id)

  res.json(board)
}

export const updateBoard = async (req: AuthRequest, res: Response) => {
  const board = await boardService.updateBoard(req.params.id, req.user!.id, req.body.title)

  res.json(board)
}

export const deleteBoard = async (req: AuthRequest, res: Response) => {
  const result = await boardService.deleteBoard(req.params.id, req.user!.id)

  res.json(result)
}

export const addBoardMember = async (req: AuthRequest, res: Response) => {
  const member = await boardService.addBoardMember(
    req.params.id,
    req.user!.id,
    req.body.email,
    req.body.role
  )

  res.status(201).json(member)
}

export const updateBoardMember = async (req: AuthRequest, res: Response) => {
  const member = await boardService.updateBoardMember(
    req.params.boardId,
    req.user!.id,
    req.params.memberId,
    req.body.role
  )

  res.json(member)
}

export const removeBoardMember = async (req: AuthRequest, res: Response) => {
  const result = await boardService.removeBoardMember(
    req.params.boardId,
    req.user!.id,
    req.params.memberId
  )

  res.json(result)
}

export const getUserBoards = async (req: AuthRequest, res: Response) => {
  const boards = await boardService.getUserBoards(req.user!.id)

  res.json(boards)
}

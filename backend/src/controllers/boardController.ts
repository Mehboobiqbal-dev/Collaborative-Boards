import { Response } from 'express'
import { boardService } from '../services/boardService'
import { AuthRequest } from '../types'

export const createBoard = async (req: AuthRequest, res: Response) => {
  const board = await boardService.createBoard(req.user!.id, req.body.title)

  res.status(201).json(board)
}

export const getBoard = async (req: AuthRequest, res: Response) => {
  try {
    console.log('getBoard controller called with:', { boardId: req.params.id, userId: req.user!.id })
    const board = await boardService.getBoard(req.params.id, req.user!.id)
    console.log('Board retrieved successfully:', board.id)
    res.json(board)
  } catch (error: any) {
    console.log('Error in getBoard controller:', error.message)
    if (error.message === 'Board not found') {
      return res.status(404).json({ error: 'Board not found' })
    }
    if (error.message === 'Access denied: not a board member') {
      return res.status(403).json({ error: 'Access denied: not a board member' })
    }
    if (error.message === 'Access denied: insufficient permissions') {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' })
    }
    console.error('Error in getBoard:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
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
    req.params.boardId,
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

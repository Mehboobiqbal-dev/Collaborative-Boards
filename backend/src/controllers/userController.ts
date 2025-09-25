import { Response } from 'express'
import { userService } from '../services/userService'
import { AuthRequest } from '../types'

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  const user = await userService.getCurrentUser(req.user!.id)

  res.json(user)
}

export const getUser = async (req: AuthRequest, res: Response) => {
  const user = await userService.getUserById(req.params.id)

  res.json(user)
}

export const searchUsers = async (req: AuthRequest, res: Response) => {
  const users = await userService.searchUsers(
    req.query.q as string,
    req.query.boardId as string
  )

  res.json(users)
}

import { Response } from 'express'
import { notificationService } from '../services/notificationService'
import { AuthRequest } from '../types'

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

  const result = await notificationService.getUserNotifications(
    req.user!.id,
    limit,
    offset
  )

  res.json(result)
}

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user!.id
  )

  res.json(notification)
}

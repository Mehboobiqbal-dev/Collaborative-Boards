import { Response } from 'express'
import { commentService } from '../services/commentService'
import { notificationService } from '../services/notificationService'
import { AuthRequest } from '../types'

export const addComment = async (req: AuthRequest, res: Response) => {
  const comment = await commentService.addComment(
    req.params.cardId,
    req.user!.id,
    req.body.content
  )

  const card = await commentService.getCardComments(req.params.cardId, req.user!.id)
  const boardId = card[0]?.card?.list?.boardId

  if (boardId) {
    await notificationService.notifyMentionedUsers(
      req.body.content,
      boardId,
      req.user!.id,
      req.params.cardId
    )
  }

  res.status(201).json(comment)
}

export const getCardComments = async (req: AuthRequest, res: Response) => {
  const comments = await commentService.getCardComments(req.params.cardId, req.user!.id)

  res.json(comments)
}

import { Response } from 'express'
import { commentService } from '../services/commentService'
import { notificationService } from '../services/notificationService'
import { AuthRequest } from '../types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const addComment = async (req: AuthRequest, res: Response) => {
  const comment = await commentService.addComment(
    req.params.cardId,
    req.user!.id,
    req.body.content
  )

  // Fetch boardId using cardId instead of calling getCardComments
  const cardInfo = await prisma.card.findUnique({
    where: { id: req.params.cardId },
    select: {
      list: {
        select: { boardId: true }
      }
    }
  })

  const boardId = cardInfo?.list.boardId

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
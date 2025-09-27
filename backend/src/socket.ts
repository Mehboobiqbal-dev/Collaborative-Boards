import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { boardService } from './services/boardService'
import { cardService } from './services/cardService'
import { commentService } from './services/commentService'
import { notificationService } from './services/notificationService'
import { listService } from './services/listService'
import logger from './utils/logger'

interface AuthenticatedSocket extends Socket {
  userId?: string
  boardId?: string
}

export const setupSocketIO = (io: Server) => {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
        userId: string
        email: string
      }

      socket.userId = decoded.userId
      next()
    } catch (error) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('User connected', { userId: socket.userId, socketId: socket.id })

    socket.on('join-board', async (boardId: string) => {
      try {
        await boardService.checkBoardPermission(boardId, socket.userId!, ['VIEWER'])
        socket.boardId = boardId
        socket.join(`board:${boardId}`)
        logger.info('User joined board', { userId: socket.userId, boardId })
      } catch (error) {
        socket.emit('error', { message: 'Cannot join board' })
      }
    })

    socket.on('leave-board', (boardId: string) => {
      socket.leave(`board:${boardId}`)
      if (socket.boardId === boardId) {
        socket.boardId = undefined
      }
      logger.info('User left board', { userId: socket.userId, boardId })
    })

    socket.on('card:create', async (data: { listId: string; card: any }) => {
      try {
        if (!socket.boardId) return

        const card = await cardService.createCard(
          data.listId,
          socket.userId!,
          data.card
        )

        socket.to(`board:${socket.boardId}`).emit('card:created', card)
        socket.emit('card:created', card)
      } catch (error) {
        socket.emit('error', { message: 'Failed to create card' })
      }
    })

    socket.on('card:update', async (data: { cardId: string; updates: any }) => {
      try {
        if (!socket.boardId) return

        const card = await cardService.updateCard(
          data.cardId,
          socket.userId!,
          data.updates
        )

        socket.to(`board:${socket.boardId}`).emit('card:updated', card)
        socket.emit('card:updated', card)

        if (data.updates.assigneeId && data.updates.assigneeId !== socket.userId) {
          await notificationService.notifyAssignment(
            data.cardId,
            data.updates.assigneeId,
            socket.userId!
          )
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to update card' })
      }
    })

    socket.on('card:move', async (data: { cardId: string; listId: string; position: number }) => {
      try {
        if (!socket.boardId) return

        const card = await cardService.moveCard(
          data.cardId,
          socket.userId!,
          data.listId,
          data.position
        )

        socket.to(`board:${socket.boardId}`).emit('card:moved', card)
        socket.emit('card:moved', card)
      } catch (error) {
        socket.emit('error', { message: 'Failed to move card' })
      }
    })

    socket.on('card:delete', async (data: { cardId: string }) => {
      try {
        if (!socket.boardId) return

        await cardService.deleteCard(data.cardId, socket.userId!)

        socket.to(`board:${socket.boardId}`).emit('card:deleted', { cardId: data.cardId })
        socket.emit('card:deleted', { cardId: data.cardId })
      } catch (error) {
        socket.emit('error', { message: 'Failed to delete card' })
      }
    })

    socket.on('comment:create', async (data: { cardId: string; content: string }) => {
      try {
        if (!socket.boardId) return

        const comment = await commentService.addComment(
          data.cardId,
          socket.userId!,
          data.content
        )

        socket.to(`board:${socket.boardId}`).emit('comment:created', comment)
        socket.emit('comment:created', comment)

        await notificationService.notifyMentionedUsers(
          data.content,
          socket.boardId,
          socket.userId!,
          data.cardId
        )
      } catch (error) {
        socket.emit('error', { message: 'Failed to add comment' })
      }
    })

    
    socket.on('list:create', async (data: { boardId: string; title: string; position?: number }) => {
      try {
        if (!socket.boardId) return

        const list = await listService.createList(
          data.boardId,
          socket.userId!,
          data.title,
          data.position
        )

        socket.to(`board:${socket.boardId}`).emit('list:created', list)
        socket.emit('list:created', list)
      } catch (error) {
        socket.emit('error', { message: 'Failed to create list' })
      }
    })

    socket.on('list:update', async (data: { listId: string; updates: any }) => {
      try {
        if (!socket.boardId) return

        const list = await listService.updateList(
          data.listId,
          socket.userId!,
          data.updates.title,
          data.updates.position
        )

        socket.to(`board:${socket.boardId}`).emit('list:updated', list)
        socket.emit('list:updated', list)
      } catch (error) {
        socket.emit('error', { message: 'Failed to update list' })
      }
    })

    socket.on('list:delete', async (data: { listId: string }) => {
      try {
        if (!socket.boardId) return

        await listService.deleteList(data.listId, socket.userId!)

        socket.to(`board:${socket.boardId}`).emit('list:deleted', { listId: data.listId })
        socket.emit('list:deleted', { listId: data.listId })
      } catch (error) {
        socket.emit('error', { message: 'Failed to delete list' })
      }
    })

    
    socket.on('user:typing', (data: { cardId: string; isTyping: boolean }) => {
      if (!socket.boardId) return
      
      socket.to(`board:${socket.boardId}`).emit('user:typing', {
        userId: socket.userId,
        cardId: data.cardId,
        isTyping: data.isTyping
      })
    })

    socket.on('user:focus', (data: { cardId: string }) => {
      if (!socket.boardId) return
      
      socket.to(`board:${socket.boardId}`).emit('user:focus', {
        userId: socket.userId,
        cardId: data.cardId
      })
    })

    socket.on('disconnect', () => {
      logger.info('User disconnected', { userId: socket.userId, socketId: socket.id })
      

      if (socket.boardId) {
        socket.to(`board:${socket.boardId}`).emit('user:offline', {
          userId: socket.userId
        })
      }
    })
  })
}

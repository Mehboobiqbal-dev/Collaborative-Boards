import { io, Socket } from 'socket.io-client'
import { Card, Comment } from '../types'
import { showInfoToast, showErrorToast } from '../utils/errorMessages'

class SocketService {
  private socket: Socket | null = null

  connect(boardId: string) {
    if (this.socket?.connected) {
      this.socket.disconnect()
    }

    this.socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    })

    this.socket.on('connect', () => {
      this.socket?.emit('join-board', boardId)
      showInfoToast('Connected to realtime updates')
    })

    this.socket.on('disconnect', (reason) => {
      showErrorToast('Disconnected. Reconnecting...')
    })

    this.socket.io.on('reconnect', () => {
      showInfoToast('Reconnected')
    })

    // If auth fails due to expired/invalid token, refresh auth payload and retry connection
    this.socket.on('connect_error', (err: any) => {
      const message: string = typeof err?.message === 'string' ? err.message : ''
      if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('jwt')) {
        const latestToken = localStorage.getItem('accessToken')
        if (latestToken && this.socket) {
          // update auth token and reconnect
          // @ts-ignore
          this.socket.auth = { token: latestToken }
          this.socket.connect()
        }
      }
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  onCardCreated(callback: (card: Card) => void) {
    this.socket?.on('card:created', callback)
  }

  onCardUpdated(callback: (card: Card) => void) {
    this.socket?.on('card:updated', callback)
  }

  onCardMoved(callback: (card: Card) => void) {
    this.socket?.on('card:moved', callback)
  }

  onCardDeleted(callback: (data: { cardId: string }) => void) {
    this.socket?.on('card:deleted', callback)
  }

  onCommentCreated(callback: (comment: Comment) => void) {
    this.socket?.on('comment:created', callback)
  }

  emitCardCreate(data: { listId: string; card: any }) {
    this.socket?.emit('card:create', data)
  }

  emitCardUpdate(data: { cardId: string; updates: any }) {
    this.socket?.emit('card:update', data)
  }

  emitCardMove(data: { cardId: string; listId: string; position: number }) {
    this.socket?.emit('card:move', data)
  }

  emitCardDelete(data: { cardId: string }) {
    this.socket?.emit('card:delete', data)
  }

  emitCommentCreate(data: { cardId: string; content: string }) {
    this.socket?.emit('comment:create', data)
  }

  emitListCreate(data: { boardId: string; title: string; position?: number }) {
    this.socket?.emit('list:create', data)
  }

  emitListUpdate(data: { listId: string; updates: any }) {
    this.socket?.emit('list:update', data)
  }

  emitListDelete(data: { listId: string }) {
    this.socket?.emit('list:delete', data)
  }

  emitUserTyping(data: { cardId: string; isTyping: boolean }) {
    this.socket?.emit('user:typing', data)
  }

  emitUserFocus(data: { cardId: string }) {
    this.socket?.emit('user:focus', data)
  }

  // Event listeners for new features
  onListCreated(callback: (list: any) => void) {
    this.socket?.on('list:created', callback)
  }

  onListUpdated(callback: (list: any) => void) {
    this.socket?.on('list:updated', callback)
  }

  onListDeleted(callback: (data: { listId: string }) => void) {
    this.socket?.on('list:deleted', callback)
  }

  onUserTyping(callback: (data: { userId: string; cardId: string; isTyping: boolean }) => void) {
    this.socket?.on('user:typing', callback)
  }

  onUserFocus(callback: (data: { userId: string; cardId: string }) => void) {
    this.socket?.on('user:focus', callback)
  }

  onUserOffline(callback: (data: { userId: string }) => void) {
    this.socket?.on('user:offline', callback)
  }

  onError(callback: (data: { message: string }) => void) {
    this.socket?.on('error', callback)
  }

  // Remove event listeners
  removeAllListeners(event: string) {
    this.socket?.removeAllListeners(event)
  }

  removeListener(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback)
  }
}

export const socketService = new SocketService()

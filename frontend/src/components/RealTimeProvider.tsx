import React, { createContext, useContext, useMemo } from 'react'
import { socketService } from '../services/socket'
import { Card, Comment } from '../types'

interface RealTimeContextType {
  connectToBoard: (boardId: string) => void
  disconnect: () => void
  onCardCreated: (cb: (card: Card) => void) => void
  onCardUpdated: (cb: (card: Card) => void) => void
  onCardMoved: (cb: (card: Card) => void) => void
  onCardDeleted: (cb: (data: { cardId: string }) => void) => void
  onCommentCreated: (cb: (comment: Comment) => void) => void
  emitCardCreate: (data: { listId: string; card: any }) => void
  emitCardUpdate: (data: { cardId: string; updates: any }) => void
  emitCardMove: (data: { cardId: string; listId: string; position: number }) => void
  emitCardDelete: (data: { cardId: string }) => void
  emitCommentCreate: (data: { cardId: string; content: string }) => void
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined)

export const useRealTime = () => {
  const ctx = useContext(RealTimeContext)
  if (!ctx) throw new Error('useRealTime must be used within RealTimeProvider')
  return ctx
}

export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<RealTimeContextType>(() => ({
    connectToBoard: (boardId: string) => {
      socketService.connect(boardId)
    },
    disconnect: () => socketService.disconnect(),
    onCardCreated: (cb) => socketService.onCardCreated(cb),
    onCardUpdated: (cb) => socketService.onCardUpdated(cb),
    onCardMoved: (cb) => socketService.onCardMoved(cb),
    onCardDeleted: (cb) => socketService.onCardDeleted(cb),
    onCommentCreated: (cb) => socketService.onCommentCreated(cb),
    emitCardCreate: (data) => socketService.emitCardCreate(data),
    emitCardUpdate: (data) => socketService.emitCardUpdate(data),
    emitCardMove: (data) => socketService.emitCardMove(data),
    emitCardDelete: (data) => socketService.emitCardDelete(data),
    emitCommentCreate: (data) => socketService.emitCommentCreate(data),
  }), [])

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  )
}



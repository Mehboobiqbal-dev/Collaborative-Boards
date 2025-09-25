import { Request } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export interface BoardMemberRole {
  userId: string
  role: 'ADMIN' | 'MEMBER' | 'COMMENTER' | 'VIEWER'
}

export interface CardWithRelations {
  id: string
  title: string
  description?: string
  labels: string[]
  assigneeId?: string
  dueDate?: Date
  position: number
  version: number
  listId: string
  assignee?: {
    id: string
    name: string
    email: string
  }
  attachments: Array<{
    id: string
    filename: string
    path: string
    mimeType: string
    size: number
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: Date
    author: {
      id: string
      name: string
      email: string
    }
  }>
}

export interface BoardWithRelations {
  id: string
  title: string
  ownerId: string
  owner: {
    id: string
    name: string
    email: string
  }
  members: Array<{
    id: string
    userId: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  lists: Array<{
    id: string
    title: string
    position: number
    cards: CardWithRelations[]
  }>
}

export interface NotificationPayload {
  boardId?: string
  cardId?: string
  userId?: string
  message?: string
}

export interface SearchFilters {
  query?: string
  labels?: string[]
  assignee?: string
  dueFrom?: Date
  dueTo?: Date
  boardId?: string
  listId?: string
}

export interface SocketUser {
  id: string
  boardId: string
}

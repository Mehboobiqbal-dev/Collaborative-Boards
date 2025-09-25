export interface User {
  id: string
  name: string
  email: string
  verified: boolean
  createdAt: string
}

export interface Board {
  id: string
  title: string
  ownerId: string
  owner: User
  members: BoardMember[]
  lists: List[]
}

export interface BoardMember {
  id: string
  userId: string
  role: 'ADMIN' | 'MEMBER' | 'COMMENTER' | 'VIEWER'
  user: User
}

export interface List {
  id: string
  boardId: string
  title: string
  position: number
  cards: Card[]
}

export interface Card {
  id: string
  listId: string
  title: string
  description?: string
  labels: string[]
  assigneeId?: string
  assignee?: User
  dueDate?: string
  position: number
  version: number
  attachments: Attachment[]
  comments: Comment[]
}

export interface Comment {
  id: string
  cardId: string
  content: string
  createdAt: string
  author: User
}

export interface Attachment {
  id: string
  cardId: string
  filename: string
  path: string
  mimeType: string
  size: number
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'MENTION' | 'ASSIGNMENT' | 'COMMENT' | 'MEMBER_ADDED' | 'MEMBER_REMOVED'
  payload: any
  read: boolean
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  name: string
}

export interface CardFilters {
  query?: string
  labels?: string[]
  assignee?: string
  dueFrom?: Date
  dueTo?: Date
  boardId?: string
  listId?: string
}

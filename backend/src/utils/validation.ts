import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  token: z.string().min(1, 'Verification token is required'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
})

export const updateBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
})

export const addBoardMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'MEMBER', 'COMMENTER', 'VIEWER']).default('MEMBER'),
})

export const updateBoardMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'COMMENTER', 'VIEWER']),
})

export const createListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  position: z.number().min(0).optional(),
})

export const updateListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  position: z.number().min(0).optional(),
})

export const createCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(10000, 'Description too long').optional(),
  labels: z.array(z.string()).default([]),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

export const updateCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(10000, 'Description too long').optional(),
  labels: z.array(z.string()).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  position: z.number().min(0).optional(),
  listId: z.string().optional(),
})

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
})

export const searchCardsSchema = z.object({
  query: z.string().optional(),
  labels: z.string().optional(),
  assignee: z.string().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  boardId: z.string().optional(),
  listId: z.string().optional(),
  limit: z.string().transform(Number).refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  offset: z.string().transform(Number).refine((n) => n >= 0, 'Offset must be non-negative').optional(),
})

export const markNotificationReadSchema = z.object({
  read: z.boolean().default(true),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>
export type AddBoardMemberInput = z.infer<typeof addBoardMemberSchema>
export type UpdateBoardMemberInput = z.infer<typeof updateBoardMemberSchema>
export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type SearchCardsInput = z.infer<typeof searchCardsSchema>
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>

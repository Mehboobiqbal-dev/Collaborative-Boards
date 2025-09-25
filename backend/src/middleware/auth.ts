import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/auth'
import { AuthRequest } from '../types'
import logger from '../utils/logger'

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  const decoded = verifyAccessToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired access token' })
  }

  req.user = { id: decoded.userId, email: decoded.email }
  next()
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    logger.warn('Authentication middleware not applied before requireAuth')
    return res.status(500).json({ error: 'Authentication required' })
  }
  next()
}

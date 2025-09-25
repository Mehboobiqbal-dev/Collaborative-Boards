import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import logger from '../utils/logger'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    })
  }

  if (error.message.includes('not found')) {
    return res.status(404).json({ error: error.message })
  }

  if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
    return res.status(403).json({ error: error.message })
  }

  if (error.message.includes('already exists') || error.message.includes('duplicate')) {
    return res.status(409).json({ error: error.message })
  }

  res.status(500).json({
    error: 'Internal server error',
  })
}

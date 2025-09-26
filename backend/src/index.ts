import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'express-async-errors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { errorHandler } from './middleware/errorHandler'
import { generalRateLimit } from './middleware/rateLimit'
import authRoutes from './routes/auth'
import boardRoutes from './routes/boards'
import listRoutes from './routes/lists'
import cardRoutes from './routes/cards'
import commentRoutes from './routes/comments'
import userRoutes from './routes/users'
import notificationRoutes from './routes/notifications'
import uploadRoutes from './routes/uploads'
import logger from './utils/logger'
import { setupSocketIO } from './socket'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

app.use(helmet())
app.use(cors({
  origin: [
    'https://collaborativeboard.vercel.app',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(generalRateLimit)

app.use('/api/auth', authRoutes)
app.use('/api/boards', boardRoutes)
app.use('/api', listRoutes)
app.use('/api/cards', cardRoutes)
app.use('/api', commentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/uploads', uploadRoutes)

app.use('/uploads', express.static(process.env.UPLOAD_PATH || './uploads'))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

setupSocketIO(io)

const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

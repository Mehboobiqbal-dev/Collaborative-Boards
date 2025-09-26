import { promises as fs } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { cacheService } from '../utils/cache'
import logger from '../utils/logger'
import { Multer } from 'multer'

const prisma = new PrismaClient()

export class UploadService {
  private uploadPath: string

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads'
  }

  async saveFile(cardId: string, userId: string, file: Multer.File) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        list: {
          select: { boardId: true },
        },
      },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    await this.checkBoardAccess(card.list.boardId, userId)

    await this.validateFile(file)

    const fileName = `${Date.now()}-${file.originalname}`
    const filePath = path.join(this.uploadPath, fileName)

    await fs.mkdir(this.uploadPath, { recursive: true })
    await fs.writeFile(filePath, file.buffer)

    const attachment = await prisma.attachment.create({
      data: {
        cardId,
        filename: file.originalname,
        path: filePath,
        mimeType: file.mimetype,
        size: file.size,
      },
    })

    await cacheService.invalidateBoardCache(card.list.boardId)

    logger.info('File uploaded', {
      attachmentId: attachment.id,
      cardId,
      userId,
      filename: file.originalname,
      size: file.size,
    })

    return attachment
  }

  async deleteFile(attachmentId: string, userId: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        card: {
          select: {
            list: {
              select: { boardId: true },
            },
          },
        },
      },
    })

    if (!attachment) {
      throw new Error('Attachment not found')
    }

    await this.checkBoardAccess(attachment.card.list.boardId, userId)

    try {
      await fs.unlink(attachment.path)
    } catch (error) {
      logger.warn('Failed to delete file from disk', { path: attachment.path, error })
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    })

    await cacheService.invalidateBoardCache(attachment.card.list.boardId)

    logger.info('File deleted', { attachmentId, userId })

    return { message: 'File deleted successfully' }
  }

  async getFileStream(attachmentId: string, userId: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        card: {
          select: {
            list: {
              select: { boardId: true },
            },
          },
        },
      },
    })

    if (!attachment) {
      throw new Error('Attachment not found')
    }

    await this.checkBoardAccess(attachment.card.list.boardId, userId)

    return {
      stream: await fs.readFile(attachment.path),
      filename: attachment.filename,
      mimeType: attachment.mimeType,
    }
  }

  private async validateFile(file: Multer.File) {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',')
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed')
    }

    if (file.size > maxSize) {
      throw new Error('File size exceeds limit')
    }
  }

  private async checkBoardAccess(boardId: string, userId: string) {
    const member = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    })

    if (!member) {
      throw new Error('Access denied: not a board member')
    }
  }
}

export const uploadService = new UploadService()

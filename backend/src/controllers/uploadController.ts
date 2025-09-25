import { Response } from 'express'
import { uploadService } from '../services/uploadService'
import { AuthRequest } from '../types'

export const uploadFile = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  const attachment = await uploadService.saveFile(
    req.params.cardId,
    req.user!.id,
    req.file
  )

  res.status(201).json(attachment)
}

export const deleteFile = async (req: AuthRequest, res: Response) => {
  const result = await uploadService.deleteFile(req.params.attachmentId, req.user!.id)

  res.json(result)
}

export const downloadFile = async (req: AuthRequest, res: Response) => {
  const fileData = await uploadService.getFileStream(
    req.params.attachmentId,
    req.user!.id
  )

  res.setHeader('Content-Type', fileData.mimeType)
  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`)

  res.send(fileData.stream)
}

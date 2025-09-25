import { Router } from 'express'
import multer from 'multer'
import {
  uploadFile,
  deleteFile,
  downloadFile,
} from '../controllers/uploadController'
import { authenticateToken } from '../middleware/auth'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  },
})

router.use(authenticateToken)

router.post('/cards/:cardId/attachments', upload.single('file'), uploadFile)
router.delete('/attachments/:attachmentId', deleteFile)
router.get('/attachments/:attachmentId/download', downloadFile)

export default router

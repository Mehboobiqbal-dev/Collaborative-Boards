import { Router } from 'express'
import {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
} from '../controllers/authController'
import { validateRequest } from '../middleware/validation'
import { authRateLimit } from '../middleware/rateLimit'
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} from '../utils/validation'

const router = Router()

router.post('/signup', authRateLimit, validateRequest(signupSchema), signup)
router.post('/verify', validateRequest(verifyEmailSchema), verifyEmail)
router.post('/login', authRateLimit, validateRequest(loginSchema), login)
router.post('/refresh', authRateLimit, validateRequest(refreshTokenSchema), refresh)
router.post('/logout', validateRequest(refreshTokenSchema), logout)

export default router

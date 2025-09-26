import { Router } from 'express'
import { signup, login, refresh, logout, loginWithGoogle, googleAuth, googleCallback } from '../controllers/authController'
import { validateRequest } from '../middleware/validation'
import { authRateLimit } from '../middleware/rateLimit'
import { signupSchema, loginSchema, refreshTokenSchema, googleLoginSchema } from '../utils/validation'

const router = Router()

router.post('/signup', authRateLimit, validateRequest(signupSchema), signup)
router.post('/login', authRateLimit, validateRequest(loginSchema), login)
router.post('/google', authRateLimit, validateRequest(googleLoginSchema), loginWithGoogle)
router.get('/google', googleAuth)
router.get('/google/callback', googleCallback)
router.post('/refresh', authRateLimit, validateRequest(refreshTokenSchema), refresh)
router.post('/logout', validateRequest(refreshTokenSchema), logout)

export default router

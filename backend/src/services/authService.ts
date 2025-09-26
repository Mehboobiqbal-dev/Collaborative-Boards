import { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword, generateTokens, hashRefreshToken } from '../utils/auth'
import logger from '../utils/logger'
import { OAuth2Client } from 'google-auth-library'

const prisma = new PrismaClient()

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export class AuthService {
  async signup(email: string, password: string, name: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        verified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        verified: true,
        createdAt: true,
      },
    })

    logger.info('User signed up', { userId: user.id, email })

    return { user }
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValidPassword = await verifyPassword(user.passwordHash, password)
    if (!isValidPassword) {
      logger.warn('Failed login attempt', { email })
      throw new Error('Invalid credentials')
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email)
    const refreshTokenHash = await hashRefreshToken(refreshToken)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    logger.info('User logged in', { userId: user.id, email })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  }

  async refreshToken(refreshToken: string) {
    const tokenHash = await hashRefreshToken(refreshToken)

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token')
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      storedToken.user.id,
      storedToken.user.email
    )
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken)

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revoked: true,
      },
    })

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    logger.info('Token refreshed', { userId: storedToken.user.id })

    return {
      accessToken,
      refreshToken: newRefreshToken,
    }
  }

  async logout(refreshToken: string) {
    const tokenHash = await hashRefreshToken(refreshToken)

    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    })

    logger.info('User logged out', { tokenHash: tokenHash.substring(0, 8) + '...' })

    return { message: 'Logged out successfully' }
  }

  async loginWithGoogle(code: string) {
    try {
      // Exchange authorization code for tokens
      const { tokens } = await googleClient.getToken(code)
      
      if (!tokens.id_token) {
        throw new Error('Invalid Google token response')
      }

      // Verify the ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      if (!payload?.email) {
        throw new Error('Invalid Google token payload')
      }

      const email = payload.email
      const name = payload.name || email.split('@')[0]
      const googleId = payload.sub

      let user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            passwordHash: '',
            verified: true,
            googleId,
          },
        })
      } else if (!user.googleId) {
        // Link existing account with Google ID if not already linked
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        })
      }

      if (!user) {
        throw new Error('Failed to create or update user')
      }

      const { accessToken, refreshToken } = generateTokens(user.id, user.email)
      const refreshTokenHash = await hashRefreshToken(refreshToken)

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      logger.info('User logged in with Google', { userId: user.id, email: user.email })

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }
    } catch (error) {
      logger.error('Google OAuth login failed', { error })
      throw new Error('Google authentication failed')
    }
  }

  // Generate Google OAuth URL for frontend redirect
  getGoogleAuthUrl() {
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
    })
    return authUrl
  }
}

// Route handlers
export const authRoutes = {
  signup: async (req: any, res: any) => {
    try {
      const { email, password, name } = req.body
      const result = await authService.signup(email, password, name)
      res.status(201).json(result)
    } catch (error: any) {
      logger.error('Signup failed', { error })
      res.status(400).json({ error: error.message })
    }
  },

  login: async (req: any, res: any) => {
    try {
      const { email, password } = req.body
      const result = await authService.login(email, password)
      res.json(result)
    } catch (error: any) {
      logger.error('Login failed', { error })
      res.status(401).json({ error: error.message })
    }
  },

  refresh: async (req: any, res: any) => {
    try {
      const { refreshToken } = req.body
      const result = await authService.refreshToken(refreshToken)
      res.json(result)
    } catch (error: any) {
      logger.error('Token refresh failed', { error })
      res.status(401).json({ error: error.message })
    }
  },

  logout: async (req: any, res: any) => {
    try {
      const { refreshToken } = req.body
      const result = await authService.logout(refreshToken)
      res.json(result)
    } catch (error: any) {
      logger.error('Logout failed', { error })
      res.status(400).json({ error: error.message })
    }
  },

  googleAuth: async (req: any, res: any) => {
    try {
      const authUrl = authService.getGoogleAuthUrl()
      res.json({ authUrl })
    } catch (error: any) {
      logger.error('Google auth URL generation failed', { error })
      res.status(500).json({ error: 'Failed to generate Google auth URL' })
    }
  },

  googleCallback: async (req: any, res: any) => {
    try {
      const { code } = req.query
      const result = await authService.loginWithGoogle(code)
      res.json(result)
    } catch (error: any) {
      logger.error('Google callback failed', { error })
      res.status(401).json({ error: 'Google authentication failed' })
    }
  },
}

export const authService = new AuthService()

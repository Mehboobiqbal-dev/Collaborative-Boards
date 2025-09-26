import { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword, generateTokens, hashRefreshToken } from '../utils/auth'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import logger from '../utils/logger'

const prisma = new PrismaClient()

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

    // No email verification required

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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

  async loginWithGoogle(idToken: string) {
    // Verify Google ID token via Google tokeninfo (simple server-side validation)
    const response = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: idToken },
    })

    const googleData = response.data as any
    const email: string = googleData.email
    const name: string = googleData.name || email.split('@')[0]

    if (!email) {
      throw new Error('Invalid Google token')
    }

    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: '',
          verified: true,
        },
      })
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
}

export const authService = new AuthService()

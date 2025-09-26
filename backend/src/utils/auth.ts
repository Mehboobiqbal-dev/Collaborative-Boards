import jwt from 'jsonwebtoken'
import argon2 from 'argon2'
import crypto from 'crypto'

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password)
}

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

export const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' } as any
  )

  const refreshToken = crypto.randomBytes(40).toString('hex')

  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string; email: string }
  } catch {
    return null
  }
}

export const hashRefreshToken = async (token: string): Promise<string> => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

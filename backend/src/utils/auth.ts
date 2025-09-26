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
  console.log('Generating token with secret:', process.env.JWT_ACCESS_SECRET ? 'SET' : 'NOT SET')
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
    console.log('Verifying token with secret:', process.env.JWT_ACCESS_SECRET ? 'SET' : 'NOT SET')
    console.log('Secret length:', process.env.JWT_ACCESS_SECRET?.length)
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string; email: string }
    console.log('Token verified successfully for user:', decoded.email)
    return decoded
  } catch (error) {
    console.log('Token verification failed:', error)
    console.log('Token being verified:', token.substring(0, 50) + '...')
    return null
  }
}

export const hashRefreshToken = async (token: string): Promise<string> => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

import { Request, Response } from 'express'
import { authService } from '../services/authService'
import { AuthRequest } from '../types'

export const signup = async (req: Request, res: Response) => {
  const { user, verificationToken } = await authService.signup(
    req.body.email,
    req.body.password,
    req.body.name
  )

  res.status(201).json({
    message: 'User created successfully. Please verify your email.',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      verified: user.verified,
    },
    verificationToken,
  })
}

export const verifyEmail = async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.email, req.body.token)

  res.json({ message: 'Email verified successfully' })
}

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password)

  res.json(result)
}

export const refresh = async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken)

  res.json(result)
}

export const logout = async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken)

  res.json({ message: 'Logged out successfully' })
}

import { Request, Response } from 'express'
import { authService } from '../services/authService'

export const signup = async (req: Request, res: Response) => {
  const { user } = await authService.signup(
    req.body.email,
    req.body.password,
    req.body.name
  )

  res.status(201).json({
    message: 'User created successfully.',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      verified: user.verified,
    },
  })
}

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password)

  res.json(result)
}

export const loginWithGoogle = async (req: Request, res: Response) => {
  const result = await authService.loginWithGoogle(req.body.idToken)
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

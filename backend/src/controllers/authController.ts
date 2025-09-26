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

export const googleAuth = async (req: Request, res: Response) => {
  const authUrl = authService.getGoogleAuthUrl()
  res.redirect(authUrl)
}

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' })
    }

    const result = await authService.loginWithGoogle(code)
    
    // Redirect to frontend with tokens (in production, use secure cookies or session)
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?access_token=${result.accessToken}&refresh_token=${result.refreshToken}`
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    res.status(400).json({ error: 'Google authentication failed' })
  }
}

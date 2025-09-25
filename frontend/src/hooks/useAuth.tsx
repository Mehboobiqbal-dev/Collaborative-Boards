import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthTokens } from '../types'
import { apiService } from '../services/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<string>
  verifyEmail: (email: string, token: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const userData = await apiService.getCurrentUser()
          setUser(userData)
        } catch (err) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      const tokens = await apiService.login({ email, password })
      setUser(tokens.user)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string): Promise<string> => {
    try {
      setError(null)
      setLoading(true)
      const result = await apiService.signup({ email, password, name })
      return result.verificationToken
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (email: string, token: string) => {
    try {
      setError(null)
      setLoading(true)
      await apiService.verifyEmail(email, token)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Email verification failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (err) {
    } finally {
      setUser(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  const value: AuthContextType = {
    user,
    login,
    signup,
    verifyEmail,
    logout,
    loading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
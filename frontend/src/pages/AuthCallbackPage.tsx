import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const accessToken = urlParams.get('access_token')
      const refreshToken = urlParams.get('refresh_token')
      const error = urlParams.get('error')

      if (error) {
        console.error('OAuth error:', error)
        navigate('/login?error=oauth_failed')
        return
      }

      if (accessToken && refreshToken) {
        // Store tokens and redirect to dashboard
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Navigate to dashboard
        navigate('/dashboard')
      } else {
        // No tokens received, redirect to login
        navigate('/login?error=no_tokens')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage

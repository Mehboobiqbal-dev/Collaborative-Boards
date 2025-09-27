import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { showErrorToast, showSuccessToast } from '../utils/errorMessages'

const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const navigate = useNavigate()
  const [inviteDetails, setInviteDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchInviteDetails()
    } else {
      setError('Invalid invite link')
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated && user && inviteDetails && inviteDetails.board) {
      // User is logged in and invite is valid, redirect to board
      navigate(`/board/${inviteDetails.board.id}`)
    }
  }, [isAuthenticated, user, inviteDetails, navigate])

  const fetchInviteDetails = async () => {
    try {
      const details = await apiService.getInviteDetails(token!)
      setInviteDetails(details)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load invite details')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = `/invite/${token}`
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    setAccepting(true)
    try {
      await apiService.acceptInvite(token!)
      showSuccessToast('Successfully joined the board!')
      navigate(`/board/${inviteDetails.board.id}`)
    } catch (error: any) {
      showErrorToast(error.response?.data?.error || 'Failed to accept invite')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invite details...</p>
        </div>
      </div>
    )
  }

  if (error || !inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Invalid Invite</p>
            <p>{error || 'This invite link is invalid or has expired.'}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <h1 className="text-xl font-bold mb-2">You're Invited!</h1>
            <p className="text-sm">
              <strong>{inviteDetails.inviter.name}</strong> has invited you to join the board
            </p>
          </div>

          <div className="text-left mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {inviteDetails.board.title}
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              Role: <span className="font-medium capitalize">{inviteDetails.role.toLowerCase()}</span>
            </p>
            <p className="text-xs text-gray-500">
              Invited by: {inviteDetails.inviter.name} ({inviteDetails.inviter.email})
            </p>
            <p className="text-xs text-gray-500">
              Expires: {new Date(inviteDetails.expiresAt).toLocaleDateString()}
            </p>
          </div>

          {isAuthenticated ? (
            <button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {accepting ? 'Joining...' : 'Join Board'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You need to be logged in to accept this invite.
              </p>
              <button
                onClick={() => navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Login to Accept
              </button>
              <button
                onClick={() => navigate(`/signup?returnUrl=${encodeURIComponent(window.location.pathname)}`)}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvitePage

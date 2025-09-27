import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { showErrorToast, showSuccessToast } from '../utils/errorMessages'

interface Invite {
  id: string
  email: string
  role: string
  expiresAt: string
  board: {
    id: string
    title: string
  }
  inviter: {
    id: string
    name: string
    email: string
  }
}

interface PendingInvitesProps {
  onInviteAccepted: () => void
}

const PendingInvites: React.FC<PendingInvitesProps> = ({ onInviteAccepted }) => {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const response = await apiService.getUserInvites()
      setInvites(response.invites)
    } catch (error: any) {
      showErrorToast(error.response?.data?.error || 'Failed to load invites')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async (token: string) => {
    setAccepting(token)
    try {
      await apiService.acceptInvite(token)
      showSuccessToast('Successfully joined the board!')
      fetchInvites()
      onInviteAccepted()
    } catch (error: any) {
      showErrorToast(error.response?.data?.error || 'Failed to accept invite')
    } finally {
      setAccepting(null)
    }
  }

  const formatExpiryDate = (expiresAt: string) => {
    const date = new Date(expiresAt)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Expired'
    if (diffDays === 1) return 'Expires tomorrow'
    if (diffDays <= 7) return `Expires in ${diffDays} days`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Invites</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (invites.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Invites</h3>
      <div className="space-y-3">
        {invites.map((invite) => (
          <div key={invite.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{invite.board.title}</h4>
                <p className="text-sm text-gray-600">
                  Invited by <strong>{invite.inviter.name}</strong> as {invite.role.toLowerCase()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatExpiryDate(invite.expiresAt)}
                </p>
              </div>
              <button
                onClick={() => handleAcceptInvite(invite.id)}
                disabled={accepting === invite.id}
                className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {accepting === invite.id ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PendingInvites

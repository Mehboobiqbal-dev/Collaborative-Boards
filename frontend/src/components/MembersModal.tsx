import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { apiService } from '../services/api'
import { Board, BoardMember } from '../types'
import { showErrorToast, showSuccessToast, getErrorMessage } from '../utils/errorMessages'

interface MembersModalProps {
  board: Board
  onClose: () => void
  onBoardUpdate: (board: Board) => void
}

const MembersModal: React.FC<MembersModalProps> = ({ board, onClose, onBoardUpdate }) => {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER')
  const [loading, setLoading] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)

  useEffect(() => {
    loadPendingInvites()
  }, [])

  const loadPendingInvites = async () => {
    setLoadingInvites(true)
    try {
      const response = await apiService.getBoardInvites(board.id)
      setPendingInvites(response.invites)
    } catch (error) {
      console.error('Failed to load pending invites:', error)
    } finally {
      setLoadingInvites(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    try {
      await apiService.createBoardInvite(board.id, inviteEmail, inviteRole)
      setInviteEmail('')
      setInviteRole('MEMBER')
      showSuccessToast('Invite sent successfully! The user will receive an email invitation.')
      loadPendingInvites() // Refresh the pending invites list
    } catch (error) {
      console.error('Failed to invite member:', error)
      showErrorToast(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const updatedMember = await apiService.updateBoardMember(board.id, memberId, newRole)
      onBoardUpdate({
        ...board,
        members: board.members.map(m => m.id === memberId ? updatedMember : m)
      })
      showSuccessToast('Member role updated')
    } catch (error) {
      console.error('Failed to update role:', error)
      showErrorToast(getErrorMessage(error))
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const result = await Swal.fire({
      title: 'Remove Member',
      text: 'Are you sure you want to remove this member?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove them!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      await apiService.removeBoardMember(board.id, memberId)
      onBoardUpdate({
        ...board,
        members: board.members.filter(m => m.id !== memberId)
      })
      showSuccessToast('Member removed')
    } catch (error) {
      console.error('Failed to remove member:', error)
      showErrorToast(getErrorMessage(error))
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    const result = await Swal.fire({
      title: 'Cancel Invite',
      text: 'Are you sure you want to cancel this invitation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return

    try {
      await apiService.cancelInvite(inviteId)
      showSuccessToast('Invitation cancelled')
      loadPendingInvites() // Refresh the pending invites list
    } catch (error) {
      console.error('Failed to cancel invite:', error)
      showErrorToast(getErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div
        className="bg-white p-6 md:p-8 rounded-lg w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Manage Board Members</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Invite New Member</h4>
          <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Inviting...' : 'Invite'}
            </button>
          </form>
        </div>

        {pendingInvites.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Pending Invitations</h4>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 border border-yellow-200 rounded-md bg-yellow-50">
                  <div>
                    <div className="font-medium text-gray-900">{invite.email}</div>
                    <div className="text-xs text-gray-500">
                      Role: {invite.role} • Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCancelInvite(invite.id)}
                    className="btn btn-danger text-xs px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-700">Current Members</h4>
          <div className="mt-3 space-y-2">
            {board.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <div>
                  <div className="font-medium text-gray-900">{member.user.name}</div>
                  <div className="text-xs text-gray-500">{member.user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {member.userId === board.ownerId ? (
                    <span className="text-blue-600 font-semibold">Owner</span>
                  ) : (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button onClick={() => handleRemoveMember(member.id)} className="btn btn-danger text-xs px-2 py-1">
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MembersModal
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { apiService } from '../services/api'
import { socketService } from '../services/socket'
import { useAuth } from '../hooks/useAuth'
import { Board, Card, BoardMember, Comment, Attachment } from '../types'

interface CardModalProps {
  card: Card
  board: Board
  onClose: () => void
  onCardUpdate: (card: Card) => void
}

const CardModal: React.FC<CardModalProps> = ({ card, board, onClose, onCardUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [labels, setLabels] = useState<string[]>(card.labels || [])
  const [assigneeId, setAssigneeId] = useState(card.assigneeId || '')
  const [dueDate, setDueDate] = useState(card.dueDate || '')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Comment[]>(card.comments || [])
  const [attachments, setAttachments] = useState<Attachment[]>(card.attachments || [])
  const [loading, setLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const updates: any = {
        title,
        description: description || undefined,
        labels,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      }
      const updatedCard = await apiService.updateCard(card.id, updates)
      onCardUpdate(updatedCard)
      setEditing(false)
    } catch (error) {
      console.error('Failed to update card:', error)
      alert('Failed to update card')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setCommentLoading(true)
    try {
      const comment = await apiService.addComment(card.id, newComment)
      setComments(prev => [comment, ...prev])
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadLoading(true)
    try {
      const attachment = await apiService.uploadAttachment(card.id, file)
      setAttachments(prev => [...prev, attachment])
      const updatedCard = await apiService.getCard(card.id)
      onCardUpdate(updatedCard)
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert('Failed to upload file')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await apiService.deleteAttachment(attachmentId)
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      const updatedCard = await apiService.getCard(card.id)
      onCardUpdate(updatedCard)
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      alert('Failed to delete attachment')
    }
  }

  const toggleLabel = (label: string) => {
    setLabels(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  const availableLabels = ['bug', 'feature', 'enhancement', 'urgent', 'low-priority']

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            {editing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ fontSize: '1.5rem', fontWeight: 'bold', border: '1px solid #ddd', padding: '0.5rem', width: '100%' }}
              />
            ) : (
              <h2 style={{ margin: '0 0 1rem 0' }}>{card.title}</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn btn-secondary">
                Edit
              </button>
            )}
            {editing && (
              <>
                <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
              ×
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3>Description</h3>
              {editing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  style={{ width: '100%', minHeight: '100px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px' }}>
                  {description || <em>No description</em>}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3>Comments</h3>
              <form onSubmit={handleAddComment} style={{ marginBottom: '1rem' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{ width: '100%', minHeight: '80px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}
                />
                <button type="submit" className="btn btn-primary" disabled={commentLoading}>
                  {commentLoading ? 'Adding...' : 'Add Comment'}
                </button>
              </form>

              <div>
                {comments.map((comment) => (
                  <div key={comment.id} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{comment.author.name}</strong>
                      <small>{new Date(comment.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div>{comment.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h4>Labels</h4>
              {editing ? (
                <div>
                  {availableLabels.map((label) => (
                    <label key={label} style={{ display: 'block', marginBottom: '0.25rem' }}>
                      <input
                        type="checkbox"
                        checked={labels.includes(label)}
                        onChange={() => toggleLabel(label)}
                      />
                      <span style={{ marginLeft: '0.5rem' }}>{label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {labels.length > 0 ? labels.map((label) => (
                    <span key={label} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e9ecef', borderRadius: '12px', fontSize: '0.8rem' }}>
                      {label}
                    </span>
                  )) : <em>No labels</em>}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4>Assignee</h4>
              {editing ? (
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Unassigned</option>
                  {board.members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div>{card.assignee ? card.assignee.name : 'Unassigned'}</div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4>Due Date</h4>
              {editing ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                <div>{dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}</div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4>Attachments</h4>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  style={{ marginBottom: '0.5rem' }}
                />
                {uploadLoading && <div>Uploading...</div>}
              </div>

              <div>
                {attachments.map((attachment) => (
                  <div key={attachment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.25rem' }}>
                    <a href={`/uploads/${attachment.filename}`} target="_blank" rel="noopener noreferrer">
                      {attachment.filename}
                    </a>
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MembersModalProps {
  board: Board
  onClose: () => void
  onBoardUpdate: (board: Board) => void
}

const MembersModal: React.FC<MembersModalProps> = ({ board, onClose, onBoardUpdate }) => {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'COMMENTER' | 'VIEWER'>('MEMBER')
  const [loading, setLoading] = useState(false)

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    try {
      const member = await apiService.addBoardMember(board.id, inviteEmail, inviteRole)
      onBoardUpdate({
        ...board,
        members: [...board.members, member]
      })
      setInviteEmail('')
      setInviteRole('MEMBER')
    } catch (error) {
      console.error('Failed to invite member:', error)
      alert('Failed to invite member')
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
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      await apiService.removeBoardMember(board.id, memberId)
      onBoardUpdate({
        ...board,
        members: board.members.filter(m => m.id !== memberId)
      })
    } catch (error) {
      console.error('Failed to remove member:', error)
      alert('Failed to remove member')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Manage Board Members</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4>Invite New Member</h4>
          <form onSubmit={handleInviteMember}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={{ flex: 1, padding: '0.5rem' }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'COMMENTER' | 'VIEWER')}
                style={{ padding: '0.5rem' }}
              >
                <option value="VIEWER">Viewer</option>
                <option value="COMMENTER">Commenter</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Inviting...' : 'Invite Member'}
            </button>
          </form>
        </div>

        <div>
          <h4>Current Members</h4>
          <div style={{ marginTop: '1rem' }}>
            {board.members.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{member.user.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>{member.user.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {member.userId === board.ownerId ? (
                    <span style={{ fontWeight: 'bold', color: '#007bff' }}>Owner</span>
                  ) : (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        style={{ padding: '0.25rem' }}
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="COMMENTER">Commenter</option>
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
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

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const getUserRole = (): string | null => {
    if (!user || !board) return null
    const member = board.members.find((m: BoardMember) => m.userId === user.id)
    return member ? member.role : null
  }

  const canManageMembers = (): boolean => {
    const role = getUserRole()
    return role === 'ADMIN' || board?.ownerId === user?.id
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return

    const { source, destination, draggableId } = result

    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const sourceList = board.lists.find(list => list.id === source.droppableId)
    const destList = board.lists.find(list => list.id === destination.droppableId)

    if (!sourceList || !destList) return

    const draggedCard = sourceList.cards[source.index]
    if (!draggedCard) return

    try {
      // Optimistic update
      const newBoard = { ...board }
      const newSourceList = { ...sourceList }
      const newDestList = { ...destList }

      // Remove card from source list
      newSourceList.cards = newSourceList.cards.filter(card => card.id !== draggableId)

      // Add card to destination list
      const updatedCard = { ...draggedCard, listId: destination.droppableId }
      newDestList.cards = [...newDestList.cards]
      newDestList.cards.splice(destination.index, 0, updatedCard)

      // Update board
      newBoard.lists = newBoard.lists.map(list => {
        if (list.id === source.droppableId) return newSourceList
        if (list.id === destination.droppableId) return newDestList
        return list
      })

      setBoard(newBoard)

      // Call API to persist the change
      await apiService.moveCard(draggedCard.id, destination.droppableId, destination.index)

      // Emit socket event
      socketService.emitCardMove({
        cardId: draggedCard.id,
        listId: destination.droppableId,
        position: destination.index
      })

    } catch (error) {
      console.error('Failed to move card:', error)
      // Revert optimistic update by reloading board
      loadBoard()
    }
  }

  useEffect(() => {
    if (boardId) {
      loadBoard()
      socketService.connect(boardId)

      socketService.onCardCreated((card: Card) => {
        setBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list =>
            list.id === card.listId
              ? { ...list, cards: [...list.cards, card] }
              : list
          )
        } : null)
      })

      socketService.onCardUpdated((updatedCard: Card) => {
        setBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.cards.map(card =>
              card.id === updatedCard.id ? updatedCard : card
            )
          }))
        } : null)
      })

      socketService.onCardMoved((movedCard: Card) => {
        setBoard(prev => prev ? {
          ...prev,
          lists: prev.lists.map(list => ({
            ...list,
            cards: list.cards.filter(card => card.id !== movedCard.id)
          })).map(list =>
            list.id === movedCard.listId
              ? { ...list, cards: [...list.cards, movedCard] }
              : list
          )
        } : null)
      })

      return () => {
        socketService.disconnect()
      }
    }
  }, [boardId])

  const loadBoard = async () => {
    if (!boardId) return

    try {
      const boardData = await apiService.getBoard(boardId)
      setBoard(boardData)
    } catch (error) {
      console.error('Failed to load board:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCard = async (listId: string) => {
    const title = prompt('Enter card title:')
    if (!title) return

    try {
      const card = await apiService.createCard(listId, {
        title,
      })
      socketService.emitCardCreate({ listId, card })
    } catch (error) {
      console.error('Failed to create card:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!board) {
    return <div>Board not found</div>
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
        <h1 style={{ margin: '1rem 0' }}>{board.title}</h1>
        {canManageMembers() && (
          <button
            onClick={() => setShowMembersModal(true)}
            className="btn btn-primary"
            style={{ marginLeft: '1rem' }}
          >
            Manage Members
          </button>
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        overflowX: 'auto',
        padding: '1rem 0'
      }}>
        {board.lists.map((list) => (
          <div
            key={list.id}
            style={{
              minWidth: '300px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '1rem'
            }}
          >
            <h3>{list.title}</h3>
            <div style={{ marginBottom: '1rem' }}>
              {list.cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedCard(card)}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{card.title}</h4>
                  {card.description && (
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                      {card.description.length > 100
                        ? card.description.substring(0, 100) + '...'
                        : card.description}
                    </p>
                  )}
                  {card.labels.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      {card.labels.map((label, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#e9ecef',
                            borderRadius: '12px',
                            fontSize: '0.8rem'
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => handleCreateCard(list.id)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              + Add Card
            </button>
          </div>
        ))}
      </div>

      {showMembersModal && (
        <MembersModal
          board={board}
          onClose={() => setShowMembersModal(false)}
          onBoardUpdate={setBoard}
        />
      )}

      {selectedCard && (
        <CardModal
          card={selectedCard}
          board={board}
          onClose={() => setSelectedCard(null)}
          onCardUpdate={(updatedCard) => {
            setBoard(prev => prev ? {
              ...prev,
              lists: prev.lists.map(list => ({
                ...list,
                cards: list.cards.map(card =>
                  card.id === updatedCard.id ? updatedCard : card
                )
              }))
            } : null)
          }}
        />
      )}
    </div>
  )
}

export default BoardPage

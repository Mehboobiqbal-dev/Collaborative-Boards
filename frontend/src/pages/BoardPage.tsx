import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import ReactMarkdown from 'react-markdown'
import { apiService } from '../services/api'
import { socketService } from '../services/socket'
import { useAuth } from '../hooks/useAuth'
import { Board, Card, BoardMember, Comment, Attachment, List } from '../types'
import { showErrorToast, showSuccessToast } from '../utils/errorMessages'
import { BoardSkeleton } from '../components/Skeleton'

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
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionPosition, setMentionPosition] = useState(0)

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
      showSuccessToast('Card updated successfully')
    } catch (error) {
      console.error('Failed to update card:', error)
      showErrorToast('Failed to update card')
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
      setComments(prev => [comment as unknown as Comment, ...prev])
      setNewComment('')
      showSuccessToast('Comment added')
    } catch (error) {
      console.error('Failed to add comment:', error)
      showErrorToast('Failed to add comment')
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

  const handleCommentChange = (value: string) => {
    setNewComment(value)

    const cursorPos = value.length // Simple cursor position tracking
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setMentionPosition(cursorPos - mentionMatch[0].length)
      setShowMentions(true)
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }

  const handleMentionSelect = (user: { id: string; name: string }) => {
    const beforeMention = newComment.substring(0, mentionPosition)
    const afterMention = newComment.substring(mentionPosition + mentionQuery.length + 1)
    const mentionText = `@${user.name} `

    setNewComment(beforeMention + mentionText + afterMention)
    setShowMentions(false)
    setMentionQuery('')
  }

  const filteredMembers = board.members.filter(member =>
    member.user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-lg w-full max-w-4xl max-h-90vh overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border border-gray-300 p-2 w-full rounded"
              />
            ) : (
              <h2 className="text-2xl font-bold mb-4">{card.title}</h2>
            )}
          </div>
          <div className="flex gap-2">
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
            <button onClick={onClose} className="text-2xl hover:bg-gray-100 px-2 rounded">
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
                  {description ? <ReactMarkdown>{description}</ReactMarkdown> : <em>No description</em>}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3>Comments</h3>
              <div className="relative">
                <form onSubmit={handleAddComment} style={{ marginBottom: '1rem' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    placeholder="Add a comment... Use @ to mention someone"
                    className="w-full min-h-20 p-3 border border-gray-300 rounded-md mb-2 resize-none"
                  />
                  <button type="submit" className="btn btn-primary" disabled={commentLoading}>
                    {commentLoading ? 'Adding...' : 'Add Comment'}
                  </button>
                </form>

                {showMentions && filteredMembers.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.userId}
                        onClick={() => handleMentionSelect(member.user)}
                        className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    labels: [] as string[],
    assignee: '',
    dueFrom: '',
    dueTo: '',
  })
  const [filteredCards, setFilteredCards] = useState<Card[]>([])
  const [showAddList, setShowAddList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editingListTitle, setEditingListTitle] = useState('')
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

  // Filter cards based on search and filters
  useEffect(() => {
    if (!board) return

    let filtered = board.lists.flatMap(list => list.cards)

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(card =>
        card.title.toLowerCase().includes(query) ||
        card.description?.toLowerCase().includes(query)
      )
    }

    if (filters.labels.length > 0) {
      filtered = filtered.filter(card =>
        filters.labels.some(label => card.labels.includes(label))
      )
    }

    if (filters.assignee) {
      filtered = filtered.filter(card => card.assigneeId === filters.assignee)
    }

    if (filters.dueFrom) {
      const dueFrom = new Date(filters.dueFrom)
      filtered = filtered.filter(card =>
        card.dueDate && new Date(card.dueDate) >= dueFrom
      )
    }

    if (filters.dueTo) {
      const dueTo = new Date(filters.dueTo)
      filtered = filtered.filter(card =>
        card.dueDate && new Date(card.dueDate) <= dueTo
      )
    }

    setFilteredCards(filtered)
  }, [board, searchQuery, filters])

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
      // Use destination index as position - backend will handle proper positioning
      const newPosition = destination.index

      // Optimistic update
      const newBoard = { ...board }
      const newSourceList = { ...sourceList }
      const newDestList = { ...destList }

      // Remove card from source list
      newSourceList.cards = newSourceList.cards.filter(card => card.id !== draggableId)

      // Add card to destination list
      const updatedCard = { ...draggedCard, listId: destination.droppableId, position: newPosition }
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
      await apiService.moveCard(draggedCard.id, destination.droppableId, newPosition)

      // Emit socket event
      socketService.emitCardMove({
        cardId: draggedCard.id,
        listId: destination.droppableId,
        position: newPosition
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

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim() || !board) return

    try {
      const newList = await apiService.createList(board.id, newListTitle)
      setBoard(prev => prev ? {
        ...prev,
        lists: [...prev.lists, newList]
      } : null)
      setNewListTitle('')
      setShowAddList(false)
    } catch (error) {
      console.error('Failed to create list:', error)
      alert('Failed to create list')
    }
  }

  const handleUpdateList = async (listId: string, newTitle: string) => {
    try {
      await apiService.updateList(listId, { title: newTitle })
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.map(list =>
          list.id === listId ? { ...list, title: newTitle } : list
        )
      } : null)
      setEditingListId(null)
      setEditingListTitle('')
    } catch (error) {
      console.error('Failed to update list:', error)
      alert('Failed to update list')
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All cards will be lost.')) return

    try {
      await apiService.deleteList(listId)
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.filter(list => list.id !== listId)
      } : null)
    } catch (error) {
      console.error('Failed to delete list:', error)
      alert('Failed to delete list')
    }
  }

  const startEditingList = (list: any) => {
    setEditingListId(list.id)
    setEditingListTitle(list.title)
  }

  const cancelEditingList = () => {
    setEditingListId(null)
    setEditingListTitle('')
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <BoardSkeleton />
      </div>
    )
  }

  if (!board) {
    return <div className="p-4">Board not found</div>
  }

  return (
    <div>
      <div className="mb-8">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary mb-4">
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-6">{board.title}</h1>

        {/* Search and Filter Bar */}
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Filters {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v) && '●'}
          </button>
          {canManageMembers() && (
            <button
              onClick={() => setShowMembersModal(true)}
              className="btn btn-primary"
            >
              Manage Members
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
                <div className="space-y-1">
                  {['bug', 'feature', 'enhancement', 'urgent', 'low-priority'].map((label) => (
                    <label key={label} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.labels.includes(label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, labels: [...prev.labels, label] }))
                          } else {
                            setFilters(prev => ({ ...prev, labels: prev.labels.filter(l => l !== label) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  value={filters.assignee}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All assignees</option>
                  {board?.members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due From</label>
                <input
                  type="date"
                  value={filters.dueFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dueFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due To</label>
                <input
                  type="date"
                  value={filters.dueTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dueTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setFilters({ labels: [], assignee: '', dueFrom: '', dueTo: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Found {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
        {board.lists.map((list) => (
          <div
            key={list.id}
              className="min-w-72 bg-gray-50 rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                {editingListId === list.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleUpdateList(list.id, editingListTitle)
                    }}
                    className="flex-1 mr-2"
                  >
                    <input
                      type="text"
                      value={editingListTitle}
                      onChange={(e) => setEditingListTitle(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                  </form>
                ) : (
                  <h3 className="font-semibold flex-1">{list.title}</h3>
                )}

                <div className="flex gap-1">
                  {editingListId === list.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateList(list.id, editingListTitle)}
                        className="text-green-600 hover:text-green-800 p-1"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditingList}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditingList(list)}
                        className="text-gray-600 hover:text-gray-800 p-1"
                        title="Edit list title"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete list"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
              <Droppable droppableId={list.id}>
                {(provided: any, snapshot: any) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`mb-4 min-h-12 rounded-md p-2 ${
                      snapshot.isDraggingOver ? 'bg-gray-200' : 'bg-transparent'
                    }`}
                  >
                    {list.cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided: any, snapshot: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-4 mb-2 rounded-md shadow-sm border cursor-pointer transition-all ${
                              snapshot.isDragging
                                ? 'bg-yellow-50 shadow-lg rotate-2 opacity-80'
                                : 'bg-white hover:shadow-md'
                            }`}
                            onClick={() => !snapshot.isDragging && setSelectedCard(card)}
                          >
                            <h4 className="font-semibold mb-2">{card.title}</h4>
                  {card.description && (
                              <div className="mb-2 text-sm text-gray-600">
                                <ReactMarkdown components={{
                                  p: ({ children }) => <p className="m-0">{children}</p>,
                                  h1: ({ children }) => <strong>{children}</strong>,
                                  h2: ({ children }) => <strong>{children}</strong>,
                                  h3: ({ children }) => <strong>{children}</strong>,
                                }}>
                      {card.description.length > 100
                        ? card.description.substring(0, 100) + '...'
                        : card.description}
                                </ReactMarkdown>
                              </div>
                  )}
                  {card.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                      {card.labels.map((label, index) => (
                        <span
                          key={index}
                                    className="px-2 py-1 bg-gray-200 rounded-full text-xs"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                        )}
                      </Draggable>
              ))}
                    {provided.placeholder}
            </div>
                )}
              </Droppable>
            <button
              onClick={() => handleCreateCard(list.id)}
                className="btn btn-secondary w-full"
            >
              + Add Card
            </button>
          </div>
        ))}

          {/* Add List Button */}
          <div className="min-w-72">
            {showAddList ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <form onSubmit={handleCreateList}>
                  <input
                    type="text"
                    placeholder="Enter list title..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Add List
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddList(false)
                        setNewListTitle('')
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowAddList(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors w-full text-left"
              >
                + Add another list
              </button>
            )}
      </div>
        </div>
      </DragDropContext>

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

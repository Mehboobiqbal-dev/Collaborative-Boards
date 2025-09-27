import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { apiService } from '../services/api'
import { Card, Board, Comment, Attachment } from '../types'
import { showErrorToast, showSuccessToast, getErrorMessage } from '../utils/errorMessages'

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
  const [labels, setLabels] = useState<string[]>(Array.isArray(card.labels) ? card.labels : [])
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
      // Close modal after successful save
      setTimeout(() => onClose(), 100)
    } catch (error) {
      console.error('Failed to update card:', error)
      showErrorToast('Failed to update card')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
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
      showErrorToast(getErrorMessage(error))
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
      showErrorToast(getErrorMessage(error))
    }
  }

  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      const response = await apiService.downloadAttachment(attachmentId)
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download attachment:', error)
      showErrorToast(getErrorMessage(error))
    }
  }

  const toggleLabel = (label: string) => {
    setLabels(prev => {
      const labelsArray = Array.isArray(prev) ? prev : []
      return labelsArray.includes(label)
        ? labelsArray.filter(l => l !== label)
        : [...labelsArray, label]
    })
  }

  const availableLabels = ['bug', 'feature', 'enhancement', 'urgent', 'low-priority']

  const handleCommentChange = (value: string) => {
    setNewComment(value)

    const cursorPos = value.length
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
        <div className="flex justify-between gap-2 items-start mb-4">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave()
                  }
                }}
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
                <div style={{ marginBottom: '1rem' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment()
                      }
                    }}
                    placeholder="Add a comment... Use @ to mention someone"
                    className="w-full min-h-20 p-3 border border-gray-300 rounded-md mb-2 resize-none"
                  />
                  <button onClick={handleAddComment} className="btn btn-primary" disabled={commentLoading}>
                    {commentLoading ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>

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
                        checked={Array.isArray(labels) && labels.includes(label)}
                        onChange={() => toggleLabel(label)}
                      />
                      <span style={{ marginLeft: '0.5rem' }}>{label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {Array.isArray(labels) && labels.length > 0 ? labels.map((label) => (
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
                    <button
                      onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                      className="btn btn-link"
                      style={{ padding: '0', textAlign: 'left', textDecoration: 'underline', background: 'none', border: 'none', color: '#007bff' }}
                    >
                      {attachment.filename}
                    </button>
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

export default CardModal
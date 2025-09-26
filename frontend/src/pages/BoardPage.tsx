import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'
import { socketService } from '../services/socket'
import { Board, Card } from '../types'

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
                  onClick={() => {
                    // TODO: Open card modal
                    console.log('Open card:', card.id)
                  }}
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
    </div>
  )
}

export default BoardPage

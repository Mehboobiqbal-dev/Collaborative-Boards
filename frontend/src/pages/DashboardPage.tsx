import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiService } from '../services/api'
import { Board } from '../types'

const DashboardPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([])
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadBoards()
  }, [])

  const loadBoards = async () => {
    try {
      const userBoards = await apiService.getBoards()
      setBoards(userBoards)
    } catch (error) {
      console.error('Failed to load boards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) return

    try {
      const board = await apiService.createBoard(newBoardTitle)
      setBoards([...boards, board])
      setNewBoardTitle('')
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create board:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p>Your boards</p>
        </div>
        <div>
          <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
            Create Board
          </button>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
            Logout
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '400px'
          }}>
            <h3>Create New Board</h3>
            <form onSubmit={handleCreateBoard}>
              <div className="form-group">
                <label htmlFor="boardTitle">Board Title</label>
                <input
                  type="text"
                  id="boardTitle"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="board-grid">
        {boards.map((board) => (
          <div
            key={board.id}
            className="board-card"
            onClick={() => navigate(`/boards/${board.id}`)}
          >
            <h3>{board.title}</h3>
            <p>Owner: {board.owner.name}</p>
            <p>{board.members.length} members</p>
          </div>
        ))}
        {boards.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No boards yet. Create your first board to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage

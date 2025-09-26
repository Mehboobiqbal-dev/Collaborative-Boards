import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'
import { Board } from '../types'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [boards, setBoards] = useState<Board[]>([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    loadBoards()
  }, [])

  const loadBoards = async () => {
    try {
      const data = await apiService.getBoards()
      setBoards(data)
    } catch {}
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    setCreating(true)
    try {
      const board = await apiService.createBoard(title)
      setBoards(prev => [...prev, board])
      setTitle('')
      navigate(`/boards/${board.id}`)
      onClose()
    } finally {
      setCreating(false)
    }
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-gray-200 shadow-sm transition-transform duration-200 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:static`}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="h-16 flex items-center px-4 border-b">
        <span className="font-semibold">Boards</span>
        <button onClick={onClose} className="ml-auto md:hidden text-gray-600" aria-label="Close sidebar">✕</button>
      </div>

      <div className="p-4 border-b">
        <div className="flex gap-2">
          <input
            aria-label="New board title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Create board"
            className="flex-1 px-2 py-1 border rounded"
          />
          <button onClick={handleCreate} disabled={creating} className="px-3 py-1 bg-blue-600 text-white rounded">
            {creating ? '...' : '+'}
          </button>
        </div>
      </div>

      <nav className="p-2 overflow-y-auto h-[calc(100%-8rem)]" aria-label="Boards list">
        {boards.map((b) => {
          const active = location.pathname.startsWith(`/boards/${b.id}`)
          return (
            <button
              key={b.id}
              onClick={() => { navigate(`/boards/${b.id}`); onClose() }}
              className={`w-full text-left px-3 py-2 rounded mb-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`}
              aria-current={active ? 'page' : undefined}
            >
              {b.title}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar



import React, { useEffect, useMemo, useState } from 'react'
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
  const [query, setQuery] = useState('')
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
      // Ensure proper URL encoding for board ID
      const encodedBoardId = encodeURIComponent(board.id)
      navigate(`/boards/${encodedBoardId}`)
      onClose()
    } finally {
      setCreating(false)
    }
  }

  const filteredBoards = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return boards
    return boards.filter(b => b.title.toLowerCase().includes(q))
  }, [boards, query])

  return (
    <aside
      className={`fixed inset-y-0 left-0  transform bg-white border-r border-gray-200 shad overflow-auto md:static transition-transform duration-200 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:static`}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="h-16 flex items-center px-4 border-b bg-white/80 backdrop-blur">
        <div className="flex items-center gap-2 text-gray-800">
          <span aria-hidden>🗂️</span>
          <span className="font-semibold tracking-tight">Your Boards</span>
        </div>
        <button onClick={onClose} className="ml-auto md:hidden text-gray-500 hover:text-gray-700" aria-label="Close sidebar">✕</button>
      </div>

      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <input
            aria-label="Search boards"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search boards..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400" aria-hidden>🔎</span>
        </div>
        <div className="flex gap-2" role="group" aria-label="Create board">
          <input
            aria-label="New board title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New board title"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleCreate} disabled={creating} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            {creating ? '...' : 'Create'}
          </button>
        </div>
      </div>

      <div className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500">My Boards</div>
      <nav className="px-2 overflow-y-auto h-[calc(100%-12.5rem)]" aria-label="Boards list">
        {filteredBoards.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-500">No boards found</div>
        )}
        {filteredBoards.map((b) => {
          const active = location.pathname.startsWith(`/boards/${b.id}`)
          return (
            <button
              key={b.id}
              onClick={() => { 
                const encodedBoardId = encodeURIComponent(b.id)
                navigate(`/boards/${encodedBoardId}`)
                onClose() 
              }}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-md mb-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${active ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-800'}`}
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden>🗒️</span>
              <span className="truncate">{b.title}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto border-t p-4 text-xs text-gray-500 hidden md:block">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Go to dashboard"
          >
            Dashboard
          </button>
          <a
            href="#"
            className="text-gray-400 hover:text-gray-600"
            aria-label="Help and docs"
          >
            Help
          </a>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar



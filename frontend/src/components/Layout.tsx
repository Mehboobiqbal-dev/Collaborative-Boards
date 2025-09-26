import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import NotificationsDropdown from './NotificationsDropdown'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 rounded hover:bg-gray-100"
                  aria-label="Open sidebar"
                  onClick={() => setSidebarOpen(true)}
                >
                  ☰
                </button>
                <h1 className="text-xl font-bold text-gray-900">Collaborative Boards</h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block">
                  {/* placeholder for search bar slot if needed */}
                </div>
                <NotificationsDropdown />
                <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

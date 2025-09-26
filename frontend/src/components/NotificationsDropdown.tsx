import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { Notification } from '../types'

interface NotificationsDropdownProps {
  onNotificationClick?: (notification: Notification) => void
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const result = await apiService.getNotifications(20, 0)
      setNotifications(result.notifications)
      setUnreadCount(result.notifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    setIsOpen(false)
    onNotificationClick?.(notification)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MENTION': return '👋'
      case 'ASSIGNMENT': return '👤'
      case 'COMMENT': return '💬'
      case 'MEMBER_ADDED': return '➕'
      case 'MEMBER_REMOVED': return '➖'
      default: return '🔔'
    }
  }

  const getNotificationText = (notification: Notification) => {
    const payload = notification.payload
    switch (notification.type) {
      case 'MENTION':
        return `You were mentioned in a comment`
      case 'ASSIGNMENT':
        return `You were assigned to a card`
      case 'COMMENT':
        return `New comment on a card`
      case 'MEMBER_ADDED':
        return `New member added to board`
      case 'MEMBER_REMOVED':
        return `Member removed from board`
      default:
        return 'New notification'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Notifications</h3>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {getNotificationText(notification)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationsDropdown

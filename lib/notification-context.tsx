'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  userId: string
  relatedTaskId?: string
  actionUrl?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message)
        break
      case 'error':
        toast.error(message)
        break
      case 'warning':
        toast.warning(message)
        break
      default:
        toast.info(message)
        break
    }
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Show toast notification
    showToast(notification.message, notification.type === 'error' ? 'error' : 'info')
  }, [showToast])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    )
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    showToast,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
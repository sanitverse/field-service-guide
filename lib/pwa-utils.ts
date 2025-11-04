'use client'

// PWA Installation and Offline Management Utilities

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface OfflineTask {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  due_date?: string
  location?: string
  created_at: string
  status: 'draft' | 'pending_sync'
}

interface OfflineComment {
  id: string
  taskId: string
  content: string
  created_at: string
  status: 'draft' | 'pending_sync'
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  private onlineCallbacks: (() => void)[] = []
  private offlineCallbacks: (() => void)[] = []
  private initialized = false

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true
    this.setupEventListeners()
    this.registerServiceWorker()
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      console.log('PWA: Install prompt available')
    })

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully')
      this.deferredPrompt = null
    })

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('PWA: Connection restored')
      this.isOnline = true
      this.onlineCallbacks.forEach(callback => callback())
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      console.log('PWA: Connection lost')
      this.isOnline = false
      this.offlineCallbacks.forEach(callback => callback())
    })
  }

  private async registerServiceWorker() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('PWA: Service Worker registered', registration)

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('PWA: New version available')
              this.showUpdateNotification()
            }
          })
        }
      })
    } catch (error) {
      console.error('PWA: Service Worker registration failed', error)
    }
  }

  // Check if app can be installed
  canInstall(): boolean {
    return this.deferredPrompt !== null
  }

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      
      console.log('PWA: Install prompt result:', outcome)
      this.deferredPrompt = null
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('PWA: Install prompt failed', error)
      return false
    }
  }

  // Check if app is installed
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  // Network status
  getNetworkStatus(): boolean {
    return this.isOnline
  }

  // Register callbacks for network status changes
  onOnline(callback: () => void) {
    this.onlineCallbacks.push(callback)
  }

  onOffline(callback: () => void) {
    this.offlineCallbacks.push(callback)
  }

  // Offline data management
  async saveOfflineTask(task: Omit<OfflineTask, 'id' | 'created_at' | 'status'>): Promise<string> {
    if (typeof localStorage === 'undefined') return ''
    
    const offlineTask: OfflineTask = {
      ...task,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      status: 'draft'
    }

    const existingTasks = this.getOfflineTasks()
    existingTasks.push(offlineTask)
    
    localStorage.setItem('offline-tasks', JSON.stringify(existingTasks))
    console.log('PWA: Task saved offline', offlineTask.id)
    
    return offlineTask.id
  }

  getOfflineTasks(): OfflineTask[] {
    if (typeof localStorage === 'undefined') return []
    try {
      const tasks = localStorage.getItem('offline-tasks')
      return tasks ? JSON.parse(tasks) : []
    } catch (error) {
      console.error('PWA: Failed to get offline tasks', error)
      return []
    }
  }

  async saveOfflineComment(taskId: string, content: string): Promise<string> {
    if (typeof localStorage === 'undefined') return ''
    
    const offlineComment: OfflineComment = {
      id: `offline-comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      content,
      created_at: new Date().toISOString(),
      status: 'draft'
    }

    const existingComments = this.getOfflineComments()
    existingComments.push(offlineComment)
    
    localStorage.setItem('offline-comments', JSON.stringify(existingComments))
    console.log('PWA: Comment saved offline', offlineComment.id)
    
    return offlineComment.id
  }

  getOfflineComments(): OfflineComment[] {
    if (typeof localStorage === 'undefined') return []
    try {
      const comments = localStorage.getItem('offline-comments')
      return comments ? JSON.parse(comments) : []
    } catch (error) {
      console.error('PWA: Failed to get offline comments', error)
      return []
    }
  }

  // Sync offline data when connection is restored
  private async syncOfflineData() {
    if (!this.isOnline) return

    try {
      await this.syncOfflineTasks()
      await this.syncOfflineComments()
    } catch (error) {
      console.error('PWA: Failed to sync offline data', error)
    }
  }

  private async syncOfflineTasks() {
    const offlineTasks = this.getOfflineTasks().filter(task => task.status === 'draft')
    
    for (const task of offlineTasks) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            assigned_to: task.assigned_to,
            due_date: task.due_date,
            location: task.location
          })
        })

        if (response.ok) {
          this.removeOfflineTask(task.id)
          console.log('PWA: Synced offline task', task.id)
        }
      } catch (error) {
        console.error('PWA: Failed to sync task', task.id, error)
      }
    }
  }

  private async syncOfflineComments() {
    const offlineComments = this.getOfflineComments().filter(comment => comment.status === 'draft')
    
    for (const comment of offlineComments) {
      try {
        const response = await fetch(`/api/tasks/${comment.taskId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: comment.content
          })
        })

        if (response.ok) {
          this.removeOfflineComment(comment.id)
          console.log('PWA: Synced offline comment', comment.id)
        }
      } catch (error) {
        console.error('PWA: Failed to sync comment', comment.id, error)
      }
    }
  }

  private removeOfflineTask(taskId: string) {
    if (typeof localStorage === 'undefined') return
    const tasks = this.getOfflineTasks().filter(task => task.id !== taskId)
    localStorage.setItem('offline-tasks', JSON.stringify(tasks))
  }

  private removeOfflineComment(commentId: string) {
    if (typeof localStorage === 'undefined') return
    const comments = this.getOfflineComments().filter(comment => comment.id !== commentId)
    localStorage.setItem('offline-comments', JSON.stringify(comments))
  }

  // Show update notification
  private showUpdateNotification() {
    // This would typically show a toast or modal
    console.log('PWA: New version available - refresh to update')
  }

  // Clear all offline data
  clearOfflineData() {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem('offline-tasks')
    localStorage.removeItem('offline-comments')
    console.log('PWA: Offline data cleared')
  }

  // Get offline data summary
  getOfflineDataSummary() {
    return {
      tasks: this.getOfflineTasks().length,
      comments: this.getOfflineComments().length,
      isOnline: this.isOnline,
      isInstalled: this.isInstalled(),
      canInstall: this.canInstall()
    }
  }
}

// Create singleton instance
export const pwaManager = new PWAManager()

// React hook for PWA functionality
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Initialize PWA manager on client side
    if (typeof window !== 'undefined') {
      pwaManager.init()
      
      // Set initial states
      setIsOnline(pwaManager.getNetworkStatus())
      setCanInstall(pwaManager.canInstall())
      setIsInstalled(pwaManager.isInstalled())

      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      pwaManager.onOnline(handleOnline)
      pwaManager.onOffline(handleOffline)

      // Check for install prompt availability
      const checkInstallPrompt = () => {
        setCanInstall(pwaManager.canInstall())
      }

      window.addEventListener('beforeinstallprompt', checkInstallPrompt)
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true)
        setCanInstall(false)
      })

      return () => {
        window.removeEventListener('beforeinstallprompt', checkInstallPrompt)
      }
    }
  }, [])

  return {
    isOnline,
    canInstall,
    isInstalled,
    showInstallPrompt: () => pwaManager.showInstallPrompt(),
    saveOfflineTask: (task: Omit<OfflineTask, 'id' | 'created_at' | 'status'>) => 
      pwaManager.saveOfflineTask(task),
    saveOfflineComment: (taskId: string, content: string) => 
      pwaManager.saveOfflineComment(taskId, content),
    getOfflineTasks: () => pwaManager.getOfflineTasks(),
    getOfflineComments: () => pwaManager.getOfflineComments(),
    getOfflineDataSummary: () => pwaManager.getOfflineDataSummary(),
    clearOfflineData: () => pwaManager.clearOfflineData()
  }
}

// Import statement for React hooks
import { useState, useEffect } from 'react'
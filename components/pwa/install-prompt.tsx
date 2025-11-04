'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePWA } from '@/lib/pwa-utils'

interface InstallPromptProps {
  onDismiss?: () => void
  className?: string
}

export function InstallPrompt({ onDismiss, className }: InstallPromptProps) {
  const { canInstall, isInstalled, showInstallPrompt } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Check if user has previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [])

  // Don't show if already installed, dismissed, or can't install
  if (isInstalled || isDismissed || !canInstall) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const installed = await showInstallPrompt()
      if (installed) {
        console.log('App installed successfully')
      }
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
    onDismiss?.()
  }

  return (
    <Card className={`border-blue-200 bg-blue-50/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Install Field Service Guide</CardTitle>
              <CardDescription className="text-sm">
                Get the full app experience with offline access
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Work offline</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Faster loading</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Push notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Home screen access</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 touch-manipulation"
            >
              <Download className="h-4 w-4 mr-2" />
              {isInstalling ? 'Installing...' : 'Install App'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="flex-1 sm:flex-initial touch-manipulation"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for mobile
export function InstallPromptCompact({ onDismiss, className }: InstallPromptProps) {
  const { canInstall, isInstalled, showInstallPrompt } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [])

  if (isInstalled || isDismissed || !canInstall) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await showInstallPrompt()
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
    onDismiss?.()
  }

  return (
    <div className={`flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-center space-x-3 min-w-0">
        <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            Install App
          </p>
          <p className="text-xs text-gray-600">
            Work offline & faster access
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Button 
          size="sm"
          onClick={handleInstall}
          disabled={isInstalling}
          className="h-8 px-3 text-xs touch-manipulation"
        >
          {isInstalling ? '...' : 'Install'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-8 w-8 p-0 text-gray-500"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
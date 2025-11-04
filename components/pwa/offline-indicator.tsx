'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, Cloud, CloudOff, RotateCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePWA } from '@/lib/pwa-utils'

interface OfflineIndicatorProps {
  className?: string
  showDetails?: boolean
}

export function OfflineIndicator({ className, showDetails = false }: OfflineIndicatorProps) {
  const { isOnline, getOfflineDataSummary } = usePWA()
  const [offlineData, setOfflineData] = useState(getOfflineDataSummary())
  const [showOfflineData, setShowOfflineData] = useState(false)

  useEffect(() => {
    const updateOfflineData = () => {
      setOfflineData(getOfflineDataSummary())
    }

    // Update offline data periodically
    const interval = setInterval(updateOfflineData, 5000)
    
    // Update immediately when online status changes
    updateOfflineData()

    return () => clearInterval(interval)
  }, [isOnline, getOfflineDataSummary])

  const hasOfflineData = offlineData.tasks > 0 || offlineData.comments > 0

  if (isOnline && !hasOfflineData && !showDetails) {
    return null
  }

  return (
    <div className={className}>
      {/* Compact indicator */}
      <div className="flex items-center space-x-2">
        <Badge 
          variant={isOnline ? "secondary" : "destructive"}
          className="flex items-center space-x-1 touch-manipulation cursor-pointer"
          onClick={() => setShowOfflineData(!showOfflineData)}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </Badge>

        {hasOfflineData && (
          <Badge 
            variant="outline" 
            className="flex items-center space-x-1 touch-manipulation cursor-pointer"
            onClick={() => setShowOfflineData(!showOfflineData)}
          >
            <CloudOff className="h-3 w-3" />
            <span>{offlineData.tasks + offlineData.comments}</span>
          </Badge>
        )}
      </div>

      {/* Detailed offline data panel */}
      {(showOfflineData || showDetails) && (
        <Card className="mt-2 border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-600" />
              ) : (
                <CloudOff className="h-4 w-4 text-orange-600" />
              )}
              <span>
                {isOnline ? 'Connected' : 'Working Offline'}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isOnline 
                ? 'All features available. Syncing offline data...'
                : 'Limited features. Data will sync when connection is restored.'
              }
            </CardDescription>
          </CardHeader>

          {hasOfflineData && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                  Offline Data:
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {offlineData.tasks > 0 && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <span>Draft Tasks</span>
                      <Badge variant="secondary" className="text-xs">
                        {offlineData.tasks}
                      </Badge>
                    </div>
                  )}
                  
                  {offlineData.comments > 0 && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <span>Draft Comments</span>
                      <Badge variant="secondary" className="text-xs">
                        {offlineData.comments}
                      </Badge>
                    </div>
                  )}
                </div>

                {isOnline && (
                  <div className="flex items-center space-x-2 pt-2">
                    <RotateCw className="h-3 w-3 animate-spin text-blue-600" />
                    <span className="text-xs text-blue-600">
                      Syncing offline data...
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

// Simple status badge for header
export function NetworkStatusBadge({ className }: { className?: string }) {
  const { isOnline } = usePWA()

  return (
    <Badge 
      variant={isOnline ? "secondary" : "destructive"}
      className={`flex items-center space-x-1 ${className}`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span className="hidden sm:inline">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span className="hidden sm:inline">Offline</span>
        </>
      )}
    </Badge>
  )
}
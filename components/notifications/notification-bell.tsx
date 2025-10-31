'use client'

import { useState } from 'react'
import { Bell, Check, X, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/lib/notification-context'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification 
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          <ScrollArea className="h-80">
            {notifications.slice(0, 10).map((notification) => (
              <div key={notification.id}>
                <div
                  className={cn(
                    "p-3 hover:bg-accent cursor-pointer transition-colors",
                    !notification.read && "bg-blue-50/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {format(notification.timestamp, 'MMM d, h:mm a')}
                        </p>
                        
                        <div className="flex items-center gap-1">
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button variant="ghost" size="sm" className="h-6 px-2">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              clearNotification(notification.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
              </div>
            ))}
          </ScrollArea>
        )}
        
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full">
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
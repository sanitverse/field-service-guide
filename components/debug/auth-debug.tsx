'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AuthDebug() {
  const { user, profile, loading } = useAuth()

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">🐛 Auth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Loading:</strong> {loading ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>User:</strong> {user ? '✅ Authenticated' : '❌ Not authenticated'}
          </div>
          <div>
            <strong>Profile:</strong> {profile ? '✅ Loaded' : '❌ Not loaded'}
          </div>
          <div>
            <strong>Role:</strong> {profile?.role ? (
              <Badge variant="outline">{profile.role}</Badge>
            ) : '❌ No role'}
          </div>
        </div>
        
        {user && (
          <div className="mt-4 p-2 bg-white rounded border">
            <strong>User Details:</strong>
            <pre className="text-xs mt-1 overflow-auto">
              {JSON.stringify({
                id: user.id,
                email: user.email,
                role: profile?.role,
                full_name: profile?.full_name,
                status: profile?.status
              }, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
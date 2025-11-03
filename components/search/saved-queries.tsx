'use client'

import { useState, useEffect } from 'react'
import { Bookmark, Trash2, Play, Plus, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

interface SavedQuery {
  id: string
  user_id: string
  name: string
  query: string
  filters: {
    fileIds?: string[]
    similarityThreshold?: number
    maxResults?: number
  }
  created_at: string
  last_used_at: string
  use_count: number
}

interface SavedQueriesProps {
  onQuerySelect: (query: SavedQuery) => void
  currentQuery?: string
  currentFilters?: any
  className?: string
}

export function SavedQueries({ 
  onQuerySelect, 
  currentQuery, 
  currentFilters,
  className 
}: SavedQueriesProps) {
  const { profile } = useAuth()
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [queryName, setQueryName] = useState('')

  useEffect(() => {
    if (profile?.id) {
      loadSavedQueries()
    }
  }, [profile?.id])

  const loadSavedQueries = async () => {
    if (!profile?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/saved-queries?userId=${profile.id}`)
      if (response.ok) {
        const data = await response.json()
        setSavedQueries(data.queries || [])
      }
    } catch (error) {
      console.error('Failed to load saved queries:', error)
      toast.error('Failed to load saved queries')
    } finally {
      setIsLoading(false)
    }
  }

  const saveCurrentQuery = async () => {
    if (!profile?.id || !currentQuery || !queryName.trim()) {
      toast.error('Please provide a name for the query')
      return
    }

    try {
      const response = await fetch('/api/search/saved-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile.id,
          name: queryName.trim(),
          query: currentQuery,
          filters: currentFilters || {}
        })
      })

      if (response.ok) {
        toast.success('Query saved successfully')
        setQueryName('')
        setShowSaveDialog(false)
        loadSavedQueries()
      } else {
        throw new Error('Failed to save query')
      }
    } catch (error) {
      console.error('Failed to save query:', error)
      toast.error('Failed to save query')
    }
  }

  const deleteQuery = async (queryId: string) => {
    if (!profile?.id) return

    try {
      const response = await fetch(`/api/search/saved-queries/${queryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profile.id })
      })

      if (response.ok) {
        toast.success('Query deleted')
        loadSavedQueries()
      } else {
        throw new Error('Failed to delete query')
      }
    } catch (error) {
      console.error('Failed to delete query:', error)
      toast.error('Failed to delete query')
    }
  }

  const useQuery = async (query: SavedQuery) => {
    // Update usage statistics
    try {
      await fetch(`/api/search/saved-queries/${query.id}/use`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to update query usage:', error)
    }

    // Execute the query
    onQuerySelect(query)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Queries ({savedQueries.length})
            </CardTitle>
            {currentQuery && (
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Save Current
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Search Query</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="queryName">Query Name</Label>
                      <Input
                        id="queryName"
                        placeholder="Enter a name for this query..."
                        value={queryName}
                        onChange={(e) => setQueryName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Query</Label>
                      <div className="p-2 bg-muted rounded text-sm">
                        "{currentQuery}"
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowSaveDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveCurrentQuery}>
                        Save Query
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading saved queries...
            </div>
          ) : savedQueries.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved queries yet</p>
              <p className="text-xs mt-1">Save your frequent searches for quick access</p>
            </div>
          ) : (
            <div className="space-y-0">
              {savedQueries.map((query, index) => (
                <div key={query.id}>
                  <div className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {query.name}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            Used {query.use_count} times
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          "{query.query}"
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created {formatDate(query.created_at)}</span>
                          <span>Last used {formatDate(query.last_used_at)}</span>
                          {query.filters.similarityThreshold && (
                            <span>Threshold: {Math.round(query.filters.similarityThreshold * 100)}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => useQuery(query)}
                          className="h-8 w-8 p-0"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuery(query.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {index < savedQueries.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
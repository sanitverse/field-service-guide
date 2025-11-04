'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, FileText, Clock, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SearchResult {
  id: string
  file_id: string
  content: string
  similarity: number
  metadata: Record<string, any>
  file?: {
    id: string
    filename: string
    mime_type: string
    created_at: string
  }
}

interface RAGSearchProps {
  onResultSelect?: (result: SearchResult) => void
  fileIds?: string[]
  placeholder?: string
  className?: string
}

export function RAGSearch({ 
  onResultSelect, 
  fileIds, 
  placeholder = "Search documents...",
  className 
}: RAGSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          options: {
            matchThreshold: 0.78,
            matchCount: 10,
            fileIds
          }
        })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
        
        // Add to search history
        setSearchHistory(prev => {
          const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)]
          return newHistory.slice(0, 5) // Keep last 5 searches
        })
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [fileIds])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result)
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`
  }

  const formatFileType = (mimeType: string) => {
    const typeMap: Record<string, string> = {
      'text/plain': 'TXT',
      'application/pdf': 'PDF',
      'text/csv': 'CSV',
      'application/json': 'JSON',
      'text/html': 'HTML'
    }
    return typeMap[mimeType] || 'FILE'
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && !query && (
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((historyQuery, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(historyQuery)}
                    className="text-xs h-8 touch-manipulation"
                  >
                    {historyQuery}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-sm">
                Search Results ({results.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80 sm:h-96">
                <div className="space-y-0">
                  {results.map((result, index) => (
                    <div key={result.id}>
                      <div
                        className="p-3 sm:p-4 hover:bg-muted/50 active:bg-muted cursor-pointer transition-colors touch-manipulation"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="space-y-2">
                          {/* File Info */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium truncate">
                                {result.file?.filename || 'Unknown File'}
                              </span>
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {formatFileType(result.file?.mime_type || '')}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {formatSimilarity(result.similarity)}
                            </Badge>
                          </div>

                          {/* Content Preview */}
                          <div className="text-sm text-muted-foreground leading-relaxed">
                            {highlightText(
                              result.content.length > 150 
                                ? result.content.substring(0, 150) + '...'
                                : result.content,
                              query
                            )}
                          </div>

                          {/* Metadata */}
                          {result.metadata && (
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                              {result.metadata.chunk_index !== undefined && (
                                <span>Chunk {result.metadata.chunk_index + 1}</span>
                              )}
                              {result.metadata.word_count && (
                                <span>{result.metadata.word_count} words</span>
                              )}
                              {result.file?.created_at && (
                                <span>
                                  {new Date(result.file.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < results.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {query && !isLoading && results.length === 0 && !error && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No documents found matching "{query}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or check if documents have been processed
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
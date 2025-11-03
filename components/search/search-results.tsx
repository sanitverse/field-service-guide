'use client'

import { useState } from 'react'
import { FileText, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

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

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onFileOpen?: (fileId: string) => void
  className?: string
}

export function SearchResults({ 
  results, 
  query, 
  onFileOpen,
  className 
}: SearchResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const toggleExpanded = (resultId: string) => {
    const newExpanded = new Set(expandedResults)
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId)
    } else {
      newExpanded.add(resultId)
    }
    setExpandedResults(newExpanded)
  }

  const copyToClipboard = async (text: string, resultId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(resultId)
      toast.success('Content copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy content')
    }
  }

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
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

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (similarity >= 0.8) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (similarity >= 0.7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const formatFileType = (mimeType: string) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      'text/plain': { label: 'TXT', color: 'bg-gray-100 text-gray-800' },
      'application/pdf': { label: 'PDF', color: 'bg-red-100 text-red-800' },
      'text/csv': { label: 'CSV', color: 'bg-green-100 text-green-800' },
      'application/json': { label: 'JSON', color: 'bg-blue-100 text-blue-800' },
      'text/html': { label: 'HTML', color: 'bg-orange-100 text-orange-800' }
    }
    const type = typeMap[mimeType] || { label: 'FILE', color: 'bg-gray-100 text-gray-800' }
    return type
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Search Results ({results.length})
          </h3>
          <Badge variant="outline">
            Query: "{query}"
          </Badge>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {results.map((result, index) => {
            const isExpanded = expandedResults.has(result.id)
            const fileType = formatFileType(result.file?.mime_type || '')
            
            return (
              <Card key={result.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {result.file?.filename || 'Unknown File'}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${fileType.color}`}
                          >
                            {fileType.label}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getSimilarityColor(result.similarity)}`}
                          >
                            {formatSimilarity(result.similarity)} match
                          </Badge>
                          {result.metadata?.chunk_index !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              Chunk {result.metadata.chunk_index + 1}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.content, result.id)}
                      >
                        {copiedId === result.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      {onFileOpen && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFileOpen(result.file_id)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(result.id)}>
                    {/* Preview Content */}
                    <div className="text-sm text-muted-foreground mb-3">
                      {highlightText(
                        result.content.length > 300 && !isExpanded
                          ? result.content.substring(0, 300) + '...'
                          : result.content,
                        query
                      )}
                    </div>

                    {/* Expand/Collapse Trigger */}
                    {result.content.length > 300 && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show more
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    )}

                    {/* Expanded Content */}
                    <CollapsibleContent>
                      {result.content.length > 300 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm text-muted-foreground">
                            {highlightText(result.content, query)}
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Metadata */}
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {result.metadata?.word_count && (
                        <span>{result.metadata.word_count} words</span>
                      )}
                      {result.metadata?.length && (
                        <span>{result.metadata.length} characters</span>
                      )}
                      {result.file?.created_at && (
                        <span>
                          Uploaded {new Date(result.file.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span>Result #{index + 1}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
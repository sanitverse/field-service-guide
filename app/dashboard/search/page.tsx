'use client'

import { useState, useEffect } from 'react'
import { Search, FileText, Filter, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { RAGSearch } from '@/components/search/rag-search'
import { SearchResults } from '@/components/search/search-results'
import { SavedQueries } from '@/components/search/saved-queries'
import { useAuth } from '@/lib/auth-context'

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

interface FileRecord {
  id: string
  filename: string
  mime_type: string
  is_processed: boolean
  created_at: string
}

export default function SearchPage() {
  const { profile } = useAuth()
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [files, setFiles] = useState<FileRecord[]>([])
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [similarityThreshold, setSimilarityThreshold] = useState('0.78')
  const [maxResults, setMaxResults] = useState('10')
  const [isLoading, setIsLoading] = useState(false)
  const [searchAnalyticsId, setSearchAnalyticsId] = useState<string | null>(null)

  // Load available files
  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files')
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files?.filter((f: FileRecord) => f.is_processed) || [])
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setCurrentQuery('')
      return
    }

    setIsLoading(true)
    setCurrentQuery(query)
    const startTime = Date.now()

    try {
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          options: {
            matchThreshold: parseFloat(similarityThreshold),
            matchCount: parseInt(maxResults),
            fileIds: selectedFileIds.length > 0 ? selectedFileIds : undefined
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSearchResults(data.results)
          
          // Track search analytics
          const executionTime = Date.now() - startTime
          if (profile?.id) {
            trackSearchAnalytics(query, data.results.length, parseFloat(similarityThreshold), executionTime)
          }
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const trackSearchAnalytics = async (query: string, resultsCount: number, threshold: number, executionTime: number) => {
    try {
      const response = await fetch('/api/search/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile?.id,
          query,
          resultsCount,
          similarityThreshold: threshold,
          executionTimeMs: executionTime
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSearchAnalyticsId(data.analyticsId)
      }
    } catch (error) {
      console.error('Failed to track search analytics:', error)
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    // Track result click if we have analytics ID
    if (searchAnalyticsId) {
      trackResultClick(result.id)
    }
    
    // Handle result selection (e.g., navigate to file or show details)
    console.log('Selected result:', result)
  }

  const trackResultClick = async (resultId: string) => {
    if (!searchAnalyticsId) return

    try {
      await fetch(`/api/search/analytics/${searchAnalyticsId}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resultId })
      })
    } catch (error) {
      console.error('Failed to track result click:', error)
    }
  }

  const handleSavedQuerySelect = (savedQuery: any) => {
    setCurrentQuery(savedQuery.query)
    if (savedQuery.filters.fileIds) {
      setSelectedFileIds(savedQuery.filters.fileIds)
    }
    if (savedQuery.filters.similarityThreshold) {
      setSimilarityThreshold(savedQuery.filters.similarityThreshold.toString())
    }
    if (savedQuery.filters.maxResults) {
      setMaxResults(savedQuery.filters.maxResults.toString())
    }
    
    // Execute the search
    handleSearch(savedQuery.query)
  }

  const handleFileOpen = (fileId: string) => {
    // Navigate to file details or open file
    window.open(`/dashboard/files/${fileId}`, '_blank')
  }

  const clearFilters = () => {
    setSelectedFileIds([])
    setSimilarityThreshold('0.78')
    setMaxResults('10')
  }

  const processedFilesCount = files.length
  const totalChunksCount = searchResults.reduce((sum, result) => {
    return sum + (result.metadata?.total_chunks || 1)
  }, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Search</h1>
          <p className="text-muted-foreground mt-1">
            Search through your uploaded documents using AI-powered semantic search
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {processedFilesCount} files indexed
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Filter by Files
                </label>
                <Select
                  value={selectedFileIds.length === 1 ? selectedFileIds[0] : 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedFileIds([])
                    } else {
                      setSelectedFileIds([value])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All files" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All files</SelectItem>
                    {files.map((file) => (
                      <SelectItem key={file.id} value={file.id}>
                        {file.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Similarity Threshold */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Similarity Threshold
                </label>
                <Select value={similarityThreshold} onValueChange={setSimilarityThreshold}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.60">60% - More results</SelectItem>
                    <SelectItem value="0.70">70% - Balanced</SelectItem>
                    <SelectItem value="0.78">78% - Default</SelectItem>
                    <SelectItem value="0.85">85% - More precise</SelectItem>
                    <SelectItem value="0.90">90% - Very precise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Results */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Max Results
                </label>
                <Select value={maxResults} onValueChange={setMaxResults}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 results</SelectItem>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          {/* Saved Queries */}
          <SavedQueries
            onQuerySelect={handleSavedQuerySelect}
            currentQuery={currentQuery}
            currentFilters={{
              fileIds: selectedFileIds,
              similarityThreshold: parseFloat(similarityThreshold),
              maxResults: parseInt(maxResults)
            }}
          />

          {/* Search Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Search Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processed Files:</span>
                <span className="font-medium">{processedFilesCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Results:</span>
                <span className="font-medium">{searchResults.length}</span>
              </div>
              {currentQuery && (
                <div className="flex justify-between text-sm">
                  <span>Query:</span>
                  <span className="font-medium truncate ml-2">"{currentQuery}"</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Search Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="search" className="space-y-4">
            <TabsList>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Results ({searchResults.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Semantic Document Search</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Use natural language to search through your documents. 
                    The AI will find relevant content even if it doesn't contain your exact keywords.
                  </p>
                </CardHeader>
                <CardContent>
                  <RAGSearch
                    onResultSelect={handleResultSelect}
                    fileIds={selectedFileIds.length > 0 ? selectedFileIds : undefined}
                    placeholder="Ask a question or describe what you're looking for..."
                  />
                </CardContent>
              </Card>

              {/* Quick Search Examples */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Example Searches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      "How to troubleshoot network issues?",
                      "Safety procedures for equipment maintenance",
                      "Installation requirements and specifications",
                      "Customer contact information and history"
                    ].map((example, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-left h-auto p-2"
                        onClick={() => handleSearch(example)}
                      >
                        <span className="text-xs text-muted-foreground">"{example}"</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {searchResults.length > 0 ? (
                <SearchResults
                  results={searchResults}
                  query={currentQuery}
                  onFileOpen={handleFileOpen}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No search results yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Use the search tab to find relevant documents
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
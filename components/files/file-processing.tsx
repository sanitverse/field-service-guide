'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth-context'
import { 
  Play, 
  Pause, 
  RefreshCw, 
  FileText, 
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileRecord } from '@/lib/supabase'

interface ProcessingStats {
  total_files: number
  total_size_bytes: number
  processed_files: number
  unprocessed_files: number
  avg_file_size_mb: number
}

interface ProcessingResult {
  fileId: string
  success: boolean
  chunks?: number
  error?: string
}

interface UnprocessedFile extends FileRecord {
  can_process?: boolean
}

export function FileProcessing() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ProcessingStats | null>(null)
  const [unprocessedFiles, setUnprocessedFiles] = useState<UnprocessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProcessingData()
  }, [])

  const loadProcessingData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/files/process-batch')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load processing data')
      }

      setStats(data.stats)
      setUnprocessedFiles(data.unprocessed_files_list || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const processFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed')
      }

      return { fileId, success: true, chunks: data.chunks_count }
    } catch (error) {
      return { 
        fileId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Processing failed' 
      }
    }
  }

  const processBatch = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingResults([])
    setError(null)

    try {
      const response = await fetch('/api/files/process-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processUnprocessedOnly: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Batch processing failed')
      }

      setProcessingResults(data.results || [])
      setProcessingProgress(100)
      
      // Reload data to get updated stats
      await loadProcessingData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const processIndividualFile = async (fileId: string) => {
    const result = await processFile(fileId)
    setProcessingResults(prev => [...prev, result])
    
    if (result.success) {
      // Remove from unprocessed list
      setUnprocessedFiles(prev => prev.filter(f => f.id !== fileId))
      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          processed_files: prev.processed_files + 1,
          unprocessed_files: prev.unprocessed_files - 1
        } : null)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getProcessingStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading processing data...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Processing Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_files}</div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(stats.total_size_bytes)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.processed_files}</div>
              <p className="text-xs text-muted-foreground">
                Ready for search
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unprocessed_files}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_files > 0 
                  ? Math.round((stats.processed_files / stats.total_files) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Files processed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="batch" className="space-y-4">
        <TabsList>
          <TabsTrigger value="batch">Batch Processing</TabsTrigger>
          <TabsTrigger value="individual">Individual Files</TabsTrigger>
          <TabsTrigger value="results">Processing Results</TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Batch Processing
              </CardTitle>
              <CardDescription>
                Process all unprocessed files for AI search capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing files...</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} />
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button 
                  onClick={processBatch}
                  disabled={isProcessing || (stats?.unprocessed_files || 0) === 0}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Process All Files'}
                </Button>

                <Button variant="outline" onClick={loadProcessingData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

                <div className="text-sm text-muted-foreground">
                  {stats?.unprocessed_files || 0} files pending processing
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual File Processing</CardTitle>
              <CardDescription>
                Process specific files one at a time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unprocessedFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All files have been processed!</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unprocessedFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="font-medium truncate max-w-xs">
                              {file.filename}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatFileSize(file.file_size || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => processIndividualFile(file.id)}
                              disabled={isProcessing}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Process
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Results</CardTitle>
              <CardDescription>
                Results from recent processing operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processingResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No processing results yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {processingResults.map((result, index) => (
                    <div
                      key={`${result.fileId}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">File ID: {result.fileId}</p>
                          {result.success ? (
                            <p className="text-sm text-muted-foreground">
                              Generated {result.chunks} chunks
                            </p>
                          ) : (
                            <p className="text-sm text-red-600">
                              {result.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={result.success ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {result.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
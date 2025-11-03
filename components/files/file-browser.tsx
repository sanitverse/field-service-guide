'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Upload,
  RefreshCw,
  FileText,
  Image,
  File,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileRecord, ServiceTask, Profile } from '@/lib/supabase'
import { formatFileSize } from '@/lib/file-validation'
import { FileViewer } from './file-viewer'
import { FileUpload } from './file-upload'

interface FileBrowserProps {
  relatedTaskId?: string
  showUpload?: boolean
  showTaskAssociation?: boolean
  className?: string
}

interface FileWithDetails extends FileRecord {
  uploader?: Profile
  related_task?: ServiceTask
}

type SortField = 'filename' | 'file_size' | 'created_at' | 'mime_type'
type SortDirection = 'asc' | 'desc'

export function FileBrowser({
  relatedTaskId,
  showUpload = true,
  showTaskAssociation = true,
  className
}: FileBrowserProps) {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileWithDetails[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileWithDetails[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewerFile, setViewerFile] = useState<FileRecord | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Load files
  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (relatedTaskId) {
        params.append('taskId', relatedTaskId)
      }

      const response = await fetch(`/api/files?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load files')
      }

      setFiles(data.files || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }, [relatedTaskId])

  // Filter and sort files
  useEffect(() => {
    let filtered = [...files]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(file => 
        file.filename.toLowerCase().includes(query) ||
        file.uploader?.full_name?.toLowerCase().includes(query) ||
        file.related_task?.title?.toLowerCase().includes(query)
      )
    }

    // Apply file type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(file => {
        switch (fileTypeFilter) {
          case 'images':
            return file.mime_type?.startsWith('image/')
          case 'documents':
            return file.mime_type?.includes('pdf') || 
                   file.mime_type?.includes('document') || 
                   file.mime_type?.includes('text')
          case 'processed':
            return file.is_processed
          case 'unprocessed':
            return !file.is_processed
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'filename') {
        aValue = aValue?.toLowerCase() || ''
        bValue = bValue?.toLowerCase() || ''
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredFiles(filtered)
  }, [files, searchQuery, fileTypeFilter, sortField, sortDirection])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(fileId)
      } else {
        newSet.delete(fileId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete file')
      }

      // Remove from local state
      setFiles(prev => prev.filter(f => f.id !== fileId))
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return

    try {
      const deletePromises = Array.from(selectedFiles).map(fileId =>
        fetch(`/api/files?id=${fileId}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)

      // Remove from local state
      setFiles(prev => prev.filter(f => !selectedFiles.has(f.id)))
      setSelectedFiles(new Set())
    } catch (err) {
      setError('Failed to delete some files')
    }
  }

  const handleDownloadFile = async (file: FileRecord) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Download failed')
      }

      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    }
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-4 w-4" />
    
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />
    }
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="h-4 w-4 text-red-500" />
    }
    return <File className="h-4 w-4 text-gray-500" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading files...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                File Browser
              </CardTitle>
              <CardDescription>
                {filteredFiles.length} of {files.length} files
                {relatedTaskId && ' for this task'}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedFiles.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedFiles.size})
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={loadFiles}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {showUpload && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files, uploaders, or tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="unprocessed">Unprocessed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* File Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>File</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('filename')}
                  >
                    Name {sortField === 'filename' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('file_size')}
                  >
                    Size {sortField === 'file_size' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Uploader</TableHead>
                  {showTaskAssociation && <TableHead>Task</TableHead>}
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Uploaded {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showTaskAssociation ? 9 : 8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {files.length === 0 ? 'No files uploaded yet' : 'No files match your filters'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFiles.has(file.id)}
                          onCheckedChange={(checked: boolean) => handleSelectFile(file.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        {getFileIcon(file.mime_type)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.mime_type}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatFileSize(file.file_size || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span className="text-sm">
                            {file.uploader?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      {showTaskAssociation && (
                        <TableCell>
                          {file.related_task ? (
                            <Badge variant="outline" className="text-xs">
                              {file.related_task.title}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No task</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(file.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={file.is_processed ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {file.is_processed ? 'Processed' : 'Processing'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewerFile(file)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* File Viewer Dialog */}
      <FileViewer
        file={viewerFile}
        isOpen={!!viewerFile}
        onClose={() => setViewerFile(null)}
      />

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Upload Files</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowUploadDialog(false)}
                >
                  ✕
                </Button>
              </div>
              
              <FileUpload
                relatedTaskId={relatedTaskId}
                onUploadComplete={(uploadedFiles) => {
                  loadFiles() // Refresh the file list
                  setShowUploadDialog(false)
                }}
                onUploadError={(error) => {
                  setError(error)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
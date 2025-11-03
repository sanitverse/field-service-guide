'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { 
  File, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  Eye, 
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileRecord } from '@/lib/supabase'

interface FilePreviewProps {
  file: FileRecord
  showActions?: boolean
  onRemove?: (fileId: string) => void
  onView?: (file: FileRecord) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FilePreview({
  file,
  showActions = true,
  onRemove,
  onView,
  className,
  size = 'md'
}: FilePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isImage = file.mime_type?.startsWith('image/')
  const isPdf = file.mime_type === 'application/pdf'
  const isDocument = file.mime_type?.includes('document') || file.mime_type?.includes('text')

  useEffect(() => {
    if (isImage) {
      loadImagePreview()
    }
  }, [file.file_path, isImage])

  const loadImagePreview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: downloadError } = await supabase.storage
        .from('task-files')
        .createSignedUrl(file.file_path, 3600) // 1 hour expiry

      if (downloadError) {
        throw downloadError
      }

      setImageUrl(data.signedUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('task-files')
        .createSignedUrl(file.file_path, 60) // 1 minute for download

      if (error) throw error

      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = data.signedUrl
      link.download = file.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-4 w-4" />
    if (isPdf || isDocument) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getFileTypeColor = () => {
    if (isImage) return 'bg-blue-100 text-blue-800'
    if (isPdf) return 'bg-red-100 text-red-800'
    if (isDocument) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  }

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Preview Area */}
          <div className={cn(
            'relative rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden',
            sizeClasses[size]
          )}>
            {isImage && imageUrl && !error ? (
              <img
                src={imageUrl}
                alt={file.filename}
                className="w-full h-full object-cover rounded-lg"
                onError={() => setError('Failed to load image')}
              />
            ) : isImage && isLoading ? (
              <Loader2 className={cn('animate-spin text-gray-400', iconSizes[size])} />
            ) : error ? (
              <div className="text-center p-2">
                <File className={cn('mx-auto text-gray-400 mb-1', iconSizes[size])} />
                <p className="text-xs text-red-500">Preview failed</p>
              </div>
            ) : (
              <div className="text-center">
                {getFileIcon()}
                <p className="text-xs text-gray-500 mt-1">
                  {isPdf ? 'PDF' : isDocument ? 'DOC' : 'FILE'}
                </p>
              </div>
            )}

            {/* Processing indicator */}
            {!file.is_processed && (
              <div className="absolute top-1 right-1">
                <Badge variant="secondary" className="text-xs">
                  Processing...
                </Badge>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium truncate" title={file.filename}>
                {file.filename}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.file_size)}
              </p>
            </div>

            {/* File Type Badge */}
            <Badge className={cn('text-xs', getFileTypeColor())}>
              {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
            </Badge>

            {/* Actions */}
            {showActions && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView?.(file)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3" />
                </Button>

                {onRemove && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(file.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Grid layout for multiple file previews
interface FilePreviewGridProps {
  files: FileRecord[]
  onRemove?: (fileId: string) => void
  onView?: (file: FileRecord) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FilePreviewGrid({
  files,
  onRemove,
  onView,
  className,
  size = 'md'
}: FilePreviewGridProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No files uploaded yet</p>
      </div>
    )
  }

  const gridClasses = {
    sm: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
    md: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
    lg: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <div className={cn(
      'grid gap-4',
      gridClasses[size],
      className
    )}>
      {files.map((file) => (
        <FilePreview
          key={file.id}
          file={file}
          onRemove={onRemove}
          onView={onView}
          size={size}
        />
      ))}
    </div>
  )
}
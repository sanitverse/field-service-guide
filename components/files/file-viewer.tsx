'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'
import { 
  Download, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileRecord } from '@/lib/supabase'
import { formatFileSize } from '@/lib/file-validation'

interface FileViewerProps {
  file: FileRecord | null
  isOpen: boolean
  onClose: () => void
}

export function FileViewer({ file, isOpen, onClose }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const isImage = file?.mime_type?.startsWith('image/')
  const isPdf = file?.mime_type === 'application/pdf'
  const isText = file?.mime_type?.startsWith('text/')

  useEffect(() => {
    if (file && isOpen) {
      loadFileUrl()
    } else {
      setFileUrl(null)
      setError(null)
      setZoom(100)
      setRotation(0)
    }
  }, [file, isOpen])

  const loadFileUrl = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: urlError } = await supabase.storage
        .from('task-files')
        .createSignedUrl(file.file_path, 3600) // 1 hour

      if (urlError) {
        throw urlError
      }

      setFileUrl(data.signedUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!file) return

    try {
      const response = await fetch(`/api/files/${file.id}/download`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Download failed')
      }

      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{file.filename}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(file.file_size || 0)}
                </span>
                {!file.is_processed && (
                  <Badge variant="outline">Processing...</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {isImage && (
                <>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[3rem] text-center">{zoom}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading file...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96 text-red-500">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>{error}</span>
            </div>
          ) : fileUrl ? (
            <ScrollArea className="h-[60vh] w-full rounded-md border">
              <div className="p-4">
                {isImage ? (
                  <div className="flex justify-center">
                    <img
                      src={fileUrl}
                      alt={file.filename}
                      className="max-w-full h-auto"
                      style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'center'
                      }}
                      onError={() => setError('Failed to load image')}
                    />
                  </div>
                ) : isPdf ? (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full min-h-[500px]"
                    title={file.filename}
                  />
                ) : isText ? (
                  <TextFileViewer fileUrl={fileUrl} />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      Preview not available for this file type
                    </div>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Component for viewing text files
function TextFileViewer({ fileUrl }: { fileUrl: string }) {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTextContent()
  }, [fileUrl])

  const loadTextContent = async () => {
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Failed to load file content')
      }
      const text = await response.text()
      setContent(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading content...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500">
        <AlertCircle className="h-6 w-6 mr-2" />
        {error}
      </div>
    )
  }

  return (
    <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-md overflow-auto">
      {content}
    </pre>
  )
}
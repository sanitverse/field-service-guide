'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Upload, X, File, Image, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: string) => void
  relatedTaskId?: string
  maxFiles?: number
  maxFileSize?: number // in bytes
  acceptedFileTypes?: string[]
  className?: string
}

interface UploadedFile {
  id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  url?: string
}

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  id?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function FileUpload({
  onUploadComplete,
  onUploadError,
  relatedTaskId,
  maxFiles = 10,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  className
}: FileUploadProps) {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`
    }
    
    if (!acceptedFileTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`
    }
    
    return null
  }, [maxFileSize, acceptedFileTypes])

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    if (mimeType === 'application/pdf' || mimeType.includes('document')) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: FileWithProgress[] = []
    const errors: string[] = []

    for (const file of newFiles) {
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`)
        break
      }

      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push({
          file,
          progress: 0,
          status: 'pending'
        })
      }
    }

    if (errors.length > 0 && onUploadError) {
      onUploadError(errors.join(', '))
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
  }, [files.length, maxFiles, validateFile, onUploadError])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const uploadFile = async (fileWithProgress: FileWithProgress, index: number): Promise<UploadedFile | null> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { file } = fileWithProgress
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Update status to uploading
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading' as const, progress: 50 } : f
    ))

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .insert({
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
          related_task_id: relatedTaskId || null
        })
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('task-files').remove([filePath])
        throw dbError
      }

      // Update status to completed
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'completed' as const, id: fileRecord.id } : f
      ))

      return fileRecord
    } catch (error) {
      // Update status to error
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      ))
      return null
    }
  }

  const uploadAllFiles = async () => {
    if (!user || isUploading) return

    setIsUploading(true)
    const uploadPromises = files
      .filter(f => f.status === 'pending')
      .map((file, originalIndex) => {
        const actualIndex = files.findIndex(f => f === file)
        return uploadFile(file, actualIndex)
      })

    try {
      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter((result): result is UploadedFile => result !== null)
      
      if (successfulUploads.length > 0 && onUploadComplete) {
        onUploadComplete(successfulUploads)
      }

      // Remove completed files from the list
      setFiles(prev => prev.filter(f => f.status !== 'completed'))
    } catch (error) {
      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : 'Upload failed')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [addFiles])

  const hasFiles = files.length > 0
  const hasPendingFiles = files.some(f => f.status === 'pending')
  const hasErrors = files.some(f => f.status === 'error')

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Files
        </CardTitle>
        <CardDescription>
          Drag and drop files here or click to browse. 
          Maximum {maxFiles} files, {Math.round(maxFileSize / 1024 / 1024)}MB each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors cursor-pointer touch-manipulation',
            'min-h-[120px] sm:min-h-[160px] flex flex-col justify-center',
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 active:border-primary active:bg-primary/5'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
          <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
            {isDragOver ? 'Drop files here' : 'Tap to choose files'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground px-2">
            Images, PDFs, documents up to {Math.round(maxFileSize / 1024 / 1024)}MB
          </p>
          <p className="text-xs text-muted-foreground mt-1 sm:hidden">
            Or drag and drop files here
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* File List */}
        {hasFiles && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm sm:text-base">Selected Files</h4>
            {files.map((fileWithProgress, index) => (
              <div
                key={`${fileWithProgress.file.name}-${index}`}
                className="flex items-center gap-2 sm:gap-3 p-3 border rounded-lg touch-manipulation"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(fileWithProgress.file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileWithProgress.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(fileWithProgress.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {fileWithProgress.status === 'uploading' && (
                    <Progress value={fileWithProgress.progress} className="mt-2 h-2" />
                  )}
                  
                  {fileWithProgress.status === 'error' && fileWithProgress.error && (
                    <Alert className="mt-2 p-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs ml-2">
                        {fileWithProgress.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {fileWithProgress.status === 'completed' && (
                    <div className="text-green-600 text-xs font-medium">✓</div>
                  )}
                  
                  {fileWithProgress.status === 'error' && (
                    <div className="text-red-600 text-xs font-medium">✗</div>
                  )}
                  
                  {fileWithProgress.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 touch-manipulation"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {hasPendingFiles && (
          <div className="flex justify-stretch sm:justify-end">
            <Button 
              onClick={uploadAllFiles} 
              disabled={isUploading}
              className="w-full sm:w-auto min-w-[120px] touch-manipulation h-12 sm:h-10"
            >
              {isUploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} file(s)`}
            </Button>
          </div>
        )}

        {hasErrors && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some files failed to upload. Please try again or remove the failed files.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
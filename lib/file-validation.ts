// File validation utilities for the file upload system

export const ALLOWED_FILE_TYPES = {
  images: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ],
  documents: [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
} as const

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents
]

export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB for images
  document: 50 * 1024 * 1024, // 50MB for documents
  default: 50 * 1024 * 1024 // 50MB default
} as const

export interface FileValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export interface FileValidationOptions {
  maxFileSize?: number
  allowedTypes?: string[]
  maxFiles?: number
  existingFileCount?: number
}

/**
 * Validates a single file against the specified criteria
 */
export function validateFile(
  file: File, 
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxFileSize = FILE_SIZE_LIMITS.default,
    allowedTypes = ALL_ALLOWED_TYPES
  } = options

  // Check file size
  if (file.size > maxFileSize) {
    return {
      isValid: false,
      error: `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxFileSize)}`
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported for "${file.name}"`
    }
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  
  if (dangerousExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension "${fileExtension}" is not allowed for security reasons`
    }
  }

  // Warnings for large files
  const warnings: string[] = []
  if (file.size > 25 * 1024 * 1024) { // 25MB
    warnings.push(`Large file "${file.name}" may take longer to upload and process`)
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validates multiple files at once
 */
export function validateFiles(
  files: File[], 
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxFiles = 10,
    existingFileCount = 0
  } = options

  // Check total file count
  const totalFiles = files.length + existingFileCount
  if (totalFiles > maxFiles) {
    return {
      isValid: false,
      error: `Too many files. Maximum ${maxFiles} files allowed (currently have ${existingFileCount})`
    }
  }

  // Validate each file
  const errors: string[] = []
  const warnings: string[] = []

  for (const file of files) {
    const result = validateFile(file, options)
    
    if (!result.isValid && result.error) {
      errors.push(result.error)
    }
    
    if (result.warnings) {
      warnings.push(...result.warnings)
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join('; ')
    }
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Checks if a file type is an image
 */
export function isImageFile(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.images.includes(mimeType as any)
}

/**
 * Checks if a file type is a document
 */
export function isDocumentFile(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.documents.includes(mimeType as any)
}

/**
 * Gets the appropriate file size limit based on file type
 */
export function getFileSizeLimit(mimeType: string): number {
  if (isImageFile(mimeType)) {
    return FILE_SIZE_LIMITS.image
  }
  
  if (isDocumentFile(mimeType)) {
    return FILE_SIZE_LIMITS.document
  }
  
  return FILE_SIZE_LIMITS.default
}

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Generates a safe filename for storage
 */
export function generateSafeFilename(originalFilename: string, userId: string): string {
  const extension = getFileExtension(originalFilename)
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  
  return `${userId}/${timestamp}-${randomString}.${extension}`
}

/**
 * Extracts text content from file for processing (client-side preview)
 */
export function canExtractText(mimeType: string): boolean {
  const extractableTypes = [
    'text/plain',
    'text/csv',
    'application/json'
  ]
  
  return extractableTypes.includes(mimeType)
}

/**
 * Checks if file can be previewed in browser
 */
export function canPreviewInBrowser(mimeType: string): boolean {
  const previewableTypes = [
    ...ALLOWED_FILE_TYPES.images,
    'application/pdf',
    'text/plain',
    'text/csv'
  ]
  
  return previewableTypes.includes(mimeType as any)
}
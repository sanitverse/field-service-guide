import {
  validateFile,
  validateFiles,
  isImageFile,
  isDocumentFile,
  getFileSizeLimit,
  formatFileSize,
  getFileExtension,
  generateSafeFilename,
  canExtractText,
  canPreviewInBrowser,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS
} from '@/lib/file-validation'

// Mock File constructor for testing
class MockFile {
  name: string
  size: number
  type: string

  constructor(name: string, size: number, type: string) {
    this.name = name
    this.size = size
    this.type = type
  }
}

// Helper to create mock files
const createMockFile = (name: string, size: number, type: string) => {
  return new MockFile(name, size, type) as unknown as File
}

describe('File Validation', () => {
  describe('validateFile', () => {
    it('should validate a valid image file', () => {
      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg')
      const result = validateFile(file)
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should validate a valid document file', () => {
      const file = createMockFile('document.pdf', 5 * 1024 * 1024, 'application/pdf')
      const result = validateFile(file)
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject file that exceeds size limit', () => {
      const file = createMockFile('large.jpg', 100 * 1024 * 1024, 'image/jpeg')
      const result = validateFile(file, { maxFileSize: 50 * 1024 * 1024 })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('should reject unsupported file type', () => {
      const file = createMockFile('script.exe', 1024, 'application/x-executable')
      const result = validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not supported')
    })

    it('should reject dangerous file extensions', () => {
      const file = createMockFile('malware.exe', 1024, 'application/octet-stream')
      const result = validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not supported')
    })

    it('should provide warnings for large files', () => {
      const file = createMockFile('large.pdf', 30 * 1024 * 1024, 'application/pdf')
      const result = validateFile(file)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings?.[0]).toContain('may take longer')
    })
  })

  describe('validateFiles', () => {
    it('should validate multiple valid files', () => {
      const files = [
        createMockFile('image.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('doc.pdf', 2 * 1024 * 1024, 'application/pdf')
      ]
      const result = validateFiles(files)
      
      expect(result.isValid).toBe(true)
    })

    it('should reject when exceeding max file count', () => {
      const files = Array(15).fill(null).map((_, i) => 
        createMockFile(`file${i}.jpg`, 1024, 'image/jpeg')
      )
      const result = validateFiles(files, { maxFiles: 10 })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Too many files')
    })

    it('should account for existing files in count', () => {
      const files = Array(5).fill(null).map((_, i) => 
        createMockFile(`file${i}.jpg`, 1024, 'image/jpeg')
      )
      const result = validateFiles(files, { maxFiles: 10, existingFileCount: 8 })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Too many files')
    })

    it('should collect errors from individual file validation', () => {
      const files = [
        createMockFile('valid.jpg', 1024, 'image/jpeg'),
        createMockFile('invalid.exe', 1024, 'application/x-executable')
      ]
      const result = validateFiles(files)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not supported')
    })
  })

  describe('File type checking', () => {
    it('should correctly identify image files', () => {
      expect(isImageFile('image/jpeg')).toBe(true)
      expect(isImageFile('image/png')).toBe(true)
      expect(isImageFile('application/pdf')).toBe(false)
    })

    it('should correctly identify document files', () => {
      expect(isDocumentFile('application/pdf')).toBe(true)
      expect(isDocumentFile('text/plain')).toBe(true)
      expect(isDocumentFile('image/jpeg')).toBe(false)
    })

    it('should return appropriate size limits', () => {
      expect(getFileSizeLimit('image/jpeg')).toBe(FILE_SIZE_LIMITS.image)
      expect(getFileSizeLimit('application/pdf')).toBe(FILE_SIZE_LIMITS.document)
      expect(getFileSizeLimit('unknown/type')).toBe(FILE_SIZE_LIMITS.default)
    })
  })

  describe('Utility functions', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB')
    })

    it('should extract file extensions', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('image.JPEG')).toBe('jpeg')
      expect(getFileExtension('noextension')).toBe('noextension')
    })

    it('should generate safe filenames', () => {
      const filename = generateSafeFilename('test document.pdf', 'user123')
      
      expect(filename).toMatch(/^user123\/\d+-[a-z0-9]+\.pdf$/)
      expect(filename).not.toContain(' ')
    })

    it('should identify extractable text files', () => {
      expect(canExtractText('text/plain')).toBe(true)
      expect(canExtractText('text/csv')).toBe(true)
      expect(canExtractText('application/json')).toBe(true)
      expect(canExtractText('image/jpeg')).toBe(false)
    })

    it('should identify previewable files', () => {
      expect(canPreviewInBrowser('image/jpeg')).toBe(true)
      expect(canPreviewInBrowser('application/pdf')).toBe(true)
      expect(canPreviewInBrowser('text/plain')).toBe(true)
      expect(canPreviewInBrowser('application/x-executable')).toBe(false)
    })
  })

  describe('Constants validation', () => {
    it('should have valid allowed file types', () => {
      expect(ALLOWED_FILE_TYPES.images).toContain('image/jpeg')
      expect(ALLOWED_FILE_TYPES.images).toContain('image/png')
      expect(ALLOWED_FILE_TYPES.documents).toContain('application/pdf')
      expect(ALLOWED_FILE_TYPES.documents).toContain('text/plain')
    })

    it('should have reasonable file size limits', () => {
      expect(FILE_SIZE_LIMITS.image).toBeGreaterThan(0)
      expect(FILE_SIZE_LIMITS.document).toBeGreaterThan(0)
      expect(FILE_SIZE_LIMITS.default).toBeGreaterThan(0)
    })
  })
})
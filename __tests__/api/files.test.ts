import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/files/route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn()
  }
}

const mockSupabaseAdmin = {
  from: jest.fn(),
  storage: {
    from: jest.fn()
  }
}

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabaseAdmin
}))

// Mock file validation
jest.mock('@/lib/file-validation', () => ({
  validateFile: jest.fn(),
  generateSafeFilename: jest.fn()
}))

const { validateFile, generateSafeFilename } = require('@/lib/file-validation')

// Helper to create mock request
const createMockRequest = (url: string, options: any = {}) => {
  return {
    url,
    ...options
  } as NextRequest
}

// Helper to create mock session
const createMockSession = (userId = 'user-123') => ({
  user: { id: userId },
  access_token: 'token'
})

describe('/api/files', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/files', () => {
    it('should return files for authenticated user', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          filename: 'test.pdf',
          file_size: 1024,
          uploader: { full_name: 'John Doe' }
        }
      ]

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockFiles,
          error: null
        })
      }

      mockSupabaseAdmin.from.mockReturnValue(mockQuery)

      const request = createMockRequest('http://localhost/api/files')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.files).toEqual(mockFiles)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('files')
    })

    it('should filter files by task ID', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }

      mockSupabaseAdmin.from.mockReturnValue(mockQuery)

      const request = createMockRequest('http://localhost/api/files?taskId=task-123')
      await GET(request)

      expect(mockQuery.eq).toHaveBeenCalledWith('related_task_id', 'task-123')
    })

    it('should filter files by user ID', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }

      mockSupabaseAdmin.from.mockReturnValue(mockQuery)

      const request = createMockRequest('http://localhost/api/files?userId=user-456')
      await GET(request)

      expect(mockQuery.eq).toHaveBeenCalledWith('uploaded_by', 'user-456')
    })

    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const request = createMockRequest('http://localhost/api/files')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should handle database errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      mockSupabaseAdmin.from.mockReturnValue(mockQuery)

      const request = createMockRequest('http://localhost/api/files')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/files', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      validateFile.mockReturnValue({ isValid: true })
      generateSafeFilename.mockReturnValue('user-123/safe-test.pdf')

      // Mock storage upload
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'user-123/safe-test.pdf' },
          error: null
        })
      })

      // Mock database insert
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'file-123',
            filename: 'test.pdf',
            file_path: 'user-123/safe-test.pdf'
          },
          error: null
        })
      }

      mockSupabaseAdmin.from.mockReturnValue(mockInsert)

      const request = {
        formData: () => Promise.resolve(mockFormData)
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.file.id).toBe('file-123')
      expect(validateFile).toHaveBeenCalledWith(mockFile)
      expect(generateSafeFilename).toHaveBeenCalledWith('test.pdf', 'user-123')
    })

    it('should return 400 for invalid files', async () => {
      const mockFile = new File(['content'], 'test.exe', { type: 'application/x-executable' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      validateFile.mockReturnValue({
        isValid: false,
        error: 'File type not supported'
      })

      const request = {
        formData: () => Promise.resolve(mockFormData)
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File type not supported')
    })

    it('should return 400 when no file provided', async () => {
      const mockFormData = new FormData()

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      const request = {
        formData: () => Promise.resolve(mockFormData)
      } as NextRequest

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('should handle storage upload errors', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      validateFile.mockReturnValue({ isValid: true })
      generateSafeFilename.mockReturnValue('user-123/safe-test.pdf')

      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' }
        })
      })

      const request = {
        formData: () => Promise.resolve(mockFormData)
      } as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should cleanup on database error', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      validateFile.mockReturnValue({ isValid: true })
      generateSafeFilename.mockReturnValue('user-123/safe-test.pdf')

      const mockRemove = jest.fn()
      mockSupabaseAdmin.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'user-123/safe-test.pdf' },
          error: null
        }),
        remove: mockRemove
      })

      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      mockSupabaseAdmin.from.mockReturnValue(mockInsert)

      const request = {
        formData: () => Promise.resolve(mockFormData)
      } as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(mockRemove).toHaveBeenCalledWith(['user-123/safe-test.pdf'])
    })
  })

  describe('DELETE /api/files', () => {
    it('should delete file successfully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      // Mock file fetch
      const mockFileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'file-123',
            uploaded_by: 'user-123',
            file_path: 'user-123/test.pdf'
          },
          error: null
        })
      }

      // Mock user profile fetch
      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'technician' },
          error: null
        })
      }

      // Mock delete operations
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      }

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockFileQuery)
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockDeleteQuery)

      mockSupabaseAdmin.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null })
      })

      const request = createMockRequest('http://localhost/api/files?id=file-123')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 when file ID not provided', async () => {
      const request = createMockRequest('http://localhost/api/files')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File ID required')
    })

    it('should return 404 for non-existent files', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      }

      mockSupabaseAdmin.from.mockReturnValue(mockQuery)

      const request = createMockRequest('http://localhost/api/files?id=nonexistent')
      const response = await DELETE(request)

      expect(response.status).toBe(404)
    })

    it('should return 403 for unauthorized deletion', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession('different-user') },
        error: null
      })

      const mockFileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'file-123',
            uploaded_by: 'user-123', // Different from session user
            file_path: 'user-123/test.pdf'
          },
          error: null
        })
      }

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'technician' }, // Not admin/supervisor
          error: null
        })
      }

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockFileQuery)
        .mockReturnValueOnce(mockProfileQuery)

      const request = createMockRequest('http://localhost/api/files?id=file-123')
      const response = await DELETE(request)

      expect(response.status).toBe(403)
    })

    it('should allow admin to delete any file', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession('admin-user') },
        error: null
      })

      const mockFileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'file-123',
            uploaded_by: 'different-user',
            file_path: 'different-user/test.pdf'
          },
          error: null
        })
      }

      const mockProfileQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null
        })
      }

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      }

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockFileQuery)
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockDeleteQuery)

      mockSupabaseAdmin.storage.from.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ error: null })
      })

      const request = createMockRequest('http://localhost/api/files?id=file-123')
      const response = await DELETE(request)

      expect(response.status).toBe(200)
    })
  })
})
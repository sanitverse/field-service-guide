import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '@/components/files/file-upload'

// Mock the auth context
const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
}

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: mockUser
  })
}))

// Mock supabase
const mockSupabase = {
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn()
    }))
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock file validation
jest.mock('@/lib/file-validation', () => ({
  ...jest.requireActual('@/lib/file-validation'),
  generateSafeFilename: jest.fn((filename, userId) => `${userId}/safe-${filename}`)
}))

// Helper to create mock files
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File(['content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FileUpload Component', () => {
  const defaultProps = {
    onUploadComplete: jest.fn(),
    onUploadError: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render upload interface', () => {
    render(<FileUpload {...defaultProps} />)
    
    expect(screen.getByText('Upload Files')).toBeInTheDocument()
    expect(screen.getByText(/Choose files or drag them here/)).toBeInTheDocument()
    expect(screen.getByText(/Supports images, PDFs, documents/)).toBeInTheDocument()
  })

  it('should display file size and count limits', () => {
    render(<FileUpload {...defaultProps} maxFiles={5} maxFileSize={10 * 1024 * 1024} />)
    
    expect(screen.getByText(/Maximum 5 files, 10MB each/)).toBeInTheDocument()
  })

  it('should handle file selection via input', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)
    
    const fileInput = screen.getByRole('button', { name: /choose files or drag them here/i })
    const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg')
    
    // Simulate file selection
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(hiddenInput, file)
    
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
      expect(screen.getByText('1.00 MB')).toBeInTheDocument()
    })
  })

  it('should validate file types', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)
    
    const file = createMockFile('script.exe', 1024, 'application/x-executable')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(hiddenInput, file)
    
    expect(defaultProps.onUploadError).toHaveBeenCalledWith(
      expect.stringContaining('not supported')
    )
  })

  it('should validate file sizes', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} maxFileSize={1024} />)
    
    const file = createMockFile('large.jpg', 2048, 'image/jpeg')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(hiddenInput, file)
    
    expect(defaultProps.onUploadError).toHaveBeenCalledWith(
      expect.stringContaining('must be less than')
    )
  })

  it('should enforce maximum file count', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} maxFiles={2} />)
    
    const files = [
      createMockFile('file1.jpg', 1024, 'image/jpeg'),
      createMockFile('file2.jpg', 1024, 'image/jpeg'),
      createMockFile('file3.jpg', 1024, 'image/jpeg')
    ]
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(hiddenInput, files)
    
    expect(defaultProps.onUploadError).toHaveBeenCalledWith(
      expect.stringContaining('Maximum 2 files allowed')
    )
  })

  it('should allow removing files before upload', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)
    
    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(hiddenInput, file)
    
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })
    
    const removeButton = screen.getByRole('button', { name: '' }) // X button
    await user.click(removeButton)
    
    expect(screen.queryByText('test.jpg')).not.toBeInTheDocument()
  })

  it('should handle drag and drop', async () => {
    render(<FileUpload {...defaultProps} />)
    
    const dropZone = screen.getByText(/Choose files or drag them here/).closest('div')
    const file = createMockFile('dropped.pdf', 2048, 'application/pdf')
    
    // Simulate drag over
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    })
    
    expect(screen.getByText('Drop files here')).toBeInTheDocument()
    
    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    })
    
    await waitFor(() => {
      expect(screen.getByText('dropped.pdf')).toBeInTheDocument()
    })
  })

  it('should upload files successfully', async () => {
    const user = userEvent.setup()
    
    // Mock successful upload
    mockSupabase.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'user-123/safe-test.jpg' },
        error: null
      })
    })
    
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'file-123',
              filename: 'test.jpg',
              file_path: 'user-123/safe-test.jpg',
              file_size: 1024,
              mime_type: 'image/jpeg'
            },
            error: null
          })
        })
      })
    })
    
    render(<FileUpload {...defaultProps} />)
    
    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(hiddenInput, file)
    
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument()
    })
    
    const uploadButton = screen.getByRole('button', { name: /Upload 1 file/ })
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(defaultProps.onUploadComplete).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'file-123',
          filename: 'test.jpg'
        })
      ])
    })
  })

  it('should handle upload errors', async () => {
    const user = userEvent.setup()
    
    // Mock upload failure
    mockSupabase.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      })
    })
    
    render(<FileUpload {...defaultProps} />)
    
    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(hiddenInput, file)
    
    const uploadButton = screen.getByRole('button', { name: /Upload 1 file/ })
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(screen.getByText('✗ Failed')).toBeInTheDocument()
    })
  })

  it('should show upload progress', async () => {
    const user = userEvent.setup()
    
    // Mock slow upload
    mockSupabase.storage.from.mockReturnValue({
      upload: jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { path: 'test' }, error: null }), 100)
        )
      )
    })
    
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'file-123' },
            error: null
          })
        })
      })
    })
    
    render(<FileUpload {...defaultProps} />)
    
    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(hiddenInput, file)
    
    const uploadButton = screen.getByRole('button', { name: /Upload 1 file/ })
    await user.click(uploadButton)
    
    // Should show uploading state
    expect(screen.getByText('Uploading...')).toBeInTheDocument()
  })

  it('should display file icons based on type', async () => {
    const user = userEvent.setup()
    render(<FileUpload {...defaultProps} />)
    
    const files = [
      createMockFile('image.jpg', 1024, 'image/jpeg'),
      createMockFile('document.pdf', 1024, 'application/pdf'),
      createMockFile('text.txt', 1024, 'text/plain')
    ]
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(hiddenInput, files)
    
    await waitFor(() => {
      expect(screen.getByText('image.jpg')).toBeInTheDocument()
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
      expect(screen.getByText('text.txt')).toBeInTheDocument()
    })
  })

  it('should handle database save failure with cleanup', async () => {
    const user = userEvent.setup()
    
    // Mock successful upload but database failure
    const mockRemove = jest.fn()
    mockSupabase.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'user-123/safe-test.jpg' },
        error: null
      }),
      remove: mockRemove
    })
    
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    })
    
    render(<FileUpload {...defaultProps} />)
    
    const file = createMockFile('test.jpg', 1024, 'image/jpeg')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(hiddenInput, file)
    
    const uploadButton = screen.getByRole('button', { name: /Upload 1 file/ })
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(screen.getByText('✗ Failed')).toBeInTheDocument()
    })
    
    // Should clean up uploaded file
    expect(mockRemove).toHaveBeenCalledWith(['user-123/safe-test.jpg'])
  })
})
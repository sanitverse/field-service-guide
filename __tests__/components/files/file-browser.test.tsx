import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileBrowser } from '@/components/files/file-browser'

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

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock file validation
jest.mock('@/lib/file-validation', () => ({
  formatFileSize: jest.fn((bytes) => `${Math.round(bytes / 1024)} KB`)
}))

// Mock child components
jest.mock('@/components/files/file-viewer', () => ({
  FileViewer: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="file-viewer">
        <button onClick={onClose}>Close Viewer</button>
      </div>
    ) : null
}))

jest.mock('@/components/files/file-upload', () => ({
  FileUpload: ({ onUploadComplete }: { onUploadComplete: (files: any[]) => void }) => (
    <div data-testid="file-upload">
      <button onClick={() => onUploadComplete([{ id: 'new-file' }])}>
        Mock Upload
      </button>
    </div>
  )
}))

const mockFiles = [
  {
    id: 'file-1',
    filename: 'document.pdf',
    file_size: 1024 * 1024,
    mime_type: 'application/pdf',
    created_at: '2024-01-01T10:00:00Z',
    is_processed: true,
    uploader: {
      id: 'user-1',
      full_name: 'John Doe',
      email: 'john@example.com'
    },
    related_task: {
      id: 'task-1',
      title: 'Fix printer'
    }
  },
  {
    id: 'file-2',
    filename: 'image.jpg',
    file_size: 512 * 1024,
    mime_type: 'image/jpeg',
    created_at: '2024-01-02T10:00:00Z',
    is_processed: false,
    uploader: {
      id: 'user-2',
      full_name: 'Jane Smith',
      email: 'jane@example.com'
    },
    related_task: null
  }
]

describe('FileBrowser Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ files: mockFiles })
    })
  })

  it('should render file browser interface', async () => {
    render(<FileBrowser />)
    
    expect(screen.getByText('File Browser')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search files/)).toBeInTheDocument()
    expect(screen.getByText('All Files')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
      expect(screen.getByText('image.jpg')).toBeInTheDocument()
    })
  })

  it('should load files on mount', async () => {
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/files?')
    })
    
    expect(screen.getByText('2 of 2 files')).toBeInTheDocument()
  })

  it('should filter files by task when relatedTaskId is provided', async () => {
    render(<FileBrowser relatedTaskId="task-123" />)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/files?taskId=task-123')
    })
  })

  it('should filter files by search query', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText(/Search files/)
    await user.type(searchInput, 'document')
    
    expect(screen.getByText('document.pdf')).toBeInTheDocument()
    expect(screen.queryByText('image.jpg')).not.toBeInTheDocument()
  })

  it('should filter files by type', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Open filter dropdown and select images
    const filterSelect = screen.getByRole('combobox')
    await user.click(filterSelect)
    await user.click(screen.getByText('Images'))
    
    expect(screen.queryByText('document.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('image.jpg')).toBeInTheDocument()
  })

  it('should sort files by different fields', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Click on filename header to sort
    const nameHeader = screen.getByText(/Name/)
    await user.click(nameHeader)
    
    // Should show sort indicator
    expect(nameHeader).toHaveTextContent('↑')
  })

  it('should select and deselect files', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Select first file
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // First file checkbox (0 is select all)
    
    expect(screen.getByText(/Delete \(1\)/)).toBeInTheDocument()
  })

  it('should select all files', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Click select all checkbox
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
    await user.click(selectAllCheckbox)
    
    expect(screen.getByText(/Delete \(2\)/)).toBeInTheDocument()
  })

  it('should delete individual files', async () => {
    const user = userEvent.setup()
    
    // Mock successful delete
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: mockFiles })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Click on file actions menu
    const actionButtons = screen.getAllByRole('button', { name: '' })
    const menuButton = actionButtons.find(button => 
      button.querySelector('svg') // Looking for the MoreHorizontal icon
    )
    
    if (menuButton) {
      await user.click(menuButton)
      
      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/files?id=file-1',
          { method: 'DELETE' }
        )
      })
    }
  })

  it('should handle bulk delete', async () => {
    const user = userEvent.setup()
    
    // Mock successful delete
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: mockFiles })
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Select files
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // First file
    await user.click(checkboxes[2]) // Second file
    
    // Click bulk delete
    const deleteButton = screen.getByText(/Delete \(2\)/)
    await user.click(deleteButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/files?id=file-1',
        { method: 'DELETE' }
      )
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/files?id=file-2',
        { method: 'DELETE' }
      )
    })
  })

  it('should open file viewer', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Click on file actions menu and select view
    const actionButtons = screen.getAllByRole('button', { name: '' })
    const menuButton = actionButtons.find(button => 
      button.querySelector('svg')
    )
    
    if (menuButton) {
      await user.click(menuButton)
      
      const viewButton = screen.getByText('View')
      await user.click(viewButton)
      
      expect(screen.getByTestId('file-viewer')).toBeInTheDocument()
    }
  })

  it('should handle download files', async () => {
    const user = userEvent.setup()
    
    // Mock download API
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: mockFiles })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          downloadUrl: 'https://example.com/download',
          filename: 'document.pdf'
        })
      })
    
    // Mock DOM methods
    const mockLink = {
      click: jest.fn(),
      href: '',
      download: ''
    }
    const mockCreateElement = jest.spyOn(document, 'createElement')
    const mockAppendChild = jest.spyOn(document.body, 'appendChild')
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild')
    
    mockCreateElement.mockReturnValue(mockLink as any)
    mockAppendChild.mockImplementation(() => mockLink as any)
    mockRemoveChild.mockImplementation(() => mockLink as any)
    
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Click download
    const actionButtons = screen.getAllByRole('button', { name: '' })
    const menuButton = actionButtons.find(button => 
      button.querySelector('svg')
    )
    
    if (menuButton) {
      await user.click(menuButton)
      
      const downloadButton = screen.getByText('Download')
      await user.click(downloadButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/files/file-1/download')
        expect(mockLink.click).toHaveBeenCalled()
      })
    }
    
    // Cleanup mocks
    mockCreateElement.mockRestore()
    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
  })

  it('should refresh file list', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
    
    const refreshButton = screen.getByRole('button', { name: '' })
    await user.click(refreshButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  it('should open upload dialog', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    const uploadButton = screen.getByText('Upload Files')
    await user.click(uploadButton)
    
    expect(screen.getByTestId('file-upload')).toBeInTheDocument()
  })

  it('should handle upload completion', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    // Open upload dialog
    const uploadButton = screen.getByText('Upload Files')
    await user.click(uploadButton)
    
    // Trigger upload completion
    const mockUploadButton = screen.getByText('Mock Upload')
    await user.click(mockUploadButton)
    
    // Should refresh file list and close dialog
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2) // Initial load + refresh
      expect(screen.queryByTestId('file-upload')).not.toBeInTheDocument()
    })
  })

  it('should display file status badges', async () => {
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('Processed')).toBeInTheDocument()
      expect(screen.getByText('Processing')).toBeInTheDocument()
    })
  })

  it('should show task associations when enabled', async () => {
    render(<FileBrowser showTaskAssociation={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('Fix printer')).toBeInTheDocument()
      expect(screen.getByText('No task')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' })
    })
    
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<FileBrowser />)
    
    expect(screen.getByText('Loading files...')).toBeInTheDocument()
  })

  it('should show empty state when no files', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ files: [] })
    })
    
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('No files uploaded yet')).toBeInTheDocument()
    })
  })

  it('should show filtered empty state', async () => {
    const user = userEvent.setup()
    render(<FileBrowser />)
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })
    
    // Search for non-existent file
    const searchInput = screen.getByPlaceholderText(/Search files/)
    await user.type(searchInput, 'nonexistent')
    
    expect(screen.getByText('No files match your filters')).toBeInTheDocument()
  })
})
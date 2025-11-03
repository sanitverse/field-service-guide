# File Upload and Storage System

This directory contains the complete file upload and storage system implementation for the Field Service App.

## Components

### Core Components

- **FileUpload** - Drag-and-drop file upload with validation and progress tracking
- **FileBrowser** - Complete file management interface with search, filtering, and bulk operations
- **FilePreview** - File preview and thumbnail generation for different file types
- **FileViewer** - Full-screen file viewer with zoom, rotation, and download capabilities
- **FileTaskAssociation** - Component for linking files to service tasks
- **FileProcessing** - RAG processing management interface

### Features Implemented

#### File Upload (Task 5.1)
- ✅ Drag-and-drop file upload using Shadcn Card and Progress components
- ✅ File type validation and size limits (50MB max, configurable)
- ✅ File preview and thumbnail generation for images
- ✅ Support for multiple file formats: images, PDFs, documents, text files
- ✅ Real-time upload progress tracking
- ✅ Error handling and validation feedback

#### File Browser and Management (Task 5.2)
- ✅ File listing with Shadcn Table and Pagination components
- ✅ Advanced search and filtering capabilities (by name, type, status)
- ✅ File association with tasks and bulk operations
- ✅ Sortable columns (name, size, date, type)
- ✅ Bulk selection and deletion
- ✅ Role-based permissions and access control

#### RAG Processing Pipeline (Task 5.3)
- ✅ API routes for file processing and text extraction
- ✅ Document chunking and embedding generation (placeholder for OpenAI)
- ✅ Background job processing system for large files
- ✅ Processing status tracking and batch operations
- ✅ Support for text extraction from various file types

## API Endpoints

### File Management
- `GET /api/files` - List files with filtering options
- `POST /api/files` - Upload new files
- `DELETE /api/files?id={fileId}` - Delete files
- `GET /api/files/{id}/download` - Generate secure download URLs

### File Processing
- `POST /api/files/{id}/process` - Process individual files for RAG
- `GET /api/files/{id}/process` - Get processing status and chunks
- `POST /api/files/process-batch` - Batch process multiple files
- `GET /api/files/process-batch` - Get batch processing statistics

## Database Schema

### Files Table
```sql
files (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  related_task_id UUID REFERENCES service_tasks(id),
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE
)
```

### Document Chunks Table (for RAG)
```sql
document_chunks (
  id UUID PRIMARY KEY,
  file_id UUID REFERENCES files(id),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  chunk_index INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
```

### Background Jobs Table
```sql
background_jobs (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  result JSONB,
  retry_count INTEGER,
  max_retries INTEGER
)
```

## Storage Configuration

Files are stored in Supabase Storage with the following buckets:
- `task-files` - Main file storage for documents and media
- `profile-avatars` - User profile pictures

### Security Policies
- Users can only access files they uploaded or are associated with their tasks
- Admins and supervisors have full access to all files
- Role-based access control enforced at both API and storage levels

## Usage Examples

### Basic File Upload
```tsx
import { FileUpload } from '@/components/files'

<FileUpload
  onUploadComplete={(files) => console.log('Uploaded:', files)}
  relatedTaskId="task-123"
  maxFiles={5}
  maxFileSize={10 * 1024 * 1024} // 10MB
/>
```

### File Browser
```tsx
import { FileBrowser } from '@/components/files'

<FileBrowser
  relatedTaskId="task-123" // Optional: filter by task
  showUpload={true}
  showTaskAssociation={true}
/>
```

### File Processing
```tsx
import { FileProcessing } from '@/components/files'

<FileProcessing />
```

## File Type Support

### Supported for Upload
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
- Text: Plain text, CSV, JSON, HTML

### Supported for RAG Processing
- Text files: Plain text, CSV, JSON, HTML
- Documents: PDF, Word, Excel (requires additional libraries)

## Next Steps

1. **Enhanced Text Extraction**: Implement proper PDF and Office document text extraction using libraries like `pdf-parse` and `mammoth`
2. **OpenAI Integration**: Replace placeholder embedding generation with actual OpenAI API calls
3. **Advanced Search**: Implement vector similarity search for RAG queries
4. **File Versioning**: Add support for file versions and history
5. **Thumbnail Generation**: Implement server-side thumbnail generation for documents
6. **Virus Scanning**: Add file security scanning before processing

## Dependencies

- `@radix-ui/react-checkbox` - Checkbox component for file selection
- `@supabase/supabase-js` - Supabase client for storage and database
- `lucide-react` - Icons for UI components
- `zod` - Schema validation for file uploads

## Security Considerations

- File type validation on both client and server
- File size limits enforced
- Secure file paths to prevent directory traversal
- Row Level Security (RLS) policies in Supabase
- Signed URLs for secure file access
- Role-based access control throughout the system
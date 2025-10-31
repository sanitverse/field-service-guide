# Field Service App Design Document

## Overview

A modern field service management application built with Next.js 14, Supabase, and Shadcn UI components. The application provides role-based access control, service task management, intelligent file handling with RAG capabilities, and AI agent assistance for field service operations.

## Architecture

### Technology Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI component library
- **Backend**: Supabase (Database, Authentication, Storage, Edge Functions)
- **AI/RAG**: OpenAI API with custom embedding storage in Supabase
- **State Management**: React Context + useReducer for complex state, React Query for server state
- **File Processing**: Server-side processing for document chunking and embedding generation

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   Supabase API   │────│   OpenAI API    │
│   (Frontend)    │    │   (Backend)      │    │   (AI/RAG)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────────────┐              │
         └──────────────│  File Storage  │──────────────┘
                        │   (Supabase)   │
                        └────────────────┘
```

## Components and Interfaces

### Core Layout Components

#### 1. App Shell (`app/layout.tsx`)
- **Shadcn Components**: `NavigationMenu`, `Sheet`, `Button`, `Avatar`
- **Features**: Responsive navigation, user menu, role-based menu items
- **Mobile**: Collapsible sidebar using `Sheet` component

#### 2. Dashboard Layout (`app/dashboard/layout.tsx`)
- **Shadcn Components**: `Sidebar`, `Breadcrumb`, `Separator`
- **Features**: Role-based sidebar navigation, breadcrumb trail
- **Responsive**: Adaptive layout for mobile and desktop

### Authentication Components

#### 3. Login Form (`components/auth/login-form.tsx`)
- **Shadcn Components**: `Card`, `Form`, `Input`, `Button`, `Alert`
- **Features**: Email/password authentication, form validation
- **Integration**: Supabase Auth with error handling

#### 4. Role Guard (`components/auth/role-guard.tsx`)
- **Purpose**: Protect routes and components based on user roles
- **Implementation**: HOC pattern with role checking logic

### Task Management Components

#### 5. Task Dashboard (`app/dashboard/tasks/page.tsx`)
- **Shadcn Components**: `DataTable`, `Badge`, `Select`, `DatePicker`
- **Features**: Filterable task list, status indicators, priority badges
- **Actions**: Create, assign, update tasks

#### 6. Task Form (`components/tasks/task-form.tsx`)
- **Shadcn Components**: `Dialog`, `Form`, `Textarea`, `Select`, `Calendar`
- **Features**: Task creation/editing, user assignment, due date selection
- **Validation**: Zod schema validation with form error handling

#### 7. Task Card (`components/tasks/task-card.tsx`)
- **Shadcn Components**: `Card`, `Badge`, `Button`, `DropdownMenu`
- **Features**: Task preview, quick actions, status updates
- **Mobile**: Touch-friendly design with swipe actions

### File Management Components

#### 8. File Upload (`components/files/file-upload.tsx`)
- **Shadcn Components**: `Card`, `Progress`, `Button`, `Alert`
- **Features**: Drag-and-drop upload, progress tracking, file validation
- **Processing**: Automatic RAG processing trigger on upload

#### 9. File Browser (`components/files/file-browser.tsx`)
- **Shadcn Components**: `Table`, `Pagination`, `Input`, `Select`
- **Features**: File listing, search, filtering, preview
- **Actions**: Download, delete, associate with tasks

#### 10. Document Viewer (`components/files/document-viewer.tsx`)
- **Shadcn Components**: `Dialog`, `ScrollArea`, `Button`
- **Features**: PDF preview, image gallery, document navigation
- **Integration**: Highlight search results from RAG queries

### AI and Search Components

#### 11. AI Chat Interface (`components/ai/chat-interface.tsx`)
- **Shadcn Components**: `Card`, `ScrollArea`, `Input`, `Button`, `Avatar`
- **Features**: Real-time chat, message history, typing indicators
- **Context**: Access to user role and current task context

#### 12. RAG Search (`components/search/rag-search.tsx`)
- **Shadcn Components**: `Command`, `Badge`, `Separator`, `ScrollArea`
- **Features**: Natural language search, result highlighting, source attribution
- **Performance**: Debounced search with loading states

#### 13. Search Results (`components/search/search-results.tsx`)
- **Shadcn Components**: `Card`, `Badge`, `Button`, `Collapsible`
- **Features**: Expandable result cards, relevance scores, source links
- **Navigation**: Jump to original document sections

### Dashboard and Analytics Components

#### 14. Analytics Dashboard (`app/dashboard/analytics/page.tsx`)
- **Shadcn Components**: `Card`, `Tabs`, `Select`, `DateRangePicker`
- **Features**: KPI cards, interactive charts, date filtering
- **Charts**: Integration with Recharts for data visualization

#### 15. User Management (`app/dashboard/users/page.tsx`)
- **Shadcn Components**: `DataTable`, `Dialog`, `Select`, `Switch`
- **Features**: User listing, role assignment, status management
- **Permissions**: Admin-only access with role guards

## Data Models

### Database Schema (Supabase)

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'supervisor', 'technician', 'customer')) DEFAULT 'technician',
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Tasks
CREATE TABLE service_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files and Documents
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  related_task_id UUID REFERENCES service_tasks(id),
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Chunks for RAG
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  chunk_index INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES service_tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Interactions
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### TypeScript Interfaces

```typescript
// User and Authentication
interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'supervisor' | 'technician' | 'customer';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Service Tasks
interface ServiceTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  assignee?: User;
  creator?: User;
  comments?: TaskComment[];
  files?: FileRecord[];
}

// File Management
interface FileRecord {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  related_task_id?: string;
  is_processed: boolean;
  created_at: string;
  uploader?: User;
}

// RAG and Search
interface DocumentChunk {
  id: string;
  file_id: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, any>;
  created_at: string;
}

interface SearchResult {
  chunk: DocumentChunk;
  file: FileRecord;
  similarity_score: number;
  highlighted_content: string;
}

// AI Interactions
interface AIInteraction {
  id: string;
  user_id: string;
  question: string;
  response: string;
  context: Record<string, any>;
  created_at: string;
}
```

## Error Handling

### Client-Side Error Handling
- **Toast Notifications**: Using Shadcn `Toast` component for user feedback
- **Form Validation**: Zod schemas with Shadcn `Form` error display
- **Loading States**: Skeleton components and spinners for async operations
- **Error Boundaries**: React error boundaries for component-level error handling

### Server-Side Error Handling
- **API Routes**: Standardized error responses with proper HTTP status codes
- **Supabase Errors**: Custom error mapping for database and auth errors
- **File Upload Errors**: Validation and processing error handling
- **AI Service Errors**: Graceful degradation when AI services are unavailable

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library for Shadcn UI component testing
- **Utilities**: Jest for business logic and helper functions
- **Hooks**: Custom hook testing with React Hooks Testing Library

### Integration Testing
- **API Routes**: Supertest for Next.js API route testing
- **Database**: Supabase local development with test data
- **File Upload**: Mock file upload and processing workflows

### End-to-End Testing
- **User Flows**: Playwright for critical user journeys
- **Role-Based Access**: Test different user roles and permissions
- **Mobile Responsiveness**: Cross-device testing for Shadcn responsive components

### Performance Testing
- **File Upload**: Large file handling and processing performance
- **RAG Queries**: Search response time optimization
- **Database Queries**: Query performance monitoring and optimization
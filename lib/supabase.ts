import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create a client for server-side operations with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'supervisor' | 'technician' | 'customer'
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'supervisor' | 'technician' | 'customer'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'supervisor' | 'technician' | 'customer'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      service_tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          created_by: string
          due_date: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          created_by: string
          due_date?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          created_by?: string
          due_date?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          filename: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string
          related_task_id: string | null
          is_processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          filename: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by: string
          related_task_id?: string | null
          is_processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          filename?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string
          related_task_id?: string | null
          is_processed?: boolean
          created_at?: string
        }
      }
      document_chunks: {
        Row: {
          id: string
          file_id: string
          content: string
          embedding: number[] | null
          chunk_index: number | null
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          content: string
          embedding?: number[] | null
          chunk_index?: number | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          content?: string
          embedding?: number[] | null
          chunk_index?: number | null
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
      }
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          question: string
          response: string
          context: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          response: string
          context?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          response?: string
          context?: Record<string, any> | null
          created_at?: string
        }
      }
    }
    Functions: {
      search_documents: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          file_id: string
          content: string
          similarity: number
          metadata: Record<string, any> | null
        }[]
      }
      get_task_statistics: {
        Args: {
          user_id?: string
        }
        Returns: {
          total_tasks: number
          pending_tasks: number
          in_progress_tasks: number
          completed_tasks: number
          overdue_tasks: number
        }[]
      }
      get_user_activity_metrics: {
        Args: {
          days_back?: number
        }
        Returns: {
          user_id: string
          full_name: string | null
          role: string
          tasks_created: number
          tasks_completed: number
          files_uploaded: number
          ai_interactions: number
        }[]
      }
      get_storage_statistics: {
        Args: {}
        Returns: {
          total_files: number
          total_size_bytes: number
          processed_files: number
          unprocessed_files: number
          avg_file_size_mb: number
        }[]
      }
    }
  }
}

// Type helpers
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ServiceTask = Database['public']['Tables']['service_tasks']['Row']
export type FileRecord = Database['public']['Tables']['files']['Row']
export type DocumentChunk = Database['public']['Tables']['document_chunks']['Row']
export type TaskComment = Database['public']['Tables']['task_comments']['Row']
export type AIInteraction = Database['public']['Tables']['ai_interactions']['Row']
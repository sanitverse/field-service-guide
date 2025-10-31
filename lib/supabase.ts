import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    }
  }
}
import { supabase, supabaseAdmin, type Database } from './supabase'

// Type aliases for convenience
type Tables = Database['public']['Tables']
type Profile = Tables['profiles']['Row']
type ServiceTask = Tables['service_tasks']['Row']
type FileRecord = Tables['files']['Row']

/**
 * Database utility functions for common operations
 */

// Profile operations
export const profileOperations = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    
    return data
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating profile:', error)
      return null
    }
    
    return data
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'active')
      .order('full_name')
    
    if (error) {
      console.error('Error fetching profiles:', error)
      return []
    }
    
    return data || []
  }
}

// Task operations
export const taskOperations = {
  async getTasks(userId?: string): Promise<ServiceTask[]> {
    let query = supabase
      .from('service_tasks')
      .select(`
        *,
        assignee:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (userId) {
      query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching tasks:', error)
      return []
    }
    
    return data || []
  },

  async createTask(task: Tables['service_tasks']['Insert']): Promise<ServiceTask | null> {
    const { data, error } = await supabase
      .from('service_tasks')
      .insert(task)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating task:', error)
      return null
    }
    
    return data
  },

  async updateTask(taskId: string, updates: Tables['service_tasks']['Update']): Promise<ServiceTask | null> {
    const { data, error } = await supabase
      .from('service_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating task:', error)
      return null
    }
    
    return data
  },

  async getTaskStatistics(userId?: string) {
    const { data, error } = await supabase
      .rpc('get_task_statistics', { user_id: userId })
    
    if (error) {
      console.error('Error fetching task statistics:', error)
      return null
    }
    
    return data?.[0] || null
  }
}

// File operations
export const fileOperations = {
  async getFiles(taskId?: string): Promise<FileRecord[]> {
    let query = supabase
      .from('files')
      .select(`
        *,
        uploader:uploaded_by(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (taskId) {
      query = query.eq('related_task_id', taskId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching files:', error)
      return []
    }
    
    return data || []
  },

  async createFileRecord(file: Tables['files']['Insert']): Promise<FileRecord | null> {
    const { data, error } = await supabase
      .from('files')
      .insert(file)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating file record:', error)
      return null
    }
    
    return data
  },

  async uploadFile(file: File, path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('task-files')
      .upload(path, file)
    
    if (error) {
      console.error('Error uploading file:', error)
      return null
    }
    
    return data.path
  },

  async getFileUrl(path: string): Promise<string | null> {
    const { data } = supabase.storage
      .from('task-files')
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}

// Search operations
export const searchOperations = {
  async searchDocuments(query: string, embedding: number[]): Promise<any[]> {
    const { data, error } = await supabase
      .rpc('search_documents', {
        query_embedding: embedding,
        match_threshold: 0.78,
        match_count: 10
      })
    
    if (error) {
      console.error('Error searching documents:', error)
      return []
    }
    
    return data || []
  }
}

// Analytics operations
export const analyticsOperations = {
  async getUserActivityMetrics(daysBack: number = 30) {
    const { data, error } = await supabase
      .rpc('get_user_activity_metrics', { days_back: daysBack })
    
    if (error) {
      console.error('Error fetching user activity metrics:', error)
      return []
    }
    
    return data || []
  },

  async getStorageStatistics() {
    const { data, error } = await supabase
      .rpc('get_storage_statistics')
    
    if (error) {
      console.error('Error fetching storage statistics:', error)
      return null
    }
    
    return data?.[0] || null
  }
}

// AI operations
export const aiOperations = {
  async saveInteraction(interaction: Tables['ai_interactions']['Insert']) {
    const { data, error } = await supabase
      .from('ai_interactions')
      .insert(interaction)
      .select()
      .single()
    
    if (error) {
      console.error('Error saving AI interaction:', error)
      return null
    }
    
    return data
  },

  async getUserInteractions(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching AI interactions:', error)
      return []
    }
    
    return data || []
  }
}
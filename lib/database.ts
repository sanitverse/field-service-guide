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

  async createTask(task: Tables['service_tasks']['Insert'], notifyAssignee = true): Promise<ServiceTask | null> {
    const { data, error } = await supabase
      .from('service_tasks')
      .insert(task)
      .select(`
        *,
        assignee:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .single()
    
    if (error) {
      console.error('Error creating task:', error)
      return null
    }

    // Create notification for assignee if task is assigned
    if (data.assigned_to && notifyAssignee) {
      await this.createTaskNotification(data, 'assigned')
    }
    
    return data
  },

  async updateTask(taskId: string, updates: Tables['service_tasks']['Update'], notifyChanges = true): Promise<ServiceTask | null> {
    // Get the current task to compare changes
    const { data: currentTask } = await supabase
      .from('service_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    const { data, error } = await supabase
      .from('service_tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        assignee:assigned_to(id, full_name, email),
        creator:created_by(id, full_name, email)
      `)
      .single()
    
    if (error) {
      console.error('Error updating task:', error)
      return null
    }

    // Create notifications for relevant changes
    if (notifyChanges && currentTask) {
      // Assignment change notification
      if (updates.assigned_to && updates.assigned_to !== currentTask.assigned_to) {
        await this.createTaskNotification(data, 'assigned')
      }
      
      // Status change notification
      if (updates.status && updates.status !== currentTask.status) {
        await this.createTaskNotification(data, 'status_changed', {
          oldStatus: currentTask.status,
          newStatus: updates.status
        })
      }
    }
    
    return data
  },

  async createTaskNotification(task: any, type: 'assigned' | 'status_changed' | 'comment_added', metadata?: any) {
    try {
      let title = ''
      let message = ''
      let targetUserId = ''

      switch (type) {
        case 'assigned':
          if (task.assignee) {
            title = 'New Task Assignment'
            message = `You have been assigned to task: ${task.title}`
            targetUserId = task.assignee.id
          }
          break
        
        case 'status_changed':
          title = 'Task Status Updated'
          message = `Task "${task.title}" status changed from ${metadata?.oldStatus} to ${metadata?.newStatus}`
          // Notify both assignee and creator
          if (task.assignee) {
            targetUserId = task.assignee.id
          } else if (task.creator) {
            targetUserId = task.creator.id
          }
          break
        
        case 'comment_added':
          title = 'New Task Comment'
          message = `New comment added to task: ${task.title}`
          // Notify assignee if not the commenter
          if (task.assignee && task.assignee.id !== metadata?.commenterId) {
            targetUserId = task.assignee.id
          }
          break
      }

      if (targetUserId && title && message) {
        // In a real implementation, you would save this to a notifications table
        // For now, we'll use browser notifications or in-app notifications
        console.log('Notification created:', { title, message, targetUserId, taskId: task.id })
      }
    } catch (error) {
      console.error('Error creating task notification:', error)
    }
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

// Comment operations
export const commentOperations = {
  async getTaskComments(taskId: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        author:author_id(id, full_name, email)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching task comments:', error)
      return []
    }
    
    return data || []
  },

  async createComment(comment: Tables['task_comments']['Insert']) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert(comment)
      .select(`
        *,
        author:author_id(id, full_name, email)
      `)
      .single()
    
    if (error) {
      console.error('Error creating comment:', error)
      return null
    }

    // Get task details for notification
    if (data) {
      const { data: task } = await supabase
        .from('service_tasks')
        .select(`
          *,
          assignee:assigned_to(id, full_name, email),
          creator:created_by(id, full_name, email)
        `)
        .eq('id', comment.task_id)
        .single()

      if (task) {
        await taskOperations.createTaskNotification(task, 'comment_added', {
          commenterId: comment.author_id
        })
      }
    }
    
    return data
  },

  async updateComment(commentId: string, updates: Tables['task_comments']['Update']) {
    const { data, error } = await supabase
      .from('task_comments')
      .update(updates)
      .eq('id', commentId)
      .select(`
        *,
        author:author_id(id, full_name, email)
      `)
      .single()
    
    if (error) {
      console.error('Error updating comment:', error)
      return null
    }
    
    return data
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId)
    
    if (error) {
      console.error('Error deleting comment:', error)
      return false
    }
    
    return true
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
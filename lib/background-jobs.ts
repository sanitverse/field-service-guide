// Background job system for file processing

import { supabaseAdmin } from './supabase'
import { processFileForRAG } from './file-processing'

export interface Job {
  id: string
  type: 'file_processing'
  payload: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  started_at?: string
  completed_at?: string
  error?: string
  retry_count: number
  max_retries: number
}

export interface FileProcessingJob {
  fileId: string
  options?: {
    chunkSize?: number
    chunkOverlap?: number
    maxChunks?: number
  }
}

/**
 * Queue a file for background processing
 */
export async function queueFileProcessing(
  fileId: string,
  options: FileProcessingJob['options'] = {}
): Promise<string> {
  // For now, we'll use a simple database table to store jobs
  // In production, you might want to use a proper job queue like Bull or Agenda
  
  const { data: job, error } = await supabaseAdmin
    .from('background_jobs')
    .insert({
      type: 'file_processing',
      payload: { fileId, options },
      status: 'pending',
      retry_count: 0,
      max_retries: 3
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to queue job: ${error.message}`)
  }

  return job.id
}

/**
 * Process pending jobs
 */
export async function processPendingJobs(limit: number = 5): Promise<void> {
  // Get pending jobs
  const { data: jobs, error } = await supabaseAdmin
    .from('background_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at')
    .limit(limit)

  if (error) {
    console.error('Failed to fetch pending jobs:', error)
    return
  }

  if (!jobs || jobs.length === 0) {
    return
  }

  // Process each job
  for (const job of jobs) {
    await processJob(job)
  }
}

/**
 * Process a single job
 */
async function processJob(job: Job): Promise<void> {
  try {
    // Mark job as processing
    await supabaseAdmin
      .from('background_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', job.id)

    let result: any

    switch (job.type) {
      case 'file_processing':
        result = await processFileProcessingJob(job.payload as FileProcessingJob)
        break
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }

    // Mark job as completed
    await supabaseAdmin
      .from('background_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result
      })
      .eq('id', job.id)

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const newRetryCount = job.retry_count + 1

    if (newRetryCount >= job.max_retries) {
      // Mark as failed
      await supabaseAdmin
        .from('background_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: errorMessage,
          retry_count: newRetryCount
        })
        .eq('id', job.id)
    } else {
      // Reset to pending for retry
      await supabaseAdmin
        .from('background_jobs')
        .update({
          status: 'pending',
          error: errorMessage,
          retry_count: newRetryCount,
          started_at: null
        })
        .eq('id', job.id)
    }
  }
}

/**
 * Process a file processing job
 */
async function processFileProcessingJob(payload: FileProcessingJob): Promise<any> {
  const { fileId, options = {} } = payload

  const result = await processFileForRAG(fileId, options)

  if (!result.success) {
    throw new Error(result.error || 'File processing failed')
  }

  return {
    chunks_created: result.chunks?.length || 0,
    processing_completed: true
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<Job | null> {
  const { data: job, error } = await supabaseAdmin
    .from('background_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    console.error('Failed to get job status:', error)
    return null
  }

  return job
}

/**
 * Get jobs by file ID
 */
export async function getJobsByFileId(fileId: string): Promise<Job[]> {
  const { data: jobs, error } = await supabaseAdmin
    .from('background_jobs')
    .select('*')
    .eq('type', 'file_processing')
    .contains('payload', { fileId })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get jobs by file ID:', error)
    return []
  }

  return jobs || []
}

/**
 * Clean up old completed jobs
 */
export async function cleanupOldJobs(daysOld: number = 7): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const { error } = await supabaseAdmin
    .from('background_jobs')
    .delete()
    .in('status', ['completed', 'failed'])
    .lt('completed_at', cutoffDate.toISOString())

  if (error) {
    console.error('Failed to cleanup old jobs:', error)
  }
}

/**
 * Get job statistics
 */
export async function getJobStats(): Promise<{
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
}> {
  const { data: stats, error } = await supabaseAdmin
    .from('background_jobs')
    .select('status')

  if (error) {
    console.error('Failed to get job stats:', error)
    return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
  }

  const counts = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: stats?.length || 0
  }

  stats?.forEach(job => {
    counts[job.status as keyof typeof counts]++
  })

  return counts
}

/**
 * Auto-process files on upload (call this after file upload)
 */
export async function autoProcessFile(fileId: string): Promise<void> {
  try {
    // Check if file can be processed
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('mime_type')
      .eq('id', fileId)
      .single()

    if (!file) return

    // Queue for processing if it's a processable file type
    const processableTypes = [
      'text/plain',
      'text/csv',
      'application/json',
      'text/html'
      // Add more types as needed
    ]

    if (processableTypes.includes(file.mime_type || '')) {
      await queueFileProcessing(fileId)
    }
  } catch (error) {
    console.error('Failed to auto-process file:', error)
  }
}

// Export a function to start the job processor
export function startJobProcessor(intervalMs: number = 30000): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      await processPendingJobs()
    } catch (error) {
      console.error('Job processor error:', error)
    }
  }, intervalMs)
}
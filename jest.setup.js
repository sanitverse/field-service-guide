import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for Request/Response (needed for Next.js API routes)
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map(Object.entries(options.headers || {}))
    this.body = options.body
  }
  
  async json() {
    return JSON.parse(this.body)
  }
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.headers = new Map(Object.entries(options.headers || {}))
  }
  
  async json() {
    return JSON.parse(this.body)
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}))

// Mock OpenAI
jest.mock('./lib/openai', () => ({
  generateEmbedding: jest.fn(),
  generateEmbeddings: jest.fn(),
  chunkText: jest.fn(),
  extractTextFromFile: jest.fn(),
}))

// Mock database operations
jest.mock('./lib/database', () => ({
  profileOperations: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getAllProfiles: jest.fn(),
    createMockProfile: jest.fn(),
  },
  taskOperations: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    createTaskNotification: jest.fn(),
  },
  fileOperations: {
    getFiles: jest.fn(),
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  },
  aiOperations: {
    saveInteraction: jest.fn(),
    getUserInteractions: jest.fn(),
  },
}))
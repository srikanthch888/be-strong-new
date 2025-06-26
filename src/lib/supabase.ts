import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file contains:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  )
}

// Enhanced Supabase client with custom fetch implementation
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: enhancedFetch,
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Enhanced fetch with retry logic and better error handling
async function enhancedFetch(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  const maxRetries = 3
  const retryDelay = 1000 // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check network connectivity before making request
      if (!navigator.onLine) {
        throw new NetworkError('No internet connection detected', 'OFFLINE')
      }

      // Validate URL
      const urlString = url.toString()
      if (!urlString.startsWith('http')) {
        throw new NetworkError(`Invalid URL: ${urlString}`, 'INVALID_URL')
      }

      console.log(`🌐 Supabase request attempt ${attempt}:`, {
        url: urlString,
        method: options?.method || 'GET',
        timestamp: new Date().toISOString()
      })

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new NetworkError('Request timeout after 30 seconds', 'TIMEOUT'))
        }, 30000)
      })

      const fetchPromise = fetch(url, {
        ...options,
        signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : options?.signal
      })

      const response = await Promise.race([fetchPromise, timeoutPromise])

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`❌ Supabase request failed:`, {
          status: response.status,
          statusText: response.statusText,
          url: urlString,
          error: errorText,
          attempt
        })

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new NetworkError(
            `Client error ${response.status}: ${response.statusText}`,
            'CLIENT_ERROR',
            response.status
          )
        }

        // Retry on server errors (5xx) and other errors
        if (attempt === maxRetries) {
          throw new NetworkError(
            `Server error ${response.status}: ${response.statusText}`,
            'SERVER_ERROR',
            response.status
          )
        }
      } else {
        console.log(`✅ Supabase request successful:`, {
          status: response.status,
          url: urlString,
          attempt
        })
        return response
      }
    } catch (error) {
      console.error(`💥 Supabase request error (attempt ${attempt}):`, {
        error: error instanceof Error ? error.message : String(error),
        url: url.toString(),
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      })

      // Don't retry on certain errors
      if (error instanceof NetworkError) {
        if (error.code === 'OFFLINE' || error.code === 'INVALID_URL' || error.code === 'CLIENT_ERROR') {
          throw error
        }
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        // Convert generic errors to more specific ones
        if (error instanceof Error) {
          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new NetworkError(
              'Network request failed. This could be due to:\n' +
              '• No internet connection\n' +
              '• Supabase service unavailable\n' +
              '• Firewall blocking requests\n' +
              '• Invalid Supabase configuration',
              'FETCH_FAILED'
            )
          }
          if (error.name === 'AbortError' || error.message.includes('timeout')) {
            throw new NetworkError('Request timed out', 'TIMEOUT')
          }
        }
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }

  throw new NetworkError('All retry attempts failed', 'MAX_RETRIES_EXCEEDED')
}

// Custom error class for better error handling
export class NetworkError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Network status monitoring
export class NetworkMonitor {
  private static instance: NetworkMonitor
  private listeners: Set<(online: boolean) => void> = new Set()
  private _isOnline = navigator.onLine

  private constructor() {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor()
    }
    return NetworkMonitor.instance
  }

  get isOnline(): boolean {
    return this._isOnline
  }

  addListener(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private handleOnline(): void {
    this._isOnline = true
    console.log('🌐 Network connection restored')
    this.notifyListeners(true)
  }

  private handleOffline(): void {
    this._isOnline = false
    console.log('🔌 Network connection lost')
    this.notifyListeners(false)
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(online)
      } catch (error) {
        console.error('Error in network status listener:', error)
      }
    })
  }

  // Test network connectivity using Supabase client's built-in capabilities
  async testConnectivity(): Promise<boolean> {
    try {
      // First check if navigator says we're online
      if (!navigator.onLine) {
        return false
      }

      // Use Supabase's getSession method to test connectivity
      // This is a lightweight operation that tests if we can communicate with the Supabase API
      const { error } = await supabase.auth.getSession()
      
      // If there's no error, we have connectivity
      // Note: Even if the user is not authenticated, this should succeed if connectivity is working
      if (!error) {
        console.log('✅ Supabase connectivity test successful')
        return true
      }
      
      // Check if the error is network-related or just auth-related
      if (error.message && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network Error') ||
        error.message.includes('timeout')
      )) {
        console.log('❌ Supabase connectivity test failed - network error:', error.message)
        return false
      }
      
      // If it's not a network error (e.g., auth configuration issues), 
      // we still have connectivity to Supabase
      console.log('✅ Supabase connectivity test successful (auth error but network is working)')
      return true
      
    } catch (error) {
      // Handle any unexpected errors gracefully
      console.log('❌ Supabase connectivity test failed:', error)
      return false
    }
  }
}

// Utility functions for better error handling
export const supabaseErrorHandler = {
  // Handle and format Supabase errors
  formatError(error: any): { message: string; type: string; details?: any } {
    if (error instanceof NetworkError) {
      return {
        message: error.message,
        type: 'network',
        details: { code: error.code, statusCode: error.statusCode }
      }
    }

    if (error?.code) {
      // Supabase-specific errors
      switch (error.code) {
        case 'PGRST116':
          return {
            message: 'Database relationship error. Please check your data configuration.',
            type: 'database',
            details: error
          }
        case '23505':
          return {
            message: 'This item already exists. Please try with different data.',
            type: 'database',
            details: error
          }
        case '42501':
          return {
            message: 'Permission denied. Please check your account permissions.',
            type: 'permission',
            details: error
          }
        default:
          return {
            message: error.message || 'An unexpected database error occurred.',
            type: 'database',
            details: error
          }
      }
    }

    if (error?.message) {
      // Generic error with message
      return {
        message: error.message,
        type: 'unknown',
        details: error
      }
    }

    // Fallback for unknown errors
    return {
      message: 'An unexpected error occurred. Please try again.',
      type: 'unknown',
      details: error
    }
  },

  // Log error for debugging
  logError(error: any, context?: string): void {
    const formatted = this.formatError(error)
    console.error(`🚨 Supabase Error${context ? ` (${context})` : ''}:`, {
      ...formatted,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }
}

export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type FitnessRoute = {
  id: string
  name: string
  description: string
  distance: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes: number
  route_type: string
  created_by: string
  created_at: string
}

export type SavedRoute = {
  id: string
  user_id: string
  route_id: string
  status: 'to-do' | 'completed' | 'favorite'
  saved_at: string
  completed_at: string | null
  notes: string
  fitness_routes?: FitnessRoute
}

export type ProcrastinationStep = {
  name: string
  description: string
  timeInvestment: string
  benefit: string
}

export type SavedProcrastinationRoute = {
  id: string
  user_id: string
  original_task: string
  title?: string | null
  route_steps: ProcrastinationStep[]
  status: 'active' | 'completed' | 'archived'
  created_at: string
  completed_at: string | null
  notes: string
  is_active: boolean
}
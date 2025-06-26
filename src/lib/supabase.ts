import { createClient } from '@supabase/supabase-js'

// Enhanced environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Comprehensive validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase Environment Variables:', {
    url: supabaseUrl ? '✅ Present' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Present' : '❌ Missing'
  })
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file contains:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  )
}

// Validate URL format
try {
  const url = new URL(supabaseUrl)
  if (!url.hostname.includes('supabase.co')) {
    console.warn('⚠️ Unusual Supabase URL format:', supabaseUrl)
  }
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
}

// Enhanced Supabase client with better configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // More secure auth flow
  },
  global: {
    headers: {
      'X-Client-Info': 'strong-strong-fitness@1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Enhanced error handling
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public isRetryable: boolean = true
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Connection health monitoring
export class SupabaseHealthMonitor {
  private static instance: SupabaseHealthMonitor
  private healthStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
  private lastHealthCheck: Date | null = null
  private healthListeners: Set<(status: string) => void> = new Set()

  static getInstance(): SupabaseHealthMonitor {
    if (!SupabaseHealthMonitor.instance) {
      SupabaseHealthMonitor.instance = new SupabaseHealthMonitor()
    }
    return SupabaseHealthMonitor.instance
  }

  async checkHealth(): Promise<boolean> {
    try {
      const startTime = performance.now()
      
      // Test basic connectivity
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const responseTime = performance.now() - startTime
      const isHealthy = response.ok && responseTime < 5000

      this.healthStatus = isHealthy ? 'healthy' : 'degraded'
      this.lastHealthCheck = new Date()
      
      console.log(`🏥 Supabase Health Check: ${this.healthStatus} (${Math.round(responseTime)}ms)`)
      
      this.notifyListeners(this.healthStatus)
      return isHealthy
      
    } catch (error: any) {
      console.error('🚨 Supabase Health Check Failed:', error.message)
      this.healthStatus = 'down'
      this.lastHealthCheck = new Date()
      this.notifyListeners(this.healthStatus)
      return false
    }
  }

  addHealthListener(callback: (status: string) => void): () => void {
    this.healthListeners.add(callback)
    return () => this.healthListeners.delete(callback)
  }

  private notifyListeners(status: string): void {
    this.healthListeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in health listener:', error)
      }
    })
  }

  getHealthStatus() {
    return {
      status: this.healthStatus,
      lastCheck: this.lastHealthCheck
    }
  }
}

// Enhanced query wrapper with retry logic and better error handling
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  context: string,
  maxRetries: number = 3
): Promise<{ data: T | null; error: SupabaseError | null }> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 ${context} (attempt ${attempt}/${maxRetries})`)
      
      const result = await queryFn()
      
      if (result.error) {
        const supabaseError = categorizeError(result.error, context)
        
        // Don't retry certain types of errors
        if (!supabaseError.isRetryable || attempt === maxRetries) {
          console.error(`❌ ${context} failed:`, supabaseError)
          return { data: null, error: supabaseError }
        }
        
        lastError = supabaseError
        console.warn(`⚠️ ${context} attempt ${attempt} failed, retrying...`, supabaseError.message)
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }
      
      console.log(`✅ ${context} successful`)
      return { data: result.data, error: null }
      
    } catch (error: any) {
      lastError = error
      console.error(`💥 ${context} attempt ${attempt} threw error:`, error)
      
      if (attempt === maxRetries) {
        break
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  const finalError = categorizeError(lastError, context)
  return { data: null, error: finalError }
}

// Enhanced error categorization
function categorizeError(error: any, context: string): SupabaseError {
  if (!error) {
    return new SupabaseError('Unknown error occurred', 'UNKNOWN_ERROR', { context })
  }

  // Network-related errors
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
      error.message?.includes('Network Error') ||
      error.name === 'TypeError') {
    return new SupabaseError(
      'Network connectivity issue. Please check your internet connection and Supabase project status.',
      'NETWORK_ERROR',
      { originalError: error.message, context },
      true // Retryable
    )
  }

  // Authentication errors
  if (error.message?.includes('JWT') || 
      error.message?.includes('invalid_grant') ||
      error.code === 'invalid_credentials') {
    return new SupabaseError(
      'Authentication failed. Please log in again.',
      'AUTH_ERROR',
      { originalError: error.message, context },
      false // Not retryable
    )
  }

  // Permission errors
  if (error.code === '42501' || error.message?.includes('permission denied')) {
    return new SupabaseError(
      'Permission denied. You may not have access to this resource.',
      'PERMISSION_ERROR',
      { originalError: error.message, context },
      false // Not retryable
    )
  }

  // Database constraint errors
  if (error.code === '23505') {
    return new SupabaseError(
      'Data already exists. Please check for duplicates.',
      'DUPLICATE_ERROR',
      { originalError: error.message, context },
      false // Not retryable
    )
  }

  // Foreign key violations
  if (error.code === '23503') {
    return new SupabaseError(
      'Related data not found. Please check your data relationships.',
      'FOREIGN_KEY_ERROR',
      { originalError: error.message, context },
      false // Not retryable
    )
  }

  // Server errors (potentially retryable)
  if (error.code?.startsWith('5') || error.message?.includes('500')) {
    return new SupabaseError(
      'Server error occurred. Please try again.',
      'SERVER_ERROR',
      { originalError: error.message, context },
      true // Retryable
    )
  }

  // Default case
  return new SupabaseError(
    error.message || 'An unexpected error occurred',
    error.code || 'UNKNOWN_ERROR',
    { originalError: error, context },
    false
  )
}

// Enhanced type definitions with better constraints
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
  route_type: 'running' | 'walking' | 'cycling' | 'trail-running' | 'hiking'
  created_by: string | null
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

// Enhanced database operations with proper error handling
export const database = {
  // Profiles
  async getProfile(userId: string) {
    return safeSupabaseQuery(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      `Get profile for user ${userId}`
    )
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    return safeSupabaseQuery(
      () => supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single(),
      `Update profile for user ${userId}`
    )
  },

  // Fitness Routes
  async getFitnessRoutes(limit?: number) {
    return safeSupabaseQuery(
      () => {
        let query = supabase
          .from('fitness_routes')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (limit) {
          query = query.limit(limit)
        }
        
        return query
      },
      'Get fitness routes'
    )
  },

  async getUserSavedRoutes(userId: string) {
    return safeSupabaseQuery(
      () => supabase
        .from('saved_routes')
        .select(`
          *,
          fitness_routes (*)
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false }),
      `Get saved routes for user ${userId}`
    )
  },

  async saveRoute(userId: string, routeId: string, status: 'to-do' | 'favorite' = 'to-do') {
    return safeSupabaseQuery(
      () => supabase
        .from('saved_routes')
        .upsert({
          user_id: userId,
          route_id: routeId,
          status
        })
        .select()
        .single(),
      `Save route ${routeId} for user ${userId}`
    )
  },

  async updateRouteStatus(savedRouteId: string, status: 'to-do' | 'completed' | 'favorite') {
    const updates: any = { status }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    return safeSupabaseQuery(
      () => supabase
        .from('saved_routes')
        .update(updates)
        .eq('id', savedRouteId)
        .select()
        .single(),
      `Update route status to ${status}`
    )
  },

  // Procrastination Routes
  async getUserProcrastinationRoutes(userId: string) {
    return safeSupabaseQuery(
      () => supabase
        .from('saved_procrastination_routes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      `Get procrastination routes for user ${userId}`
    )
  },

  async saveProcrastinationRoute(
    userId: string, 
    originalTask: string, 
    routeSteps: ProcrastinationStep[],
    title?: string
  ) {
    return safeSupabaseQuery(
      () => supabase
        .from('saved_procrastination_routes')
        .insert({
          user_id: userId,
          original_task: originalTask,
          route_steps: routeSteps,
          title
        })
        .select()
        .single(),
      `Save procrastination route for user ${userId}`
    )
  },

  async updateProcrastinationRoute(routeId: string, updates: Partial<SavedProcrastinationRoute>) {
    return safeSupabaseQuery(
      () => supabase
        .from('saved_procrastination_routes')
        .update(updates)
        .eq('id', routeId)
        .select()
        .single(),
      `Update procrastination route ${routeId}`
    )
  },

  async deleteProcrastinationRoute(routeId: string) {
    return safeSupabaseQuery(
      () => supabase
        .from('saved_procrastination_routes')
        .update({ is_active: false })
        .eq('id', routeId),
      `Delete procrastination route ${routeId}`
    )
  }
}

// Connection testing utilities
export async function testSupabaseConnection(): Promise<{
  success: boolean
  message: string
  details: any
}> {
  try {
    console.log('🧪 Testing Supabase connection...')
    
    // Test 1: Basic connectivity
    const healthMonitor = SupabaseHealthMonitor.getInstance()
    const isHealthy = await healthMonitor.checkHealth()
    
    if (!isHealthy) {
      return {
        success: false,
        message: 'Supabase health check failed',
        details: healthMonitor.getHealthStatus()
      }
    }

    // Test 2: Authentication service
    const { error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.warn('Auth service warning:', authError)
    }

    // Test 3: Database access
    const { error: dbError } = await supabase
      .from('fitness_routes')
      .select('id')
      .limit(1)
    
    if (dbError) {
      return {
        success: false,
        message: 'Database access failed',
        details: { dbError }
      }
    }

    return {
      success: true,
      message: 'All Supabase services are working correctly',
      details: { 
        health: healthMonitor.getHealthStatus(),
        timestamp: new Date().toISOString()
      }
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Connection test failed',
      details: { error: error.message }
    }
  }
}

// Initialize health monitoring
const healthMonitor = SupabaseHealthMonitor.getInstance()
healthMonitor.checkHealth() // Initial health check

// Log Supabase configuration on startup
console.log('🚀 Supabase Configuration:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length || 0,
  timestamp: new Date().toISOString()
})
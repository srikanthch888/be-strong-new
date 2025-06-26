import { supabase, supabaseErrorHandler } from '../lib/supabase'

export interface RestApiDiagnosticResult {
  endpoint: string
  status: 'success' | 'dns_error' | 'network_error' | 'permission_error' | 'server_error'
  message: string
  details: any
  timestamp: Date
}

export async function diagnoseRestApiEndpoint(
  table: string,
  query?: any
): Promise<RestApiDiagnosticResult> {
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}`
  const timestamp = new Date()
  
  console.log(`🔍 Diagnosing REST API endpoint: ${table}`)
  
  try {
    // Test basic table access
    let queryBuilder = supabase.from(table).select('id').limit(1)
    
    // Apply any additional query parameters if provided
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (key === 'order') {
          queryBuilder = queryBuilder.order(value as string)
        } else if (key === 'eq') {
          const [column, filterValue] = value as [string, any]
          queryBuilder = queryBuilder.eq(column, filterValue)
        }
        // Add more query types as needed
      }
    }
    
    const { data, error } = await queryBuilder
    
    if (error) {
      console.error(`❌ REST API error for ${table}:`, error)
      
      // Classify the error type
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        return {
          endpoint,
          status: 'dns_error',
          message: `DNS resolution failed for ${table} endpoint`,
          details: {
            error: error.message,
            code: error.code,
            hint: error.hint,
            possibleCauses: [
              'Supabase project is paused or deleted',
              'Incorrect project URL configuration',
              'DNS cache needs clearing',
              'Network firewall blocking Supabase domain'
            ]
          },
          timestamp
        }
      }
      
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        return {
          endpoint,
          status: 'permission_error',
          message: `Permission denied accessing ${table}`,
          details: {
            error: error.message,
            code: error.code,
            hint: error.hint,
            possibleCauses: [
              'Row Level Security (RLS) policy blocking access',
              'User not authenticated',
              'Insufficient permissions for this table'
            ]
          },
          timestamp
        }
      }
      
      if (error.code === 'PGRST116') {
        return {
          endpoint,
          status: 'server_error',
          message: `Table relationship error for ${table}`,
          details: {
            error: error.message,
            code: error.code,
            hint: error.hint,
            possibleCauses: [
              'Invalid foreign key relationship',
              'Missing table or column',
              'Database schema mismatch'
            ]
          },
          timestamp
        }
      }
      
      return {
        endpoint,
        status: 'server_error',
        message: `Database error accessing ${table}`,
        details: {
          error: error.message,
          code: error.code,
          hint: error.hint
        },
        timestamp
      }
    }
    
    console.log(`✅ Successfully accessed ${table} endpoint`)
    return {
      endpoint,
      status: 'success',
      message: `Successfully connected to ${table} endpoint`,
      details: {
        recordsFound: data?.length || 0,
        sampleData: data?.[0] || null
      },
      timestamp
    }
    
  } catch (error: any) {
    console.error(`💥 Unexpected error testing ${table} endpoint:`, error)
    
    const formattedError = supabaseErrorHandler.formatError(error)
    
    if (formattedError.type === 'network') {
      return {
        endpoint,
        status: 'network_error',
        message: `Network error accessing ${table} endpoint`,
        details: {
          error: error.message,
          type: formattedError.type,
          possibleCauses: [
            'No internet connection',
            'Firewall blocking requests',
            'Proxy configuration issues'
          ]
        },
        timestamp
      }
    }
    
    return {
      endpoint,
      status: 'server_error',
      message: `Unexpected error accessing ${table} endpoint`,
      details: {
        error: error.message,
        stack: error.stack
      },
      timestamp
    }
  }
}

export async function diagnoseAllFitnessEndpoints(): Promise<RestApiDiagnosticResult[]> {
  console.log('🔍 Running comprehensive REST API diagnostics...')
  
  const endpoints = [
    { table: 'fitness_routes' },
    { table: 'saved_routes' },
    { table: 'profiles' },
    { table: 'saved_procrastination_routes' }
  ]
  
  const results: RestApiDiagnosticResult[] = []
  
  for (const { table } of endpoints) {
    try {
      const result = await diagnoseRestApiEndpoint(table)
      results.push(result)
      
      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Failed to diagnose ${table}:`, error)
      results.push({
        endpoint: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}`,
        status: 'server_error',
        message: `Failed to test ${table} endpoint`,
        details: { error: error.message },
        timestamp: new Date()
      })
    }
  }
  
  return results
}

export function formatDiagnosticReport(results: RestApiDiagnosticResult[]): string {
  const successful = results.filter(r => r.status === 'success').length
  const total = results.length
  
  let report = `REST API Diagnostic Report\n`
  report += `Generated: ${new Date().toLocaleString()}\n`
  report += `Success Rate: ${successful}/${total} endpoints\n\n`
  
  results.forEach(result => {
    const status = result.status === 'success' ? '✅' : '❌'
    report += `${status} ${result.endpoint}\n`
    report += `   Status: ${result.status}\n`
    report += `   Message: ${result.message}\n`
    
    if (result.status !== 'success' && result.details.possibleCauses) {
      report += `   Possible causes:\n`
      result.details.possibleCauses.forEach((cause: string) => {
        report += `   • ${cause}\n`
      })
    }
    report += `\n`
  })
  
  return report
}

// Utility function to test specific fitness routes queries
export async function testFitnessRoutesQueries(): Promise<{
  basicSelect: RestApiDiagnosticResult
  withOrder: RestApiDiagnosticResult
  withFilter: RestApiDiagnosticResult
}> {
  console.log('🔍 Testing specific fitness routes queries...')
  
  const basicSelect = await diagnoseRestApiEndpoint('fitness_routes')
  
  const withOrder = await diagnoseRestApiEndpoint('fitness_routes', {
    order: 'created_at.desc'
  })
  
  const withFilter = await diagnoseRestApiEndpoint('fitness_routes', {
    eq: ['difficulty_level', 'beginner']
  })
  
  return {
    basicSelect,
    withOrder,
    withFilter
  }
}
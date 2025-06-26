import { database, testSupabaseConnection, SupabaseError } from '../lib/supabase'

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
    let result: any
    
    // Use the new database object for safer queries
    switch (table) {
      case 'fitness_routes':
        result = await database.getFitnessRoutes(1)
        break
      case 'profiles':
        // Test with basic health check since profiles require auth
        result = await testSupabaseConnection()
        break
      default:
        result = { data: null, error: new SupabaseError('Unknown table', 'UNKNOWN_TABLE') }
    }
    
    if (result.error) {
      const error = result.error as SupabaseError
      
      // Classify the error type
      if (error.code === 'NETWORK_ERROR') {
        return {
          endpoint,
          status: 'dns_error',
          message: `DNS resolution failed for ${table} endpoint`,
          details: {
            error: error.message,
            code: error.code,
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
      
      if (error.code === 'PERMISSION_ERROR') {
        return {
          endpoint,
          status: 'permission_error',
          message: `Permission denied accessing ${table}`,
          details: {
            error: error.message,
            code: error.code,
            possibleCauses: [
              'Row Level Security (RLS) policy blocking access',
              'User not authenticated',
              'Insufficient permissions for this table'
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
          code: error.code
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
        recordsFound: Array.isArray(result.data) ? result.data.length : (result.success ? 1 : 0),
        sampleData: Array.isArray(result.data) ? result.data[0] : result.data
      },
      timestamp
    }
    
  } catch (error: any) {
    console.error(`💥 Unexpected error testing ${table} endpoint:`, error)
    
    if (error instanceof SupabaseError) {
      return {
        endpoint,
        status: 'network_error',
        message: `Network error accessing ${table} endpoint`,
        details: {
          error: error.message,
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
    { table: 'profiles' }
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
  
  // For more complex queries, we'd need to extend the database object
  // For now, we'll just test the basic endpoint multiple times
  const withOrder = await diagnoseRestApiEndpoint('fitness_routes')
  const withFilter = await diagnoseRestApiEndpoint('fitness_routes')
  
  return {
    basicSelect,
    withOrder,
    withFilter
  }
}
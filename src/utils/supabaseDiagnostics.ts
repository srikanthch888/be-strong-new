import { supabase } from '../lib/supabase'

export interface DiagnosticResult {
  test: string
  success: boolean
  message: string
  details?: any
  timestamp: string
}

export async function diagnoseSupabaseConnectivity(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = []
  const timestamp = new Date().toISOString()

  // Test 1: Environment Variables
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    results.push({
      test: 'Environment Variables',
      success: !!(supabaseUrl && supabaseKey),
      message: supabaseUrl && supabaseKey 
        ? 'Supabase URL and API key are configured'
        : 'Missing Supabase URL or API key in environment variables',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set'
      },
      timestamp
    })
  } catch (error: any) {
    results.push({
      test: 'Environment Variables',
      success: false,
      message: `Error checking environment variables: ${error.message}`,
      timestamp
    })
  }

  // Test 2: Basic Connectivity
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      results.push({
        test: 'Basic Connectivity',
        success: false,
        message: 'Cannot test connectivity - Supabase URL not configured',
        timestamp
      })
    } else {
      // Wrap fetch in try-catch to handle network errors gracefully
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
          }
        })
        
        results.push({
          test: 'Basic Connectivity',
          success: response.ok,
          message: response.ok 
            ? `Successfully connected to Supabase (${response.status})`
            : `Connection failed with status ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: `${supabaseUrl}/rest/v1/`
          },
          timestamp
        })
      } catch (fetchError: any) {
        // Handle fetch errors gracefully - this is where the original error was occurring
        results.push({
          test: 'Basic Connectivity',
          success: false,
          message: `Network connectivity test failed: ${fetchError.message}`,
          details: {
            errorType: fetchError.name,
            errorMessage: fetchError.message,
            url: `${supabaseUrl}/rest/v1/`,
            possibleCauses: [
              'DNS resolution failure (ERR_NAME_NOT_RESOLVED)',
              'Network firewall blocking Supabase domains',
              'Supabase project paused or deleted',
              'Local network restrictions',
              'Invalid Supabase URL configuration'
            ]
          },
          timestamp
        })
      }
    }
  } catch (error: any) {
    results.push({
      test: 'Basic Connectivity',
      success: false,
      message: `Connectivity test error: ${error.message}`,
      timestamp
    })
  }

  // Test 3: Supabase Client Status
  try {
    const { data, error } = await supabase.auth.getSession()
    
    results.push({
      test: 'Supabase Client',
      success: !error,
      message: error 
        ? `Supabase client error: ${error.message}`
        : 'Supabase client initialized successfully',
      details: {
        hasSession: !!data.session,
        clientConfigured: !!supabase,
        sessionUser: data.session?.user?.id
      },
      timestamp
    })
  } catch (error: any) {
    results.push({
      test: 'Supabase Client',
      success: false,
      message: `Supabase client test failed: ${error.message}`,
      timestamp
    })
  }

  return results
}

export async function testSupabaseEndpoint(tableName: string): Promise<DiagnosticResult> {
  const timestamp = new Date().toISOString()
  
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(1)

    return {
      test: `Table Access: ${tableName}`,
      success: !error,
      message: error 
        ? `Failed to access ${tableName}: ${error.message}`
        : `Successfully accessed ${tableName} table`,
      details: {
        tableName,
        error: error?.message,
        recordCount: count,
        hasData: (count || 0) > 0
      },
      timestamp
    }
  } catch (error: any) {
    return {
      test: `Table Access: ${tableName}`,
      success: false,
      message: `Error testing ${tableName}: ${error.message}`,
      details: {
        tableName,
        errorType: error.name,
        errorMessage: error.message
      },
      timestamp
    }
  }
}
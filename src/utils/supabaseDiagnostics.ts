import { supabase, testSupabaseConnection, SupabaseHealthMonitor } from '../lib/supabase'

export interface DiagnosticResult {
  test: string
  success: boolean
  message: string
  details?: any
  timestamp: string
  duration?: number
}

export async function diagnoseSupabaseConnectivity(): Promise<{
  status: 'success' | 'warning' | 'error'
  message: string
  results: DiagnosticResult[]
  solutions?: string[]
}> {
  const results: DiagnosticResult[] = []
  const startTime = Date.now()

  console.log('🔍 Starting comprehensive Supabase diagnostics...')

  // Test 1: Environment Variables
  const envTest = await testEnvironmentVariables()
  results.push(envTest)

  // Test 2: URL Format and Accessibility
  const urlTest = await testUrlAccessibility()
  results.push(urlTest)

  // Test 3: DNS Resolution
  const dnsTest = await testDnsResolution()
  results.push(dnsTest)

  // Test 4: Basic HTTP Connectivity
  const httpTest = await testHttpConnectivity()
  results.push(httpTest)

  // Test 5: Supabase Client Initialization
  const clientTest = await testSupabaseClient()
  results.push(clientTest)

  // Test 6: Authentication Service
  const authTest = await testAuthService()
  results.push(authTest)

  // Test 7: Database Access
  const dbTest = await testDatabaseAccess()
  results.push(dbTest)

  // Test 8: Real-time Connection
  const realtimeTest = await testRealtimeConnection()
  results.push(realtimeTest)

  // Analyze results
  const failed = results.filter(r => !r.success)
  const warnings = results.filter(r => r.success && r.message.includes('warning'))

  let status: 'success' | 'warning' | 'error'
  let message: string
  const solutions: string[] = []

  if (failed.length === 0) {
    status = warnings.length > 0 ? 'warning' : 'success'
    message = warnings.length > 0 
      ? 'Connection successful with minor issues' 
      : 'All Supabase services are working correctly'
  } else {
    status = 'error'
    message = `${failed.length} critical issues found`
    
    // Generate solutions based on failed tests
    failed.forEach(test => {
      solutions.push(...generateSolutions(test))
    })
  }

  const totalDuration = Date.now() - startTime
  console.log(`🏁 Diagnostics completed in ${totalDuration}ms`)

  return {
    status,
    message,
    results,
    solutions: solutions.length > 0 ? [...new Set(solutions)] : undefined
  }
}

async function testEnvironmentVariables(): Promise<DiagnosticResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const hasUrl = !!supabaseUrl
    const hasKey = !!supabaseKey
    const success = hasUrl && hasKey

    let message = 'Environment variables configured correctly'
    const details: any = {
      hasUrl,
      hasKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    }

    if (!hasUrl) {
      message = 'VITE_SUPABASE_URL is missing from environment variables'
    } else if (!hasKey) {
      message = 'VITE_SUPABASE_ANON_KEY is missing from environment variables'
    } else {
      // Validate URL format
      try {
        const url = new URL(supabaseUrl)
        details.urlDomain = url.hostname
        details.urlProtocol = url.protocol
        
        if (!url.hostname.includes('supabase.co')) {
          message += ' (warning: unusual domain format)'
          details.warning = 'URL does not contain supabase.co domain'
        }
      } catch (error) {
        message = 'VITE_SUPABASE_URL has invalid format'
        details.urlError = error.message
        return {
          test: 'Environment Variables',
          success: false,
          message,
          details,
          timestamp,
          duration: Date.now() - startTime
        }
      }
    }

    return {
      test: 'Environment Variables',
      success,
      message,
      details,
      timestamp,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      test: 'Environment Variables',
      success: false,
      message: `Error checking environment: ${error.message}`,
      details: { error: error.message },
      timestamp,
      duration: Date.now() - startTime
    }
  }
}

async function testUrlAccessibility(): Promise<DiagnosticResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    if (!supabaseUrl) {
      return {
        test: 'URL Accessibility',
        success: false,
        message: 'Cannot test URL accessibility - URL not configured',
        timestamp,
        duration: Date.now() - startTime
      }
    }

    // Test if URL is reachable
    const testUrl = `${supabaseUrl}/rest/v1/`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      })

      clearTimeout(timeoutId)

      return {
        test: 'URL Accessibility',
        success: response.ok,
        message: response.ok 
          ? `URL is accessible (HTTP ${response.status})`
          : `URL returned HTTP ${response.status}: ${response.statusText}`,
        details: {
          url: testUrl,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        },
        timestamp,
        duration: Date.now() - startTime
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      return {
        test: 'URL Accessibility',
        success: false,
        message: `URL is not accessible: ${fetchError.message}`,
        details: {
          url: testUrl,
          error: fetchError.message,
          errorType: fetchError.name
        },
        timestamp,
        duration: Date.now() - startTime
      }
    }
  } catch (error: any) {
    return {
      test: 'URL Accessibility',
      success: false,
      message: `URL accessibility test failed: ${error.message}`,
      details: { error: error.message },
      timestamp,
      duration: Date.now() - startTime
    }
  }
}

async function testDnsResolution(): Promise<DiagnosticResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    if (!supabaseUrl) {
      return {
        test: 'DNS Resolution',
        success: false,
        message: 'Cannot test DNS - URL not configured',
        timestamp,
        duration: Date.now() - startTime
      }
    }

    const hostname = new URL(supabaseUrl).hostname

    // Use a simple DNS-over-HTTPS query to test resolution
    try {
      const dnsResponse = await fetch(`https://1.1.1.1/dns-query?name=${hostname}&type=A`, {
        headers: { 'Accept': 'application/dns-json' },
        signal: AbortSignal.timeout(5000)
      })

      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json()
        const hasAnswers = dnsData.Answer && dnsData.Answer.length > 0

        return {
          test: 'DNS Resolution',
          success: hasAnswers,
          message: hasAnswers 
            ? `DNS resolves correctly for ${hostname}`
            : `DNS resolution failed for ${hostname}`,
          details: {
            hostname,
            dnsData,
            resolvedIPs: hasAnswers ? dnsData.Answer.map((a: any) => a.data) : []
          },
          timestamp,
          duration: Date.now() - startTime
        }
      }
    } catch (dnsError) {
      // Fallback: try a simple fetch to test if DNS works
      try {
        await fetch(`https://${hostname}`, { 
          method: 'HEAD', 
          signal: AbortSignal.timeout(5000) 
        })
        
        return {
          test: 'DNS Resolution',
          success: true,
          message: `DNS resolution working (verified via fetch)`,
          details: { hostname, method: 'fallback' },
          timestamp,
          duration: Date.now() - startTime
        }
      } catch (fallbackError: any) {
        return {
          test: 'DNS Resolution',
          success: false,
          message: `DNS resolution failed: ${fallbackError.message}`,
          details: { 
            hostname, 
            error: fallbackError.message,
            errorType: fallbackError.name
          },
          timestamp,
          duration: Date.now() - startTime
        }
      }
    }

    return {
      test: 'DNS Resolution',
      success: false,
      message: 'DNS test inconclusive',
      details: { hostname },
      timestamp,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      test: 'DNS Resolution',
      success: false,
      message: `DNS test error: ${error.message}`,
      details: { error: error.message },
      timestamp,
      duration: Date.now() - startTime
    }
  }
}

async function testHttpConnectivity(): Promise<DiagnosticResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        test: 'HTTP Connectivity',
        success: false,
        message: 'Cannot test HTTP connectivity - missing configuration',
        timestamp,
        duration: Date.now() - startTime
      }
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      signal: AbortSignal.timeout(15000)
    })

    const success = response.ok
    const responseText = await response.text().catch(() => 'Could not read response')

    return {
      test: 'HTTP Connectivity',
      success,
      message: success 
        ? 'HTTP connectivity working correctly'
        : `HTTP request failed with status ${response.status}`,
      details: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responsePreview: responseText.substring(0, 200)
      },
      timestamp,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      test: 'HTTP Connectivity',
      success: false,
      message: `HTTP connectivity failed: ${error.message}`,
      details: {
        error: error.message,
        errorType: error.name
      },
      timestamp,
      duration: Date.now() - startTime
    }
  }
}

async function testSupabaseClient(): Promise<DiagnosticResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    // Test if client is properly initialized
    const isInitialized = !!supabase
    
    if (!isInitialized) {
      return {
        test: 'Supabase Client',
        success: false,
        message: 'Supabase client is not initialized',
        timestamp,
        duration: Date.now() - startTime
      }
    }

    // Test health check
    const healthTest = await testSupabaseConnection()

    return {
      test: 'Supabase Client',
      success: healthTest.success,
      message: healthTest.message,
      details: healthTest.details,
      timestamp,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      test: 'Supabase Client',
      success: false,
      message: `Client test failed: ${error.message}`,
      details: { error: error.message },
      timestamp,
      duration: Date.now() - startTime
    }
  }
}

async function testAuthService(): Promise<DiagnosticResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return {
        test: 'Authentication Service',
        success: false,
        message: `Auth service error: ${error.message}`,
        details: { error },
        timestamp,
        duration: Date.now() - startTime
      }
    }

    return {
      test: 'Authentication Service',
      success: true,
      message: 'Authentication service is working',
      details: {
        hasSession: !!data.session,
        sessionExpiry: data.session?.expires_at,
        userId: data.session?.user?.id
      },
      timestamp,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      test: 'Authentication Service',
      success: false,
      message: `Auth service test failed: ${error.message}`,
      details: { error: error.message },
      timestamp,
      duration: Date.now() - startTime
    }
  }
}

async function testDatabaseAccess(): Promise<DiagnosticResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const { data, error } = await supabase
      .from('fitness_routes')
      .select('id')
      .limit(1)

    if (error) {
      return {
        test: 'Database Access',
        success: false,
        message: `Database access failed: ${error.message}`,
        details: { 
          error,
          errorCode: error.code,
          errorHint: error.hint
        },
        timestamp,
        duration: Date.now() - startTime
      }
    }

    return {
      test: 'Database Access',
      success: true,
      message: 'Database access is working',
      details: {
        recordsFound: data?.length || 0,
        tableTested: 'fitness_routes'
      },
      timestamp,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      test: 'Database Access',
      success: false,
      message: `Database test failed: ${error.message}`,
      details: { error: error.message },
      timestamp,
      duration: Date.now() - startTime
    }
  }
}

async function testRealtimeConnection(): Promise<DiagnosticResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    // Test realtime by subscribing briefly
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {})

    const subscribePromise = new Promise<boolean>((resolve) => {
      channel
        .subscribe((status) => {
          resolve(status === 'SUBSCRIBED')
        })
    })

    // Wait up to 5 seconds for subscription
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 5000)
    })

    const subscribed = await Promise.race([subscribePromise, timeoutPromise])
    
    // Clean up
    supabase.removeChannel(channel)

    return {
      test: 'Realtime Connection',
      success: subscribed,
      message: subscribed 
        ? 'Realtime connection is working'
        : 'Realtime connection failed or timed out',
      details: {
        subscriptionStatus: subscribed ? 'SUBSCRIBED' : 'FAILED'
      },
      timestamp,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      test: 'Realtime Connection',
      success: false,
      message: `Realtime test failed: ${error.message}`,
      details: { error: error.message },
      timestamp,
      duration: Date.now() - startTime
    }
  }
}

function generateSolutions(failedTest: DiagnosticResult): string[] {
  const solutions: string[] = []

  switch (failedTest.test) {
    case 'Environment Variables':
      solutions.push('Check your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
      solutions.push('Restart your development server after updating .env')
      solutions.push('Verify environment variables match your Supabase project settings')
      break

    case 'URL Accessibility':
    case 'DNS Resolution':
      solutions.push('Check your Supabase project status in the dashboard')
      solutions.push('Verify the project URL is correct and not paused/deleted')
      solutions.push('Clear DNS cache: ipconfig /flushdns (Windows) or sudo dscacheutil -flushcache (Mac)')
      solutions.push('Try accessing the URL directly in your browser')
      solutions.push('Check if your network firewall is blocking Supabase domains')
      break

    case 'HTTP Connectivity':
      solutions.push('Check your internet connection')
      solutions.push('Verify Supabase API key is correct and not expired')
      solutions.push('Try using a different network (mobile hotspot)')
      solutions.push('Check if corporate firewall is blocking the requests')
      break

    case 'Database Access':
      if (failedTest.details?.error?.code === '42501') {
        solutions.push('Check Row Level Security (RLS) policies on your tables')
        solutions.push('Ensure user has proper permissions to access the data')
        solutions.push('Verify authentication is working correctly')
      } else {
        solutions.push('Check your database schema and table names')
        solutions.push('Verify database migrations have been applied')
        solutions.push('Check Supabase logs for detailed error information')
      }
      break

    case 'Realtime Connection':
      solutions.push('Check if Realtime is enabled in your Supabase project')
      solutions.push('Verify your subscription channel configuration')
      solutions.push('Check network connectivity for WebSocket connections')
      break

    default:
      solutions.push('Contact Supabase support with error details')
      solutions.push('Check Supabase status page for service outages')
  }

  return solutions
}

// Export for use in components
export { SupabaseHealthMonitor }
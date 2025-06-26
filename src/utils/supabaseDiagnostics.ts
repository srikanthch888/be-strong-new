export async function diagnoseSupabaseConnectivity(): Promise<{
  status: 'success' | 'dns_error' | 'network_error' | 'config_error'
  message: string
  details: any
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('🔍 Starting Supabase connectivity diagnosis...')
  
  // Check 1: Environment configuration
  if (!supabaseUrl || !supabaseKey) {
    return {
      status: 'config_error',
      message: 'Missing Supabase environment variables',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlValue: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : null
      }
    }
  }
  
  // Check 2: URL format validation
  try {
    const url = new URL(supabaseUrl)
    if (!url.hostname.includes('supabase.co')) {
      return {
        status: 'config_error',
        message: 'Invalid Supabase URL format',
        details: { hostname: url.hostname }
      }
    }
  } catch (error) {
    return {
      status: 'config_error',
      message: 'Malformed Supabase URL',
      details: { url: supabaseUrl, error: error.message }
    }
  }
  
  // Check 3: Network connectivity
  if (!navigator.onLine) {
    return {
      status: 'network_error',
      message: 'No internet connection',
      details: { navigator_online: false }
    }
  }
  
  // Check 4: DNS resolution test
  try {
    console.log('Testing DNS resolution for:', supabaseUrl)
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(supabaseUrl, {
      method: 'HEAD',
      signal: controller.signal
    })
    
    clearTimeout(timeout)
    
    console.log('✅ DNS resolution successful:', response.status)
    
    return {
      status: 'success',
      message: 'Supabase connectivity confirmed',
      details: {
        status: response.status,
        url: supabaseUrl,
        timestamp: new Date().toISOString()
      }
    }
    
  } catch (error: any) {
    console.error('❌ Connectivity test failed:', error)
    
    if (error.name === 'AbortError') {
      return {
        status: 'network_error',
        message: 'Connection timeout',
        details: { error: 'Request timed out after 10 seconds' }
      }
    }
    
    if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      return {
        status: 'dns_error',
        message: 'DNS resolution failed - cannot find Supabase server',
        details: {
          error: error.message,
          possibleCauses: [
            'Supabase project is paused or deleted',
            'Incorrect project URL in environment variables',
            'DNS cache needs clearing',
            'Network firewall blocking supabase.co domain',
            'ISP DNS issues'
          ],
          solutions: [
            'Check Supabase dashboard project status',
            'Verify VITE_SUPABASE_URL in .env file',
            'Clear DNS cache and restart browser',
            'Try different network (mobile hotspot)',
            'Contact network administrator if on corporate network'
          ]
        }
      }
    }
    
    if (error.message.includes('Failed to fetch')) {
      return {
        status: 'network_error',
        message: 'Network request failed',
        details: {
          error: error.message,
          possibleCauses: [
            'Firewall blocking requests',
            'Proxy configuration issues',
            'Antivirus software interference',
            'Network connectivity problems'
          ]
        }
      }
    }
    
    return {
      status: 'network_error',
      message: 'Unknown connectivity error',
      details: { error: error.message }
    }
  }
}

export async function validateSupabaseProject(): Promise<{
  valid: boolean
  message: string
  suggestions: string[]
}> {
  try {
    const diagnosis = await diagnoseSupabaseConnectivity()
    
    if (diagnosis.status === 'success') {
      return {
        valid: true,
        message: 'Supabase project is accessible',
        suggestions: []
      }
    }
    
    const suggestions: string[] = []
    
    switch (diagnosis.status) {
      case 'dns_error':
        suggestions.push(
          'Check your Supabase project dashboard',
          'Verify the project URL in your .env file',
          'Clear your DNS cache',
          'Try accessing from a different network'
        )
        break
      case 'network_error':
        suggestions.push(
          'Check your internet connection',
          'Disable firewall/antivirus temporarily',
          'Try using a VPN or different DNS servers',
          'Contact your network administrator'
        )
        break
      case 'config_error':
        suggestions.push(
          'Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
          'Ensure the URL format is correct: https://[project-id].supabase.co',
          'Restart your development server after updating .env'
        )
        break
    }
    
    return {
      valid: false,
      message: diagnosis.message,
      suggestions
    }
  } catch (error: any) {
    return {
      valid: false,
      message: 'Failed to validate Supabase project',
      suggestions: ['Check console for detailed error information']
    }
  }
}
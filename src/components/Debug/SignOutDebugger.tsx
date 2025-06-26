import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { AlertCircle, CheckCircle, Info, RefreshCw, Clock, Wifi, Database, Shield, Trash2 } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'pass' | 'fail' | 'warning' | 'info'
  message: string
  data?: any
  timestamp: string
  duration?: number
}

export function SignOutDebugger() {
  const { user, session, profile, signOut, signOutLoading, lastSignOutAttempt } = useAuth()
  const [debugResults, setDebugResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')

  useEffect(() => {
    // Monitor network status
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline')
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    updateNetworkStatus()

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
  }, [])

  const addDebugResult = (test: string, status: DiagnosticResult['status'], message: string, data?: any, duration?: number) => {
    setDebugResults(prev => [...prev, { 
      test, 
      status, 
      message, 
      data, 
      timestamp: new Date().toISOString(),
      duration 
    }])
  }

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true)
    setDebugResults([])

    // Test 1: System Environment Check
    const envStartTime = Date.now()
    addDebugResult('Environment Check', 'info', 'Checking system environment...', {
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
    }, Date.now() - envStartTime)

    // Test 2: Current Auth State Analysis
    const authStartTime = Date.now()
    addDebugResult('Auth State Analysis', 'info', 'Analyzing current authentication state...', {
      hasUser: !!user,
      hasSession: !!session,
      hasProfile: !!profile,
      userId: user?.id,
      userEmail: user?.email,
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
    }, Date.now() - authStartTime)

    // Test 3: Supabase Connection Test
    const connectionStartTime = Date.now()
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      if (error) {
        addDebugResult('Supabase Connection', 'fail', `Connection error: ${error.message}`, error, Date.now() - connectionStartTime)
      } else {
        addDebugResult('Supabase Connection', 'pass', 'Successfully connected to Supabase', {
          hasSession: !!currentSession,
          sessionValid: currentSession ? Date.now() < (currentSession.expires_at * 1000) : false,
          sessionId: currentSession?.access_token?.slice(0, 20) + '...' || 'None'
        }, Date.now() - connectionStartTime)
      }
    } catch (error: any) {
      addDebugResult('Supabase Connection', 'fail', `Connection failed: ${error.message}`, error, Date.now() - connectionStartTime)
    }

    // Test 4: Network Performance Test
    const networkStartTime = Date.now()
    try {
      const testStart = performance.now()
      const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      })
      const testEnd = performance.now()
      
      if (response.ok) {
        addDebugResult('Network Performance', 'pass', `Network latency: ${Math.round(testEnd - testStart)}ms`, {
          latency: Math.round(testEnd - testStart),
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }, Date.now() - networkStartTime)
      } else {
        addDebugResult('Network Performance', 'warning', `API responded with status ${response.status}`, {
          status: response.status,
          statusText: response.statusText
        }, Date.now() - networkStartTime)
      }
    } catch (error: any) {
      addDebugResult('Network Performance', 'fail', `Network test failed: ${error.message}`, error, Date.now() - networkStartTime)
    }

    // Test 5: Storage Analysis
    const storageStartTime = Date.now()
    const allStorageKeys = Object.keys(localStorage)
    const authKeys = allStorageKeys.filter(key => 
      key.includes('supabase') || key.includes('auth') || key.includes('sb-')
    )
    
    const storageData: any = {}
    authKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        storageData[key] = {
          length: value?.length || 0,
          preview: value?.slice(0, 100) + '...' || 'empty',
          isJSON: (() => {
            try {
              JSON.parse(value || '')
              return true
            } catch {
              return false
            }
          })()
        }
      } catch (error) {
        storageData[key] = { error: 'Could not read' }
      }
    })

    addDebugResult('Storage Analysis', authKeys.length > 0 ? 'info' : 'warning', 
      `Found ${authKeys.length} auth-related storage keys`, {
        totalKeys: allStorageKeys.length,
        authKeys: authKeys.length,
        storageData
      }, Date.now() - storageStartTime)

    // Test 6: Sign-out API Endpoint Test
    if (user) {
      const signOutTestStart = Date.now()
      try {
        addDebugResult('Sign-out API Test', 'info', 'Testing sign-out endpoint response...', {
          startTime: new Date().toISOString()
        })

        // Test the sign-out endpoint directly
        const apiTest = await fetch(import.meta.env.VITE_SUPABASE_URL + '/auth/v1/logout', {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        })

        if (apiTest.ok) {
          addDebugResult('Sign-out API Test', 'pass', 'Sign-out endpoint is responding correctly', {
            status: apiTest.status,
            responseTime: Date.now() - signOutTestStart
          }, Date.now() - signOutTestStart)
        } else {
          addDebugResult('Sign-out API Test', 'warning', `API returned status ${apiTest.status}`, {
            status: apiTest.status,
            statusText: apiTest.statusText
          }, Date.now() - signOutTestStart)
        }
      } catch (error: any) {
        addDebugResult('Sign-out API Test', 'fail', `API test failed: ${error.message}`, error, Date.now() - signOutTestStart)
      }
    } else {
      addDebugResult('Sign-out API Test', 'info', 'Skipped - no user logged in')
    }

    // Test 7: Previous Sign-out Attempt Analysis
    if (lastSignOutAttempt) {
      addDebugResult('Previous Attempt Analysis', 
        lastSignOutAttempt.success ? 'pass' : 'fail', 
        `Last attempt ${lastSignOutAttempt.success ? 'succeeded' : 'failed'} at ${lastSignOutAttempt.stage} stage`, 
        lastSignOutAttempt
      )
    } else {
      addDebugResult('Previous Attempt Analysis', 'info', 'No previous sign-out attempts recorded')
    }

    setIsRunning(false)
  }

  const performActualSignOut = async () => {
    if (!user) {
      addDebugResult('Sign-out Test', 'warning', 'Cannot test sign-out - no user logged in')
      return
    }

    setIsRunning(true)
    addDebugResult('Live Sign-out Test', 'info', 'Performing actual sign-out test...')

    try {
      const result = await signOut()
      
      if (result.success) {
        addDebugResult('Live Sign-out Test', 'pass', 'Sign-out completed successfully', result)
      } else {
        addDebugResult('Live Sign-out Test', 'fail', `Sign-out failed: ${result.error}`, result)
      }

      // Check post-sign-out state
      setTimeout(() => {
        addDebugResult('Post Sign-out Verification', 'info', 'Verifying state after sign-out', {
          hasUser: !!user,
          hasSession: !!session,
          hasProfile: !!profile,
          remainingStorageKeys: Object.keys(localStorage).filter(key => 
            key.includes('supabase') || key.includes('auth')
          )
        })
      }, 1000)

    } catch (error: any) {
      addDebugResult('Live Sign-out Test', 'fail', `Sign-out threw error: ${error.message}`, error)
    } finally {
      setIsRunning(false)
    }
  }

  const clearAllAuthStorage = () => {
    const clearedKeys: string[] = []
    const failedKeys: string[] = []

    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
        try {
          localStorage.removeItem(key)
          clearedKeys.push(key)
        } catch (error) {
          failedKeys.push(key)
        }
      }
    })

    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
        try {
          sessionStorage.removeItem(key)
          clearedKeys.push(`session:${key}`)
        } catch (error) {
          failedKeys.push(`session:${key}`)
        }
      }
    })

    addDebugResult('Manual Storage Cleanup', 
      failedKeys.length === 0 ? 'pass' : 'warning',
      `Cleared ${clearedKeys.length} keys, failed ${failedKeys.length}`, {
        clearedKeys,
        failedKeys
      })
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'fail': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default: return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusBg = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200'
      case 'fail': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Sign-Out Diagnostic Center</h2>
        </div>
        
        {/* System Status Bar */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold mb-3 flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>System Status</span>
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className={`p-3 rounded-lg ${networkStatus === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4" />
                <span>Network: {networkStatus}</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${user ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>User: {user ? 'Logged in' : 'Not logged in'}</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${session ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Session: {session ? 'Active' : 'None'}</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${signOutLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              <div className="flex items-center space-x-2">
                <RefreshCw className={`w-4 h-4 ${signOutLoading ? 'animate-spin' : ''}`} />
                <span>Status: {signOutLoading ? 'Processing' : 'Ready'}</span>
              </div>
            </div>
          </div>
          
          {user && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs">
              <strong>User Details:</strong><br />
              ID: {user.id}<br />
              Email: {user.email}<br />
              Session Expires: {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown'}
            </div>
          )}
        </div>

        {/* Previous Attempt Summary */}
        {lastSignOutAttempt && (
          <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-gray-300">
            <h3 className="font-semibold mb-2">Last Sign-Out Attempt</h3>
            <div className={`p-3 rounded-lg ${lastSignOutAttempt.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-center justify-between">
                <span>
                  {lastSignOutAttempt.success ? '✅ Success' : '❌ Failed'} at {lastSignOutAttempt.stage} stage
                </span>
                <span className="text-xs">
                  {new Date(lastSignOutAttempt.timestamp).toLocaleString()}
                </span>
              </div>
              {lastSignOutAttempt.error && (
                <div className="mt-2 text-sm">Error: {lastSignOutAttempt.error}</div>
              )}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={runComprehensiveDiagnostics}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Diagnostics...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Run Full Diagnostics</span>
              </>
            )}
          </button>
          
          {user && (
            <button
              onClick={performActualSignOut}
              disabled={isRunning || signOutLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {signOutLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing Out...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Test Actual Sign-Out</span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={clearAllAuthStorage}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Auth Storage</span>
          </button>
          
          <button
            onClick={() => setDebugResults([])}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Clear Results
          </button>
        </div>

        {/* Debug Results */}
        {debugResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Diagnostic Results ({debugResults.length})</span>
            </h3>
            
            <div className="grid gap-3">
              {debugResults.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusBg(result.status)}`}>
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.test}</h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {result.duration && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{result.duration}ms</span>
                            </span>
                          )}
                          <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-sm mt-1">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                            View Technical Details
                          </summary>
                          <pre className="text-xs bg-white p-3 rounded border mt-2 overflow-auto max-h-48">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Troubleshooting Guide */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold mb-3">Common Issues & Solutions</h3>
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-white rounded border-l-4 border-red-400">
              <strong>Issue:</strong> Sign-out timeout errors<br />
              <strong>Solution:</strong> Check network connection and Supabase service status. The enhanced sign-out now includes timeout protection.
            </div>
            <div className="p-3 bg-white rounded border-l-4 border-yellow-400">
              <strong>Issue:</strong> User appears signed out but session persists<br />
              <strong>Solution:</strong> Run storage cleanup and verify auth state listeners are working properly.
            </div>
            <div className="p-3 bg-white rounded border-l-4 border-blue-400">
              <strong>Issue:</strong> Network errors during sign-out<br />
              <strong>Solution:</strong> The system now performs emergency local cleanup even if the API call fails.
            </div>
            <div className="p-3 bg-white rounded border-l-4 border-green-400">
              <strong>Issue:</strong> Components not updating after sign-out<br />
              <strong>Solution:</strong> Verify all components are using the useAuth hook and re-rendering on auth state changes.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
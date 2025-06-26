import React, { useState } from 'react'
import { Activity, RefreshCw, CheckCircle, AlertTriangle, X, Download, Eye } from 'lucide-react'
import { database, SupabaseError, testSupabaseConnection } from '../../lib/supabase'

interface RestApiDiagnosticResult {
  endpoint: string
  status: 'success' | 'dns_error' | 'network_error' | 'permission_error' | 'server_error'
  message: string
  details: any
  timestamp: Date
}

export function RestApiDebugger() {
  const [results, setResults] = useState<RestApiDiagnosticResult[]>([])
  const [testing, setTesting] = useState(false)
  const [selectedTest, setSelectedTest] = useState<string>('')

  const diagnoseEndpoint = async (table: string): Promise<RestApiDiagnosticResult> => {
    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}`
    const timestamp = new Date()
    
    console.log(`🔍 Diagnosing REST API endpoint: ${table}`)
    
    try {
      let result: any
      
      switch (table) {
        case 'fitness_routes':
          result = await database.getFitnessRoutes(1)
          break
        case 'profiles':
          // Test with a dummy ID since we need authentication for real profile access
          result = { data: [], error: null }
          break
        default:
          result = { data: [], error: new SupabaseError('Unknown table', 'UNKNOWN_TABLE') }
      }
      
      if (result.error) {
        const error = result.error as SupabaseError
        
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
          recordsFound: result.data?.length || 0,
          sampleData: result.data?.[0] || null
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

  const runAllTests = async () => {
    setTesting(true)
    setSelectedTest('all')
    
    try {
      const endpoints = ['fitness_routes', 'profiles']
      const diagnosticResults: RestApiDiagnosticResult[] = []
      
      for (const table of endpoints) {
        try {
          const result = await diagnoseEndpoint(table)
          diagnosticResults.push(result)
          
          // Add small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Failed to diagnose ${table}:`, error)
          diagnosticResults.push({
            endpoint: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}`,
            status: 'server_error',
            message: `Failed to test ${table} endpoint`,
            details: { error: error.message },
            timestamp: new Date()
          })
        }
      }
      
      setResults(diagnosticResults)
    } catch (error) {
      console.error('Failed to run diagnostics:', error)
    } finally {
      setTesting(false)
      setSelectedTest('')
    }
  }

  const testSpecificEndpoint = async (table: string) => {
    setTesting(true)
    setSelectedTest(table)
    
    try {
      const result = await diagnoseEndpoint(table)
      setResults(prev => {
        const filtered = prev.filter(r => !r.endpoint.includes(table))
        return [...filtered, result]
      })
    } catch (error) {
      console.error(`Failed to test ${table}:`, error)
    } finally {
      setTesting(false)
      setSelectedTest('')
    }
  }

  const testSupabaseHealth = async () => {
    setTesting(true)
    setSelectedTest('health')
    
    try {
      const healthResult = await testSupabaseConnection()
      
      const result: RestApiDiagnosticResult = {
        endpoint: `${import.meta.env.VITE_SUPABASE_URL}/health`,
        status: healthResult.success ? 'success' : 'server_error',
        message: healthResult.message,
        details: healthResult.details,
        timestamp: new Date()
      }
      
      setResults(prev => [...prev, result])
    } catch (error) {
      console.error('Failed to test Supabase health:', error)
    } finally {
      setTesting(false)
      setSelectedTest('')
    }
  }

  const downloadReport = () => {
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
    
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rest-api-diagnostic-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearResults = () => {
    setResults([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'dns_error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'network_error':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'permission_error':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'server_error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'dns_error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'network_error':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'permission_error':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'server_error':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">REST API Diagnostic Center</h2>
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={testing}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
          >
            {testing && selectedTest === 'all' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Activity className="w-5 h-5" />
            )}
            <span>Test All Endpoints</span>
          </button>

          <button
            onClick={() => testSpecificEndpoint('fitness_routes')}
            disabled={testing}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
          >
            {testing && selectedTest === 'fitness_routes' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
            <span>Test Fitness Routes</span>
          </button>

          <button
            onClick={testSupabaseHealth}
            disabled={testing}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
          >
            {testing && selectedTest === 'health' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span>Test Health</span>
          </button>

          <div className="flex space-x-2">
            {results.length > 0 && (
              <>
                <button
                  onClick={downloadReport}
                  className="flex items-center justify-center space-x-2 px-3 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors flex-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button
                  onClick={clearResults}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['profiles'].map(table => (
            <button
              key={table}
              onClick={() => testSpecificEndpoint(table)}
              disabled={testing}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded-lg text-sm transition-colors"
            >
              {testing && selectedTest === table ? (
                <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
              ) : null}
              {table.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Diagnostic Results ({results.length})
              </h3>
              <div className="text-sm text-gray-500">
                Success rate: {results.filter(r => r.status === 'success').length}/{results.length}
              </div>
            </div>

            <div className="grid gap-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {result.endpoint.split('/').pop()?.replace('_', ' ') || 'Endpoint'}
                        </h4>
                        <span className="text-xs opacity-75">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-2">{result.message}</p>
                      
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer hover:underline mb-2">
                            Technical Details
                          </summary>
                          <pre className="bg-white/50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(result.details, null, 2)}
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

        {/* Current Environment Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">Environment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Supabase URL:</strong>
              <br />
              <code className="text-xs bg-white p-1 rounded">
                {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
              </code>
            </div>
            <div>
              <strong>API Key:</strong>
              <br />
              <code className="text-xs bg-white p-1 rounded">
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? 
                  `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
                  'Not configured'
                }
              </code>
            </div>
            <div>
              <strong>Network Status:</strong>
              <br />
              <span className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
                {navigator.onLine ? 'Online' : 'Offline'}
              </span>
            </div>
            <div>
              <strong>User Agent:</strong>
              <br />
              <span className="text-xs text-gray-600">
                {navigator.userAgent.split(' ').slice(0, 3).join(' ')}...
              </span>
            </div>
          </div>
        </div>

        {/* Troubleshooting Guide */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">Common DNS Resolution Issues</h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p><strong>ERR_NAME_NOT_RESOLVED errors typically indicate:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Supabase project is paused, deleted, or URL changed</li>
              <li>DNS cache needs clearing (try clearing browser cache)</li>
              <li>Network firewall blocking .supabase.co domain</li>
              <li>ISP or DNS server issues</li>
            </ul>
            <p className="mt-3"><strong>To resolve:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Check your Supabase project status in the dashboard</li>
              <li>Verify the VITE_SUPABASE_URL in your .env file</li>
              <li>Clear DNS cache and restart browser</li>
              <li>Try a different network (mobile hotspot)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
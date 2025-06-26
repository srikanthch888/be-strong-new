import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Activity, Star, Heart, CheckCircle, Plus, Filter, Search, Calendar, AlertTriangle, RefreshCw, Wifi } from 'lucide-react'
import { supabase, FitnessRoute, SavedRoute, supabaseErrorHandler, NetworkError } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNetwork } from '../../hooks/useNetwork'
import { diagnoseSupabaseConnectivity } from '../../utils/supabaseDiagnostics'

interface ConnectionDiagnosis {
  canConnect: boolean
  lastError?: string
  lastChecked?: Date
  retryCount: number
}

export function RoutesPage() {
  const { user, connectionError } = useAuth()
  const { status: networkStatus, testConnectivity } = useNetwork()
  const [routes, setRoutes] = useState<FitnessRoute[]>([])
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'saved' | 'completed' | 'favorites'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'difficulty' | 'date'>('name')
  
  // Enhanced error handling states
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState<ConnectionDiagnosis>({
    canConnect: true,
    retryCount: 0
  })
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    fetchRoutes()
    if (user) {
      fetchSavedRoutes()
    }
  }, [user])

  // Enhanced fetch with comprehensive error handling
  const fetchRoutes = async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true)
    } else {
      setRetrying(true)
    }
    
    setFetchError(null)

    try {
      console.log('🌐 Fetching fitness routes...', {
        url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/fitness_routes`,
        timestamp: new Date().toISOString(),
        isRetry,
        retryCount: diagnosis.retryCount
      })

      // Pre-flight connectivity check
      if (networkStatus === 'offline') {
        throw new NetworkError('No internet connection detected', 'OFFLINE')
      }

      const { data, error } = await supabase
        .from('fitness_routes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase query error:', error)
        supabaseErrorHandler.logError(error, 'fetch-routes')
        
        // Check if it's a DNS/connection error
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            error.message?.includes('Network Error')) {
          
          setDiagnosis(prev => ({
            canConnect: false,
            lastError: 'DNS resolution failed for fitness routes endpoint',
            lastChecked: new Date(),
            retryCount: prev.retryCount + 1
          }))
          
          throw new NetworkError(
            'Cannot connect to fitness routes database. This could be due to:\n' +
            '• DNS resolution failure\n' +
            '• Supabase project unavailable\n' +
            '• Network connectivity issues\n' +
            '• Firewall blocking REST API requests',
            'DNS_FAILED'
          )
        }
        
        throw error
      }

      console.log('✅ Successfully fetched routes:', data?.length || 0)
      setRoutes(data || [])
      
      // Reset diagnosis on success
      setDiagnosis(prev => ({
        canConnect: true,
        lastError: undefined,
        lastChecked: new Date(),
        retryCount: 0
      }))
      
    } catch (error: any) {
      console.error('💥 Error fetching routes:', error)
      
      const formattedError = supabaseErrorHandler.formatError(error)
      
      if (error instanceof NetworkError && error.code === 'DNS_FAILED') {
        setFetchError(
          'Unable to connect to the fitness routes database. ' +
          'This appears to be a DNS resolution issue with your Supabase project.'
        )
      } else if (formattedError.type === 'network') {
        setFetchError(
          'Network connection failed while loading routes. ' +
          'Please check your internet connection and try again.'
        )
      } else {
        setFetchError(
          `Failed to load fitness routes: ${formattedError.message}`
        )
      }
      
      setDiagnosis(prev => ({
        canConnect: false,
        lastError: error.message,
        lastChecked: new Date(),
        retryCount: prev.retryCount + 1
      }))
      
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  const fetchSavedRoutes = async () => {
    if (!user) return

    try {
      console.log('🌐 Fetching saved routes for user:', user.id)
      
      const { data, error } = await supabase
        .from('saved_routes')
        .select(`
          *,
          fitness_routes (*)
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('❌ Error fetching saved routes:', error)
        supabaseErrorHandler.logError(error, 'fetch-saved-routes')
        return
      }
      
      console.log('✅ Successfully fetched saved routes:', data?.length || 0)
      setSavedRoutes(data || [])
    } catch (error) {
      console.error('💥 Error fetching saved routes:', error)
      supabaseErrorHandler.logError(error, 'fetch-saved-routes')
    }
  }

  // Enhanced retry function with diagnosis
  const handleRetry = async () => {
    console.log('🔄 Retrying data fetch...')
    
    // Test network connectivity first
    const networkConnected = await testConnectivity()
    if (!networkConnected) {
      setFetchError('Please check your internet connection and try again.')
      return
    }
    
    // Test Supabase connectivity
    try {
      const connectivityTest = await diagnoseSupabaseConnectivity()
      if (connectivityTest.status !== 'success') {
        setFetchError(
          `Connection issue detected: ${connectivityTest.message}\n\n` +
          'Please check your Supabase project status and configuration.'
        )
        return
      }
    } catch (error) {
      console.error('Connectivity test failed:', error)
    }
    
    // Proceed with retry
    await fetchRoutes(true)
    if (user) {
      await fetchSavedRoutes()
    }
  }

  const saveRoute = async (routeId: string, status: 'to-do' | 'favorite' = 'to-do') => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('saved_routes')
        .upsert({
          user_id: user.id,
          route_id: routeId,
          status
        })

      if (error) {
        supabaseErrorHandler.logError(error, 'save-route')
        return
      }
      
      fetchSavedRoutes()
    } catch (error) {
      console.error('Error saving route:', error)
      supabaseErrorHandler.logError(error, 'save-route')
    }
  }

  const updateRouteStatus = async (savedRouteId: string, status: 'to-do' | 'completed' | 'favorite') => {
    try {
      const updates: any = { status }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('saved_routes')
        .update(updates)
        .eq('id', savedRouteId)

      if (error) {
        supabaseErrorHandler.logError(error, 'update-route-status')
        return
      }
      
      fetchSavedRoutes()
    } catch (error) {
      console.error('Error updating route status:', error)
      supabaseErrorHandler.logError(error, 'update-route-status')
    }
  }

  const unsaveRoute = async (savedRouteId: string) => {
    try {
      const { error } = await supabase
        .from('saved_routes')
        .delete()
        .eq('id', savedRouteId)

      if (error) {
        supabaseErrorHandler.logError(error, 'unsave-route')
        return
      }
      
      fetchSavedRoutes()
    } catch (error) {
      console.error('Error unsaving route:', error)
      supabaseErrorHandler.logError(error, 'unsave-route')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRouteTypeIcon = (type: string) => {
    switch (type) {
      case 'running': return '🏃‍♂️'
      case 'walking': return '🚶‍♂️'
      case 'cycling': return '🚴‍♂️'
      case 'trail-running': return '⛰️'
      default: return '🏃‍♂️'
    }
  }

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (filter === 'all') return true
    
    const savedRoute = savedRoutes.find(sr => sr.route_id === route.id)
    
    switch (filter) {
      case 'saved': return !!savedRoute
      case 'completed': return savedRoute?.status === 'completed'
      case 'favorites': return savedRoute?.status === 'favorite'
      default: return true
    }
  })

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'distance': return a.distance - b.distance
      case 'difficulty': 
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
        return difficultyOrder[a.difficulty_level as keyof typeof difficultyOrder] - 
               difficultyOrder[b.difficulty_level as keyof typeof difficultyOrder]
      case 'date': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default: return 0
    }
  })

  // Show connection error state
  if (!diagnosis.canConnect && !loading && !retrying) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <Wifi className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connection Error
            </h2>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 whitespace-pre-line text-left">
                {fetchError || 'Unable to connect to the fitness routes database.'}
              </p>
              
              {diagnosis.lastError && (
                <details className="mt-3 text-left">
                  <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono text-red-700">
                    Error: {diagnosis.lastError}
                    <br />
                    Last checked: {diagnosis.lastChecked?.toLocaleString()}
                    <br />
                    Retry attempts: {diagnosis.retryCount}
                  </div>
                </details>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Common Solutions:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check your Supabase project status in the dashboard</li>
                  <li>• Verify VITE_SUPABASE_URL in your .env file</li>
                  <li>• Clear DNS cache and restart browser</li>
                  <li>• Try a different network (mobile hotspot)</li>
                  <li>• Contact network admin if on corporate network</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
                >
                  {retrying ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Testing connection...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Retry Connection</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Reload Page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading fitness routes...</p>
          {networkStatus !== 'connected' && (
            <p className="text-yellow-600 text-sm mt-2">
              Network: {networkStatus}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Connection Warning */}
      {(connectionError || networkStatus !== 'connected') && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 font-medium">Connection Issues Detected</p>
              <p className="text-yellow-700 text-sm">
                {connectionError || `Network status: ${networkStatus}. Some features may not work properly.`}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="ml-auto flex items-center space-x-1 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fitness Routes</h1>
          <p className="text-gray-600">
            Discover and save your favorite workout routes
            {routes.length > 0 && ` (${routes.length} available)`}
          </p>
        </div>
        <button className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add Route</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Routes</option>
              <option value="saved">Saved</option>
              <option value="completed">Completed</option>
              <option value="favorites">Favorites</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="distance">Distance</option>
              <option value="difficulty">Difficulty</option>
              <option value="date">Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRoutes.map((route) => {
          const savedRoute = savedRoutes.find(sr => sr.route_id === route.id)
          const isSaved = !!savedRoute
          const isFavorite = savedRoute?.status === 'favorite'
          const isCompleted = savedRoute?.status === 'completed'

          return (
            <div key={route.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Route Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getRouteTypeIcon(route.route_type)}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{route.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{route.route_type}</p>
                    </div>
                  </div>
                  
                  {user && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => isFavorite ? 
                          updateRouteStatus(savedRoute!.id, 'to-do') : 
                          isSaved ? updateRouteStatus(savedRoute!.id, 'favorite') : saveRoute(route.id, 'favorite')
                        }
                        className={`p-2 rounded-full transition-colors ${
                          isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      
                      {isSaved ? (
                        <button
                          onClick={() => isCompleted ? 
                            updateRouteStatus(savedRoute!.id, 'to-do') : 
                            updateRouteStatus(savedRoute!.id, 'completed')
                          }
                          className={`p-2 rounded-full transition-colors ${
                            isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600'
                          }`}
                        >
                          <CheckCircle className={`w-4 h-4 ${isCompleted ? 'fill-current' : ''}`} />
                        </button>
                      ) : (
                        <button
                          onClick={() => saveRoute(route.id)}
                          className="p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-full transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{route.description}</p>

                {/* Route Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{route.distance} miles</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{route.duration_minutes} min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(route.difficulty_level)}`}>
                      {route.difficulty_level}
                    </span>
                    
                    {savedRoute?.completed_at && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Completed {new Date(savedRoute.completed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full mt-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors font-medium">
                  View Details
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {sortedRoutes.length === 0 && !fetchError && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-600">
            {filter === 'all' ? 'Try adjusting your search terms' : `No ${filter} routes found`}
          </p>
        </div>
      )}
    </div>
  )
}
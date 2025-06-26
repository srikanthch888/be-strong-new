import { useState, useEffect } from 'react'
import { SupabaseHealthMonitor } from '../lib/supabase'

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    const monitor = SupabaseHealthMonitor.getInstance()
    
    // Listen to network status changes
    const removeListener = monitor.addListener((online) => {
      setIsOnline(online)
      if (online) {
        // Test actual connectivity when coming back online
        testConnectivity()
      } else {
        setIsConnected(false)
      }
    })

    // Initial connectivity test
    testConnectivity()

    return removeListener
  }, [])

  const testConnectivity = async () => {
    try {
      const monitor = SupabaseHealthMonitor.getInstance()
      const connected = await monitor.checkHealth()
      setIsConnected(connected)
      setLastChecked(new Date())
      return connected
    } catch (error) {
      console.error('Connectivity test failed:', error)
      setIsConnected(false)
      setLastChecked(new Date())
      return false
    }
  }

  return {
    isOnline,
    isConnected,
    lastChecked,
    testConnectivity,
    status: isOnline ? (isConnected ? 'connected' : 'limited') : 'offline'
  }
}
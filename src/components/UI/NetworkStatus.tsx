import React from 'react'
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { useNetwork } from '../../hooks/useNetwork'

interface NetworkStatusProps {
  showDetails?: boolean
  className?: string
}

export function NetworkStatus({ showDetails = false, className = '' }: NetworkStatusProps) {
  const { isOnline, isConnected, lastChecked, testConnectivity, status } = useNetwork()

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          message: 'Connected'
        }
      case 'limited':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          message: 'Limited connectivity'
        }
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          message: 'Offline'
        }
      default:
        return {
          icon: RefreshCw,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          message: 'Checking...'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  if (!showDetails && status === 'connected') {
    return null // Don't show anything when connected and details not requested
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.bg} ${config.border}`}>
        <Icon className={`w-4 h-4 ${config.color} ${status === null ? 'animate-spin' : ''}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.message}
        </span>
        {showDetails && (
          <button
            onClick={testConnectivity}
            className={`ml-2 p-1 rounded ${config.color} hover:bg-white/50 transition-colors`}
            title="Test connectivity"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {showDetails && lastChecked && (
        <span className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
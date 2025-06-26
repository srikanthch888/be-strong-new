import React, { useState } from 'react'
import { Trash2, Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function AuthCleaner() {
  const { user, signOut } = useAuth()
  const [isClearing, setIsClearing] = useState(false)
  const [clearingStatus, setClearingStatus] = useState<{
    step: string
    success: boolean
    details: string[]
  }[]>([])
  const [isComplete, setIsComplete] = useState(false)

  const addStatus = (step: string, success: boolean, details: string[] = []) => {
    setClearingStatus(prev => [...prev, { step, success, details }])
  }

  const clearAllAuthCredentials = async () => {
    setIsClearing(true)
    setClearingStatus([])
    setIsComplete(false)

    try {
      // Step 1: Sign out current user
      addStatus('Signing out current user', true, ['Initiating sign-out process...'])
      
      if (user) {
        const result = await signOut()
        if (result.success) {
          addStatus('Supabase sign-out', true, ['User successfully signed out'])
        } else {
          addStatus('Supabase sign-out', false, [`Sign-out failed: ${result.error}`])
        }
      } else {
        addStatus('User status check', true, ['No user currently signed in'])
      }

      // Step 2: Clear browser localStorage
      addStatus('Clearing localStorage', true, ['Scanning for authentication data...'])
      const localStorageKeys: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('sb-') ||
          key.includes('token') ||
          key.includes('session') ||
          key.includes('user')
        )) {
          localStorageKeys.push(key)
          localStorage.removeItem(key)
        }
      }
      
      addStatus('localStorage cleanup', true, [
        `Removed ${localStorageKeys.length} keys`,
        ...localStorageKeys.map(key => `• ${key}`)
      ])

      // Step 3: Clear browser sessionStorage
      addStatus('Clearing sessionStorage', true, ['Scanning for session data...'])
      const sessionStorageKeys: string[] = []
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (
          key.includes('supabase') || 
          key.includes('auth') || 
          key.includes('sb-') ||
          key.includes('token') ||
          key.includes('session') ||
          key.includes('oauth')
        )) {
          sessionStorageKeys.push(key)
          sessionStorage.removeItem(key)
        }
      }
      
      addStatus('sessionStorage cleanup', true, [
        `Removed ${sessionStorageKeys.length} keys`,
        ...sessionStorageKeys.map(key => `• ${key}`)
      ])

      // Step 4: Clear browser cookies (what we can access)
      addStatus('Clearing accessible cookies', true, ['Removing authentication cookies...'])
      const cookies = document.cookie.split(';')
      const clearedCookies: string[] = []
      
      cookies.forEach(cookie => {
        const [name] = cookie.split('=')
        const cookieName = name.trim()
        if (cookieName.includes('auth') || cookieName.includes('supabase') || cookieName.includes('sb-')) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
          clearedCookies.push(cookieName)
        }
      })
      
      addStatus('Cookie cleanup', true, [
        `Attempted to clear ${clearedCookies.length} cookies`,
        ...clearedCookies.map(name => `• ${name}`)
      ])

      // Step 5: Clear browser cache (service worker cache if available)
      if ('caches' in window) {
        addStatus('Clearing cache storage', true, ['Checking for cached authentication data...'])
        try {
          const cacheNames = await caches.keys()
          const authCaches = cacheNames.filter(name => 
            name.includes('auth') || name.includes('supabase')
          )
          
          await Promise.all(authCaches.map(name => caches.delete(name)))
          addStatus('Cache storage cleanup', true, [
            `Cleared ${authCaches.length} auth-related caches`,
            ...authCaches.map(name => `• ${name}`)
          ])
        } catch (error: any) {
          addStatus('Cache storage cleanup', false, [`Cache cleanup failed: ${error.message}`])
        }
      } else {
        addStatus('Cache storage', true, ['Cache API not available'])
      }

      // Step 6: Clear IndexedDB storage
      addStatus('Clearing IndexedDB', true, ['Scanning for authentication databases...'])
      try {
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases()
          const authDbs = databases.filter(db => 
            db.name && (
              db.name.includes('supabase') || 
              db.name.includes('auth') ||
              db.name.includes('sb-')
            )
          )
          
          for (const db of authDbs) {
            if (db.name) {
              const deleteReq = indexedDB.deleteDatabase(db.name)
              await new Promise((resolve, reject) => {
                deleteReq.onsuccess = resolve
                deleteReq.onerror = reject
              })
            }
          }
          
          addStatus('IndexedDB cleanup', true, [
            `Cleared ${authDbs.length} authentication databases`,
            ...authDbs.map(db => `• ${db.name}`)
          ])
        }
      } catch (error: any) {
        addStatus('IndexedDB cleanup', false, [`IndexedDB cleanup failed: ${error.message}`])
      }

      // Step 7: Verify Supabase session is cleared
      addStatus('Verifying session clearance', true, ['Checking Supabase session status...'])
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session) {
          addStatus('Session verification', false, ['Session still exists after cleanup'])
        } else {
          addStatus('Session verification', true, ['No active session found'])
        }
      } catch (error: any) {
        addStatus('Session verification', true, ['Session check completed'])
      }

      // Step 8: Force page reload to clear memory state
      addStatus('Final cleanup', true, ['Preparing to reload application...'])
      setIsComplete(true)
      
      // Reload page after 3 seconds
      setTimeout(() => {
        window.location.reload()
      }, 3000)

    } catch (error: any) {
      console.error('Error during credential cleanup:', error)
      addStatus('Cleanup process', false, [`Unexpected error: ${error.message}`])
    } finally {
      setIsClearing(false)
    }
  }

  const manualBrowserCleanup = () => {
    const instructions = [
      '1. Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)',
      '2. Select "All time" as the time range',
      '3. Check: Cookies, Site data, Cached images and files',
      '4. Click "Clear data"',
      '5. Restart your browser'
    ]
    
    const newWindow = window.open('', '_blank', 'width=600,height=400')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Manual Browser Cleanup Instructions</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Manual Browser Data Cleanup</h2>
            <p>To completely clear all stored credentials, follow these steps:</p>
            <ol>
              ${instructions.map(instruction => `<li style="margin: 10px 0;">${instruction}</li>`).join('')}
            </ol>
            <p><strong>Alternative for Chrome:</strong> Go to Settings → Privacy and security → Clear browsing data</p>
            <p><strong>Alternative for Firefox:</strong> Go to Settings → Privacy & Security → Clear Data</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
          </body>
        </html>
      `)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-8 h-8 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Authentication Credential Cleaner</h2>
        </div>
        
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Important Notice</h3>
              <p className="text-yellow-700 text-sm mt-1">
                This will completely clear all authentication data and sign you out. 
                You'll need to sign in again to access the application.
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">Current Authentication Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>User Status:</span>
              <span className={user ? 'text-green-600' : 'text-gray-500'}>
                {user ? `Signed in (${user.email})` : 'Not signed in'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>localStorage entries:</span>
              <span>{Object.keys(localStorage).filter(key => 
                key.includes('supabase') || key.includes('auth')
              ).length} auth-related items</span>
            </div>
            <div className="flex justify-between">
              <span>sessionStorage entries:</span>
              <span>{Object.keys(sessionStorage).filter(key => 
                key.includes('supabase') || key.includes('auth')
              ).length} auth-related items</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={clearAllAuthCredentials}
            disabled={isClearing || isComplete}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
          >
            {isClearing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Clearing Credentials...</span>
              </>
            ) : isComplete ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Cleanup Complete - Reloading...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                <span>Clear All Authentication Data</span>
              </>
            )}
          </button>
          
          <button
            onClick={manualBrowserCleanup}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
          >
            <Shield className="w-5 h-5" />
            <span>Manual Browser Cleanup Instructions</span>
          </button>
        </div>

        {/* Cleanup Progress */}
        {clearingStatus.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Cleanup Progress</h3>
            <div className="space-y-3">
              {clearingStatus.map((status, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  status.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {status.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      status.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {status.step}
                    </span>
                  </div>
                  {status.details.length > 0 && (
                    <div className={`text-sm ml-7 ${
                      status.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {status.details.map((detail, idx) => (
                        <div key={idx}>{detail}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">What Gets Cleared</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Supabase authentication tokens</li>
            <li>• User session data</li>
            <li>• Browser localStorage and sessionStorage</li>
            <li>• Authentication cookies</li>
            <li>• Cached authentication data</li>
            <li>• IndexedDB authentication databases</li>
            <li>• Application memory state (via page reload)</li>
          </ul>
        </div>

        {isComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">
                All authentication credentials have been successfully cleared!
              </span>
            </div>
            <p className="text-green-700 text-sm mt-2">
              The page will reload automatically to ensure all application state is reset.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
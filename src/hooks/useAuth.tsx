import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Profile, supabaseErrorHandler, NetworkError } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<{ success: boolean; error?: string; stage?: string }>
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  signOutLoading: boolean
  lastSignOutAttempt: { timestamp: string; success: boolean; stage: string; error?: string } | null
  connectionError: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [lastSignOutAttempt, setLastSignOutAttempt] = useState<{ 
    timestamp: string; 
    success: boolean; 
    stage: string; 
    error?: string 
  } | null>(null)

  useEffect(() => {
    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        setConnectionError(null)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth initialization error:', error)
          supabaseErrorHandler.logError(error, 'auth-initialization')
          setConnectionError('Failed to initialize authentication')
        } else {
          console.log('🔐 Initial session check:', session ? 'Session found' : 'No session')
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        supabaseErrorHandler.logError(error, 'auth-initialization')
        
        if (error instanceof NetworkError) {
          setConnectionError(`Connection error: ${error.message}`)
        } else {
          setConnectionError('Failed to connect to authentication service')
        }
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log(`🔐 Auth Event: ${event}`, {
            hasSession: !!session,
            userId: session?.user?.id,
            timestamp: new Date().toISOString()
          })
          
          setConnectionError(null)
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
          setLoading(false)

          // Log specific sign-out event
          if (event === 'SIGNED_OUT') {
            console.log('✅ User successfully signed out via auth state change')
          }
        } catch (error) {
          console.error('Auth state change error:', error)
          supabaseErrorHandler.logError(error, 'auth-state-change')
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Profile fetch error (this is normal for new users):', error)
        supabaseErrorHandler.logError(error, 'profile-fetch')
        setProfile(null)
        return
      }
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      supabaseErrorHandler.logError(error, 'profile-fetch')
      setProfile(null)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setConnectionError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) {
        supabaseErrorHandler.logError(error, 'signup')
      }
      
      return { error }
    } catch (error) {
      supabaseErrorHandler.logError(error, 'signup')
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setConnectionError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        supabaseErrorHandler.logError(error, 'signin')
      }
      
      return { error }
    } catch (error) {
      supabaseErrorHandler.logError(error, 'signin')
      return { error: error as AuthError }
    }
  }

  const signOut = async (): Promise<{ success: boolean; error?: string; stage?: string }> => {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()
    
    console.log('🔓 Starting enhanced sign-out process...')
    setSignOutLoading(true)
    setConnectionError(null)
    
    try {
      // Step 1: Clear local state immediately
      console.log('🧹 Step 1: Clearing local state')
      setUser(null)
      setSession(null)
      setProfile(null)

      // Step 2: Clear storage
      console.log('🗄️ Step 2: Clearing storage')
      try {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase.auth') || 
          (key.includes('sb-') && key.includes('auth-token'))
        )
        
        authKeys.forEach(key => {
          localStorage.removeItem(key)
          console.log(`🗑️ Cleared storage key: ${key}`)
        })
      } catch (storageError) {
        console.warn('⚠️ Storage cleanup warning:', storageError)
      }

      // Step 3: Call Supabase signOut with enhanced error handling
      console.log('📡 Step 3: Calling Supabase auth.signOut()')
      
      try {
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.warn('⚠️ Supabase sign-out returned error:', error)
          supabaseErrorHandler.logError(error, 'signout-api')
        } else {
          console.log('✅ Supabase sign-out API call successful')
        }
      } catch (apiError: any) {
        console.warn('⚠️ Supabase sign-out API failed:', apiError)
        supabaseErrorHandler.logError(apiError, 'signout-api')
        
        if (apiError instanceof NetworkError) {
          setConnectionError(`Sign-out failed: ${apiError.message}`)
        }
      }

      // Record successful attempt
      const successRecord = {
        timestamp,
        success: true,
        stage: 'completed',
        duration: Date.now() - startTime
      }
      setLastSignOutAttempt(successRecord)

      console.log(`🎉 Enhanced sign-out completed in ${Date.now() - startTime}ms`)
      return { success: true, stage: 'completed' }

    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`💥 Sign-out error after ${duration}ms:`, error)
      supabaseErrorHandler.logError(error, 'signout-process')
      
      // Emergency cleanup
      try {
        setUser(null)
        setSession(null)
        setProfile(null)
      } catch (cleanupError) {
        console.error('Emergency cleanup failed:', cleanupError)
      }

      const failureRecord = {
        timestamp,
        success: false,
        stage: 'error_recovery',
        error: error.message,
        duration
      }
      setLastSignOutAttempt(failureRecord)

      return { 
        success: true, // Consider successful since local state is cleared
        error: `Error occurred but session was cleared: ${error.message}`,
        stage: 'error_recovery'
      }
    } finally {
      setSignOutLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setConnectionError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) {
        supabaseErrorHandler.logError(error, 'reset-password')
      }
      
      return { error }
    } catch (error) {
      supabaseErrorHandler.logError(error, 'reset-password')
      return { error: error as AuthError }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      setConnectionError(null)
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null)
      } else {
        supabaseErrorHandler.logError(error, 'update-profile')
      }

      return { error }
    } catch (error) {
      supabaseErrorHandler.logError(error, 'update-profile')
      return { error }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signOut,
      signUp,
      signIn,
      resetPassword,
      updateProfile,
      signOutLoading,
      lastSignOutAttempt,
      connectionError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
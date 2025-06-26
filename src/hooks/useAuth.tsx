import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Profile, database, SupabaseError } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<{ success: boolean; error?: string; stage?: string }>
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | SupabaseError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | SupabaseError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | SupabaseError | null }>
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
    let mounted = true

    // Get initial session with enhanced error handling
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...')
        setConnectionError(null)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Auth initialization error:', error)
          setConnectionError('Failed to initialize authentication')
          setLoading(false)
          return
        }

        console.log('🔐 Initial session:', session ? 'Found' : 'None')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        
        setLoading(false)
      } catch (error: any) {
        console.error('Auth initialization failed:', error)
        if (mounted) {
          setConnectionError('Authentication initialization failed')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

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
            // Clear any cached data
            setProfile(null)
          }
        } catch (error: any) {
          console.error('Auth state change error:', error)
          if (mounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log(`👤 Fetching profile for user: ${userId}`)
      
      const { data, error } = await database.getProfile(userId)

      if (error) {
        console.warn('Profile fetch error (normal for new users):', error.message)
        setProfile(null)
        return
      }
      
      console.log('✅ Profile loaded successfully')
      setProfile(data)
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      console.log('📝 Starting user registration...')
      setConnectionError(null)
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) {
        console.error('Registration error:', error)
        return { error }
      }
      
      console.log('✅ Registration successful')
      return { error: null }
    } catch (error: any) {
      console.error('Registration failed:', error)
      return { error: new SupabaseError(error.message, 'SIGNUP_ERROR') }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Starting user sign-in...')
      setConnectionError(null)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Sign-in error:', error)
        return { error }
      }
      
      console.log('✅ Sign-in successful')
      return { error: null }
    } catch (error: any) {
      console.error('Sign-in failed:', error)
      return { error: new SupabaseError(error.message, 'SIGNIN_ERROR') }
    }
  }

  const signOut = async (): Promise<{ success: boolean; error?: string; stage?: string }> => {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()
    
    console.log('🔓 Starting enhanced sign-out process...')
    setSignOutLoading(true)
    setConnectionError(null)
    
    try {
      // Step 1: Clear local state immediately for better UX
      console.log('🧹 Step 1: Clearing local state')
      setUser(null)
      setSession(null)
      setProfile(null)

      // Step 2: Clear browser storage
      console.log('🗄️ Step 2: Clearing browser storage')
      try {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase.auth') || 
          (key.includes('sb-') && key.includes('auth-token'))
        )
        
        authKeys.forEach(key => {
          localStorage.removeItem(key)
          console.log(`🗑️ Cleared storage key: ${key}`)
        })

        // Clear session storage too
        const sessionKeys = Object.keys(sessionStorage).filter(key =>
          key.includes('supabase') || key.includes('auth')
        )
        sessionKeys.forEach(key => sessionStorage.removeItem(key))
        
      } catch (storageError) {
        console.warn('⚠️ Storage cleanup warning:', storageError)
      }

      // Step 3: Call Supabase signOut with timeout
      console.log('📡 Step 3: Calling Supabase auth.signOut()')
      
      try {
        const signOutPromise = supabase.auth.signOut()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign-out timeout')), 10000)
        )

        const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
        
        if (error) {
          console.warn('⚠️ Supabase sign-out returned error:', error)
        } else {
          console.log('✅ Supabase sign-out API call successful')
        }
      } catch (apiError: any) {
        console.warn('⚠️ Supabase sign-out API failed:', apiError.message)
        
        if (apiError.message.includes('timeout')) {
          setConnectionError('Sign-out request timed out, but local session cleared')
        } else {
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
      
      // Emergency cleanup - still clear local state
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
        success: true, // Still consider successful since local state is cleared
        error: `Error occurred but session was cleared: ${error.message}`,
        stage: 'error_recovery'
      }
    } finally {
      setSignOutLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('🔄 Starting password reset...')
      setConnectionError(null)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) {
        console.error('Password reset error:', error)
        return { error }
      }
      
      console.log('✅ Password reset email sent')
      return { error: null }
    } catch (error: any) {
      console.error('Password reset failed:', error)
      return { error: new SupabaseError(error.message, 'RESET_PASSWORD_ERROR') }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      console.log('👤 Updating user profile...')
      setConnectionError(null)
      
      const { data, error } = await database.updateProfile(user.id, updates)

      if (error) {
        console.error('Profile update error:', error)
        return { error }
      }

      console.log('✅ Profile updated successfully')
      setProfile(data)
      return { error: null }
    } catch (error: any) {
      console.error('Profile update failed:', error)
      return { error: new SupabaseError(error.message, 'UPDATE_PROFILE_ERROR') }
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
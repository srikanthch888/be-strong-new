import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [lastSignOutAttempt, setLastSignOutAttempt] = useState<{ 
    timestamp: string; 
    success: boolean; 
    stage: string; 
    error?: string 
  } | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session ? 'Session found' : 'No session')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔐 Auth Event: ${event}`, {
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        })
        
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
        // Don't throw error for missing profiles - just set to null
        setProfile(null)
        return
      }
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signOut = async (): Promise<{ success: boolean; error?: string; stage?: string }> => {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()
    
    console.log('🔓 Starting simplified sign-out process...')
    console.log('📊 Current auth state:', { 
      hasUser: !!user, 
      hasSession: !!session, 
      hasProfile: !!profile,
      userId: user?.id,
      userEmail: user?.email
    })

    setSignOutLoading(true)
    
    try {
      // Step 1: Immediately clear local state
      console.log('🧹 Step 1: Clearing local state immediately')
      setUser(null)
      setSession(null)
      setProfile(null)

      // Step 2: Clear storage proactively
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
        
        // Also clear session storage
        const sessionKeys = Object.keys(sessionStorage).filter(key => 
          key.includes('supabase') || key.includes('auth')
        )
        sessionKeys.forEach(key => {
          sessionStorage.removeItem(key)
          console.log(`🗑️ Cleared session key: ${key}`)
        })
      } catch (storageError) {
        console.warn('⚠️ Storage cleanup warning:', storageError)
      }

      // Step 3: Call Supabase signOut with timeout
      console.log('📡 Step 3: Calling Supabase auth.signOut()')
      
      const signOutWithTimeout = () => {
        return new Promise<{ error: any }>((resolve, reject) => {
          // Set up timeout
          const timeoutId = setTimeout(() => {
            console.warn('⏰ Sign-out API call timed out after 8 seconds')
            reject(new Error('Sign-out request timed out'))
          }, 8000)

          // Make the actual call
          supabase.auth.signOut().then(result => {
            clearTimeout(timeoutId)
            resolve(result)
          }).catch(error => {
            clearTimeout(timeoutId)
            reject(error)
          })
        })
      }

      try {
        const { error } = await signOutWithTimeout()
        
        if (error) {
          console.warn('⚠️ Supabase sign-out returned error:', error)
          // Don't throw - we already cleared local state
        } else {
          console.log('✅ Supabase sign-out API call successful')
        }
      } catch (apiError: any) {
        console.warn('⚠️ Supabase sign-out API failed:', apiError.message)
        // Don't throw - we already cleared local state which is most important
      }

      // Step 4: Verify final state
      console.log('🔍 Step 4: Verifying final state')
      const finalCheck = {
        localUser: !!user,
        localSession: !!session,
        localProfile: !!profile,
        timestamp: new Date().toISOString()
      }
      console.log('📊 Final state:', finalCheck)

      // Record successful attempt
      const successRecord = {
        timestamp,
        success: true,
        stage: 'completed',
        duration: Date.now() - startTime
      }
      setLastSignOutAttempt(successRecord)

      console.log(`🎉 Sign-out process completed successfully in ${Date.now() - startTime}ms`)
      return { success: true, stage: 'completed' }

    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`💥 Sign-out process encountered error after ${duration}ms:`, error)
      
      // Even if there's an error, ensure local state is cleared
      console.log('🚨 Ensuring local state is cleared despite errors...')
      try {
        setUser(null)
        setSession(null)
        setProfile(null)
        
        // Force clear all Supabase-related storage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
            try {
              localStorage.removeItem(key)
            } catch (e) {
              console.warn(`Could not remove ${key}:`, e)
            }
          }
        })
        
        console.log('✅ Emergency cleanup completed')
      } catch (cleanupError) {
        console.error('💥 Emergency cleanup failed:', cleanupError)
      }

      // Record failed attempt
      const failureRecord = {
        timestamp,
        success: false,
        stage: 'error_recovery',
        error: error.message,
        duration
      }
      setLastSignOutAttempt(failureRecord)

      // Return success since we cleared local state
      return { 
        success: true, // We consider it successful if local state is cleared
        error: `API error occurred but local session was cleared: ${error.message}`,
        stage: 'error_recovery'
      }
    } finally {
      setSignOutLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error }
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
      lastSignOutAttempt
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
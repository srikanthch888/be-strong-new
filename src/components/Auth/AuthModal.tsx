import React, { useState, useEffect } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Wifi, RefreshCw } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useForm } from 'react-hook-form'
import { diagnoseSupabaseConnectivity } from '../../utils/supabaseDiagnostics'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

interface FormData {
  email: string
  password: string
  confirmPassword?: string
  full_name?: string
  username?: string
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean
    canConnect: boolean
    details?: any
  }>({ checked: false, canConnect: true })
  
  const { signIn, signUp, resetPassword, connectionError } = useAuth()
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>()

  // Check connectivity when modal opens
  useEffect(() => {
    if (isOpen && !connectionStatus.checked) {
      checkConnectivity()
    }
  }, [isOpen])

  const checkConnectivity = async () => {
    try {
      const diagnosis = await diagnoseSupabaseConnectivity()
      setConnectionStatus({
        checked: true,
        canConnect: diagnosis.status === 'success',
        details: diagnosis
      })
      
      if (diagnosis.status !== 'success') {
        setError(`Connection issue: ${diagnosis.message}`)
      }
    } catch (error) {
      setConnectionStatus({
        checked: true,
        canConnect: false,
        details: { error: 'Failed to check connectivity' }
      })
    }
  }

  if (!isOpen) return null

  const onSubmit = async (data: FormData) => {
    // Pre-flight connectivity check
    if (!connectionStatus.canConnect) {
      setError('Cannot connect to authentication service. Please check your connection and try again.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'login') {
        const { error } = await signIn(data.email, data.password)
        if (error) {
          // Enhanced error handling for connection issues
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
              error.message?.includes('Network Error')) {
            setError('Cannot connect to authentication service. This might be due to:\n• Network connectivity issues\n• Supabase service unavailable\n• DNS resolution problems\n\nPlease check your connection and try again.')
          } else {
            setError(error.message)
          }
        } else {
          onClose()
          reset()
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(data.email, data.password, {
          full_name: data.full_name,
          username: data.username
        })
        if (error) {
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
            setError('Cannot connect to registration service. Please check your connection and try again.')
          } else {
            setError(error.message)
          }
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(data.email)
        if (error) {
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
            setError('Cannot connect to password reset service. Please check your connection and try again.')
          } else {
            setError(error.message)
          }
        } else {
          setMessage('Password reset email sent!')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode)
    setError('')
    setMessage('')
    reset()
  }

  const password = watch('password')

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl z-10 border-b border-gray-100">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Join Strong Strong'}
                {mode === 'reset' && 'Reset Password'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'login' && 'Sign in to your account'}
                {mode === 'signup' && 'Create your account to get started'}
                {mode === 'reset' && 'Enter your email to reset password'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 ml-4"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 space-y-6">
          {/* Connection Status Warning */}
          {connectionStatus.checked && !connectionStatus.canConnect && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <Wifi className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">Connection Issue Detected</h3>
                  <p className="text-sm text-red-700 mb-3">
                    Cannot connect to the authentication service. This may prevent signing in.
                  </p>
                  {connectionStatus.details?.solutions && (
                    <div className="text-xs text-red-600">
                      <strong>Try:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {connectionStatus.details.solutions.slice(0, 3).map((solution: string, index: number) => (
                          <li key={index}>{solution}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={checkConnectivity}
                    className="flex items-center space-x-1 mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Test connection again</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* General Connection Error from Auth Context */}
          {connectionError && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Network Warning</h3>
                  <p className="text-sm text-yellow-700 mt-1">{connectionError}</p>
                </div>
              </div>
            </div>
          )}

          {/* OAuth Buttons */}
          {mode !== 'reset' && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={!connectionStatus.canConnect}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <span className="font-medium text-gray-700">Continue with Google</span>
              </button>
              
              <button
                type="button"
                disabled={!connectionStatus.canConnect}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">f</span>
                </div>
                <span className="font-medium text-gray-700">Continue with Facebook</span>
              </button>
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name - Signup only */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('full_name', { required: mode === 'signup' ? 'Full name is required' : false })}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.full_name.message}</span>
                  </p>
                )}
              </div>
            )}

            {/* Username - Signup only */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('username', { 
                      required: mode === 'signup' ? 'Username is required' : false,
                      minLength: { value: 3, message: 'Username must be at least 3 characters' }
                    })}
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Choose a username"
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.username.message}</span>
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password */}
            {mode !== 'reset' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password - Signup only */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.confirmPassword.message}</span>
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-600 leading-relaxed whitespace-pre-line">{error}</p>
                  {error.includes('Cannot connect') && (
                    <button
                      type="button"
                      onClick={checkConnectivity}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Check connection again
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-sm text-green-600 leading-relaxed">{message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !connectionStatus.canConnect}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>
                {mode === 'login' && (loading ? 'Signing In...' : 'Sign In')}
                {mode === 'signup' && (loading ? 'Creating Account...' : 'Create Account')}
                {mode === 'reset' && (loading ? 'Sending Email...' : 'Send Reset Email')}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="text-center space-y-3">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => switchMode('reset')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors focus:outline-none focus:underline"
                >
                  Forgot your password?
                </button>
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:underline"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <div className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:underline"
                >
                  Sign in
                </button>
              </div>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => switchMode('login')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors focus:outline-none focus:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
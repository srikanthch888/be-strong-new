import React, { useState } from 'react'
import { User, Calendar, Award, Settings, Edit3, Save, X, Camera, Trash2, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useForm } from 'react-hook-form'

interface ProfileFormData {
  full_name: string
  username: string
}

export function ProfilePage() {
  const { user, profile, updateProfile, signOut, signOutLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [signOutMessage, setSignOutMessage] = useState('')
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: profile?.full_name || '',
      username: profile?.username || ''
    }
  })

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    setMessage('')
    
    const { error } = await updateProfile(data)
    
    if (error) {
      setMessage('Error updating profile: ' + error.message)
    } else {
      setMessage('Profile updated successfully!')
      setIsEditing(false)
    }
    
    setLoading(false)
  }

  const handleCancel = () => {
    reset({
      full_name: profile?.full_name || '',
      username: profile?.username || ''
    })
    setIsEditing(false)
    setMessage('')
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, you'd implement account deletion
      alert('Account deletion would be implemented here')
    }
  }

  const handleSignOut = async () => {
    setSignOutMessage('')
    
    try {
      const result = await signOut()
      
      if (result.success) {
        setSignOutMessage('Successfully signed out! Redirecting...')
        
        // Wait a moment to show the message, then redirect would happen
        setTimeout(() => {
          // In your app structure, this would trigger navigation to home
          window.location.reload()
        }, 1000)
      } else {
        setSignOutMessage(result.error || 'Sign out failed. Please try again.')
        
        // Clear error message after 5 seconds
        setTimeout(() => setSignOutMessage(''), 5000)
      }
    } catch (error: any) {
      console.error('Sign out error:', error)
      setSignOutMessage('An unexpected error occurred. Please refresh the page.')
      setTimeout(() => setSignOutMessage(''), 5000)
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Please log in to view your profile</p>
        </div>
      </div>
    )
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.full_name || profile.username || 'Anonymous User'}
            </h1>
            <p className="text-gray-600">@{profile.username || 'user'}</p>
            <div className="flex items-center justify-center sm:justify-start space-x-4 mt-2">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {joinDate}
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                {...register('full_name', { required: 'Full name is required' })}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                })}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Choose a username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
          </form>
        )}

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-xl ${
            message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-gray-600">Routes Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-gray-600">Routes Saved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-gray-600">Days Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Email</p>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-gray-600">Last updated: Never</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Sign Out</p>
              <p className="text-gray-600">Sign out of your account</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signOutLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              {signOutLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>
          
          {/* Sign Out Message */}
          {signOutMessage && (
            <div className={`p-3 rounded-xl ${
              signOutMessage.includes('Successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {signOutMessage}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 pt-6 border-t border-red-200">
          <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-gray-600">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { Menu, X, User, LogOut, Settings, Heart, Activity, Home, Coffee, AlertTriangle, Wifi } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNetwork } from '../../hooks/useNetwork'
import { AuthModal } from '../Auth/AuthModal'
import { Badge, NotificationBadge } from '../UI/Badge'

interface NavbarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { user, profile, signOut, signOutLoading, lastSignOutAttempt, connectionError } = useAuth()
  const { status: networkStatus } = useNetwork()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set())
  const [signOutMessage, setSignOutMessage] = useState('')

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const handleNavigate = (page: string) => {
    // Trigger badge rotation animation
    setSelectedBadges(prev => new Set(prev).add(page))
    
    // Remove animation class after animation completes
    setTimeout(() => {
      setSelectedBadges(prev => {
        const newSet = new Set(prev)
        newSet.delete(page)
        return newSet
      })
    }, 800)
    
    onNavigate(page)
  }

  const handleSignOut = async () => {
    setSignOutMessage('')
    
    try {
      console.log('🔄 Navbar: Starting sign-out process...')
      const result = await signOut()
      
      console.log('📋 Navbar: Sign-out result:', result)
      
      if (result.success) {
        setSignOutMessage('Successfully signed out!')
        setShowUserMenu(false)
        setShowMobileMenu(false)
        
        // Clear message after 3 seconds
        setTimeout(() => setSignOutMessage(''), 3000)
        
        // Navigate to home page
        handleNavigate('home')
      } else {
        const errorMsg = result.error || 'Sign out failed. Please try again.'
        setSignOutMessage(errorMsg)
        console.error('❌ Navbar: Sign-out failed:', errorMsg, 'Stage:', result.stage)
        
        // Clear error message after 5 seconds
        setTimeout(() => setSignOutMessage(''), 5000)
      }
    } catch (error: any) {
      console.error('💥 Navbar: Sign out error:', error)
      setSignOutMessage('An unexpected error occurred. Please refresh the page.')
      setTimeout(() => setSignOutMessage(''), 5000)
    }
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'routes', label: 'Fitness Routes', icon: Activity },
    { id: 'procrastination', label: 'Procrastination Planner', icon: Coffee },
    ...(user ? [
      { id: 'saved', label: 'My Fitness Routes', icon: Heart },
      { id: 'saved-procrastination', label: 'My Procrastination Routes', icon: Coffee }
    ] : [])
  ]

  // Mock notification counts for demonstration
  const notificationCounts = {
    routes: 3,
    'saved-procrastination': 5,
    profile: 2
  }

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 z-10">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BE STRONG</span>
              
              {/* Network Status Indicator */}
              {networkStatus !== 'connected' && (
                <div className="flex items-center space-x-1">
                  <Wifi className={`w-4 h-4 ${
                    networkStatus === 'offline' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                  <span className={`text-xs ${
                    networkStatus === 'offline' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {networkStatus === 'offline' ? 'Offline' : 'Limited'}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => (
                <Badge
                  key={item.id}
                  content={notificationCounts[item.id as keyof typeof notificationCounts]}
                  variant="danger"
                  pulse={!!notificationCounts[item.id as keyof typeof notificationCounts]}
                  show={!!notificationCounts[item.id as keyof typeof notificationCounts]}
                  className={selectedBadges.has(item.id) ? 'badge-rotate-360' : ''}
                >
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`
                      nav-button-desktop
                      flex items-center justify-center space-x-2 
                      px-4 py-3 rounded-xl transition-all duration-200
                      min-w-[44px] min-h-[44px]
                      ${currentPage === item.id
                        ? 'bg-blue-50 text-blue-600 shadow-md scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-102'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      active:scale-98 active:bg-blue-100
                    `}
                    aria-label={`Navigate to ${item.label}`}
                    role="button"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                  </button>
                </Badge>
              ))}
            </div>

            {/* User Menu / Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4 z-10">
              {user ? (
                <div className="relative">
                  <NotificationBadge 
                    count={notificationCounts.profile}
                    className={selectedBadges.has('profile') ? 'badge-rotate-360' : ''}
                  >
                    <button
                      onClick={() => {
                        setSelectedBadges(prev => new Set(prev).add('profile'))
                        setTimeout(() => {
                          setSelectedBadges(prev => {
                            const newSet = new Set(prev)
                            newSet.delete('profile')
                            return newSet
                          })
                        }, 800)
                        setShowUserMenu(!showUserMenu)
                      }}
                      className="
                        nav-button-user
                        flex items-center space-x-2 p-2 rounded-full 
                        hover:bg-gray-50 transition-all duration-200
                        min-w-[44px] min-h-[44px]
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        active:scale-95
                      "
                      aria-label="Open user menu"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <span className="text-gray-700 font-medium">{profile?.username || 'User'}</span>
                    </button>
                  </NotificationBadge>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      {/* Connection Error Indicator */}
                      {connectionError && (
                        <div className="mx-4 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-xs text-red-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Connection issues detected</span>
                          </div>
                        </div>
                      )}

                      {/* Sign-out Status Indicator */}
                      {lastSignOutAttempt && !lastSignOutAttempt.success && (
                        <div className="mx-4 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-xs text-yellow-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Previous sign-out failed at {lastSignOutAttempt.stage} stage</span>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          handleNavigate('profile')
                          setShowUserMenu(false)
                        }}
                        className="
                          w-full flex items-center space-x-2 px-4 py-3 text-left 
                          hover:bg-gray-50 transition-colors
                          min-h-[44px]
                          focus:outline-none focus:bg-gray-50
                        "
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      
                      {/* Sign Out Message */}
                      {signOutMessage && (
                        <div className={`mx-4 my-2 p-2 rounded-lg text-xs ${
                          signOutMessage.includes('Successfully') 
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {signOutMessage}
                        </div>
                      )}
                      
                      <hr className="my-2" />
                      <button
                        onClick={handleSignOut}
                        disabled={signOutLoading}
                        className="
                          w-full flex items-center space-x-2 px-4 py-3 text-left 
                          hover:bg-red-50 text-red-600 transition-colors
                          min-h-[44px]
                          focus:outline-none focus:bg-red-50
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        {signOutLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            <div className="flex-1">
                              <span>Signing out...</span>
                              <div className="text-xs text-gray-500 mt-1">This may take a moment</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="
                      nav-button-auth
                      text-gray-600 hover:text-gray-900 font-medium transition-colors
                      px-4 py-2 rounded-xl hover:bg-gray-50
                      min-w-[44px] min-h-[44px]
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      active:scale-95
                    "
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="
                      nav-button-auth-primary
                      bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl 
                      font-medium transition-all duration-200
                      min-w-[44px] min-h-[44px]
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      active:scale-95 hover:scale-102 shadow-md hover:shadow-lg
                    "
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden z-10">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="
                  nav-button-mobile
                  p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50
                  transition-all duration-200
                  min-w-[44px] min-h-[44px]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  active:scale-95
                "
                aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-4 bg-white relative z-40">
              <div className="flex flex-col space-y-1">
                {/* Connection Status for Mobile */}
                {(connectionError || networkStatus !== 'connected') && (
                  <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-red-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        {connectionError || `Network: ${networkStatus}`}
                      </span>
                    </div>
                  </div>
                )}

                {navItems.map((item) => (
                  <Badge
                    key={item.id}
                    content={notificationCounts[item.id as keyof typeof notificationCounts]}
                    variant="danger"
                    pulse={!!notificationCounts[item.id as keyof typeof notificationCounts]}
                    show={!!notificationCounts[item.id as keyof typeof notificationCounts]}
                    className={selectedBadges.has(item.id) ? 'badge-rotate-360' : ''}
                  >
                    <button
                      onClick={() => {
                        handleNavigate(item.id)
                        setShowMobileMenu(false)
                      }}
                      className={`
                        nav-button-mobile-item
                        flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-200
                        w-full text-left
                        min-h-[56px]
                        ${currentPage === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        active:scale-98 active:bg-blue-100
                      `}
                    >
                      <item.icon className="w-6 h-6 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </Badge>
                ))}

                {user ? (
                  <>
                    <hr className="my-3" />
                    
                    {/* Mobile Sign-out Status */}
                    {lastSignOutAttempt && !lastSignOutAttempt.success && (
                      <div className="mx-4 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-yellow-800">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Last sign-out failed. Try again or use diagnostic tool.</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        handleNavigate('profile')
                        setShowMobileMenu(false)
                      }}
                      className="
                        nav-button-mobile-item
                        flex items-center space-x-3 px-4 py-4 text-gray-600 
                        hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors
                        min-h-[56px]
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      "
                    >
                      <Settings className="w-6 h-6" />
                      <span className="font-medium">Profile</span>
                    </button>
                    
                    {/* Mobile Sign Out Message */}
                    {signOutMessage && (
                      <div className={`mx-4 my-2 p-3 rounded-lg text-sm ${
                        signOutMessage.includes('Successfully') 
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {signOutMessage}
                      </div>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      disabled={signOutLoading}
                      className="
                        nav-button-mobile-item
                        flex items-center space-x-3 px-4 py-4 text-red-600 
                        hover:bg-red-50 rounded-xl transition-colors
                        min-h-[56px]
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      {signOutLoading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          <div className="flex-1">
                            <span className="font-medium">Signing out...</span>
                            <div className="text-xs text-gray-500 mt-1">Please wait</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-6 h-6" />
                          <span className="font-medium">Sign Out</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <hr className="my-3" />
                    <button
                      onClick={() => {
                        handleAuthClick('login')
                        setShowMobileMenu(false)
                      }}
                      className="
                        nav-button-mobile-item
                        flex items-center space-x-3 px-4 py-4 text-gray-600 
                        hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors
                        min-h-[56px]
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      "
                    >
                      <User className="w-6 h-6" />
                      <span className="font-medium">Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAuthClick('signup')
                        setShowMobileMenu(false)
                      }}
                      className="
                        nav-button-mobile-item
                        flex items-center space-x-3 px-4 py-4 bg-blue-600 text-white 
                        rounded-xl transition-all duration-200
                        min-h-[56px]
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        active:scale-98 hover:bg-blue-700
                      "
                    >
                      <User className="w-6 h-6" />
                      <span className="font-medium">Sign Up</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Click outside to close menus */}
      {(showUserMenu || showMobileMenu) && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-25 backdrop-blur-sm"
          onClick={() => {
            setShowUserMenu(false)
            setShowMobileMenu(false)
          }}
        />
      )}

      {/* Global Sign Out Message */}
      {signOutMessage && !showUserMenu && !showMobileMenu && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${
            signOutMessage.includes('Successfully') 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {signOutMessage}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  )
}
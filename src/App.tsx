import React, { useState } from 'react'
import { AuthProvider } from './hooks/useAuth'
import { Navbar } from './components/Layout/Navbar'
import { HomePage } from './components/Home/HomePage'
import { RoutesPage } from './components/Routes/RoutesPage'
import { ProfilePage } from './components/Profile/ProfilePage'
import { ProcrastinationGenerator } from './components/Procrastination/ProcrastinationGenerator'
import { SavedProcrastinationRoutes } from './components/Procrastination/SavedProcrastinationRoutes'
import { BadgeExamples } from './components/UI/BadgeExamples'
import { SignOutDebugger } from './components/Debug/SignOutDebugger'
import { AuthCleaner } from './components/Auth/AuthCleaner'
import { AuthModal } from './components/Auth/AuthModal'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleNavigate = (page: string) => {
    if (page === 'auth') {
      setShowAuthModal(true)
    } else {
      setCurrentPage(page)
    }
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />
      case 'routes':
      case 'saved':
        return <RoutesPage />
      case 'profile':
        return <ProfilePage />
      case 'procrastination':
        return <ProcrastinationGenerator />
      case 'saved-procrastination':
        return <SavedProcrastinationRoutes />
      case 'badge-examples':
        return <BadgeExamples />
      case 'debug-signout':
        return <SignOutDebugger />
      case 'auth-cleaner':
        return <AuthCleaner />
      default:
        return <HomePage onNavigate={handleNavigate} />
    }
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        <main>
          {renderCurrentPage()}
        </main>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signup"
        />
        
        {/* Debug Helper - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 space-y-2">
            <button
              onClick={() => handleNavigate('debug-signout')}
              className="block px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg shadow-lg"
            >
              Debug Sign-out
            </button>
            <button
              onClick={() => handleNavigate('auth-cleaner')}
              className="block px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg shadow-lg"
            >
              Clear Auth Data
            </button>
          </div>
        )}
      </div>
    </AuthProvider>
  )
}

export default App
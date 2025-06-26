import React from 'react'

interface CorporateLoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CorporateLoadingSpinner({ 
  message = "Optimizing procrastination parameters...", 
  size = 'md' 
}: CorporateLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 corporate-detour-theme">
      <div className="relative mb-4">
        {/* Main Spinner */}
        <div className={`loading-procrastination ${sizeClasses[size]}`}></div>
        
        {/* Secondary Ring for Enhanced Effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-purple-200 rounded-full animate-pulse`}></div>
      </div>
      
      <p className="text-muted font-secondary text-center max-w-sm">
        {message}
      </p>
      
      {/* Satirical Progress Indicator */}
      <div className="mt-4 w-48">
        <div className="progress-hesitant">
          <div className="progress-bar-backwards"></div>
        </div>
        <p className="text-xs text-light text-center mt-2 font-secondary italic">
          Progress may appear to move backwards. This is intentional.
        </p>
      </div>
    </div>
  )
}
import React from 'react'
import { Coffee, Clock, Briefcase } from 'lucide-react'

interface CorporateDetourHeaderProps {
  title: string
  subtitle: string
  showIcons?: boolean
}

export function CorporateDetourHeader({ title, subtitle, showIcons = true }: CorporateDetourHeaderProps) {
  return (
    <div className="text-center mb-12 corporate-detour-theme">
      {showIcons && (
        <div className="flex justify-center items-center space-x-4 mb-6">
          {/* Melting Clock Icon */}
          <div className="icon-melting-clock hover-hesitate"></div>
          
          {/* Endless Coffee Steam */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg hover-hesitate">
            <div className="icon-endless-coffee">
              <Coffee className="w-6 h-6 text-white absolute inset-0 m-auto" />
            </div>
          </div>
          
          {/* Briefcase with Vacation Items */}
          <div className="relative hover-hesitate">
            <Briefcase className="w-8 h-8 text-gray-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>
      )}
      
      <h1 className="text-h1 font-primary font-bold text-gray-900 mb-4 hover-hesitate">
        {title}
      </h1>
      
      {/* Witty Tagline */}
      <div className="tagline-corporate mb-6">
        "Turning procrastination into a precision science — because amateur avoidance is so unprofessional."
      </div>
      
      <p className="text-xl text-muted font-secondary">
        {subtitle}
      </p>
      
      <div className="productivity-mockery text-center mt-6">
        "Efficiency is doing things right; effectiveness is doing the right things. 
        We specialize in doing neither, but with style."
      </div>
    </div>
  )
}
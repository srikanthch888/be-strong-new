import React, { useState } from 'react'
import { Clock, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { ProcrastinationStep } from '../../lib/supabase'

interface ProcrastinationStepCardProps {
  step: ProcrastinationStep
  index: number
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function ProcrastinationStepCard({ 
  step, 
  index, 
  isExpanded = false, 
  onToggleExpand 
}: ProcrastinationStepCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className="card-procrastination hover-hesitate click-delay"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-4">
        {/* Step Number with Satirical Badge */}
        <div className="relative">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
            {index + 1}
          </div>
          <div className="ironic-badge absolute -top-2 -right-2 transform rotate-12">
            Pro
          </div>
        </div>
        
        <div className="flex-1">
          {/* Step Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-h3 font-primary font-bold text-gray-900">
              {step.name}
            </h3>
            <div className="flex items-center space-x-3">
              {/* Time Investment with Hesitant Animation */}
              <div className="flex items-center space-x-1 text-purple-600 bg-purple-50 px-3 py-2 rounded-full hover-hesitate">
                <div className="icon-melting-clock w-4 h-4"></div>
                <span className="text-sm font-medium font-secondary">{step.timeInvestment}</span>
              </div>
              
              {/* Expand/Collapse Button */}
              {onToggleExpand && (
                <button
                  onClick={onToggleExpand}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all duration-300"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
          
          {/* Step Description */}
          <div className={`transition-all duration-500 overflow-hidden ${
            isExpanded ? 'max-h-none' : 'max-h-20'
          }`}>
            <p className="text-body font-primary text-gray-700 mb-4 leading-relaxed">
              {step.description}
            </p>
          </div>
          
          {/* Benefit Section with Satirical Styling */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-purple-500 p-4 rounded-r-xl relative overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="w-full h-full" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(43, 76, 126, 0.1) 10px, rgba(43, 76, 126, 0.1) 20px)`
              }}></div>
            </div>
            
            <div className="relative flex items-start space-x-2">
              <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-purple-700 font-medium font-secondary">
                <span className="font-bold text-purple-800">Strategic Benefit:</span> {step.benefit}
              </p>
            </div>
          </div>
          
          {/* Progress Bar that Moves Backwards */}
          {isHovered && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Productivity Level</span>
                <span>Optimally Inefficient</span>
              </div>
              <div className="progress-hesitant">
                <div className="progress-bar-backwards"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
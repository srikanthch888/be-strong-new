import React, { useState } from 'react'
import { Save, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, ProcrastinationStep } from '../../lib/supabase'
import { CorporateDetourHeader } from './CorporateDetourHeader'
import { ProcrastinationStepCard } from './ProcrastinationStepCard'
import { CorporateLoadingSpinner } from './CorporateLoadingSpinner'
import '../../styles/design-system.css'

export function ProcrastinationGenerator() {
  const { user } = useAuth()
  const [task, setTask] = useState('')
  const [generatedRoute, setGeneratedRoute] = useState<ProcrastinationStep[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isRouteSaved, setIsRouteSaved] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const generateProcrastinationRoute = () => {
    if (!task.trim()) return

    setIsGenerating(true)
    
    // Extended delay for satirical effect
    setTimeout(() => {
      const routes = generateRouteSteps(task)
      setGeneratedRoute(routes)
      setIsGenerating(false)
      setIsRouteSaved(false)
      setSaveMessage('')
      setExpandedSteps(new Set())
    }, 2500)
  }

  const generateRouteSteps = (userTask: string): ProcrastinationStep[] => {
    const taskLower = userTask.toLowerCase()
    
    const baseRoutes = [
      {
        name: "Comprehensive Workspace Ergonomics Assessment",
        description: "Conduct a 47-point evaluation of your desk setup including monitor height calculations using the golden ratio, keyboard angle measurements with a protractor, and chair height optimization through systematic 0.5cm adjustments while documenting each change in a color-coded spreadsheet with pivot tables for future analysis.",
        timeInvestment: "2.5 hours",
        benefit: "Achieves optimal productivity posture for tackling challenging tasks with unprecedented efficiency."
      },
      {
        name: "Email Organization Architecture Overhaul",
        description: "Create a sophisticated 12-tier folder hierarchy system, establish 47 custom email rules with Boolean logic operators, retroactively categorize every email from the past 3 years using advanced machine learning principles, and design a personal email charter with response time protocols and signature font psychology analysis.",
        timeInvestment: "4 hours",
        benefit: "Eliminates digital clutter that clearly blocks creative thinking and innovative problem-solving capabilities."
      },
      {
        name: "Strategic Snack Inventory Management System",
        description: "Catalog all kitchen contents by nutritional value, expiration date, and motivational potential using a proprietary scoring algorithm. Create a meal planning system that optimizes brain food consumption for peak performance, including a 15-page analysis of optimal coffee brewing temperatures with scientific citations.",
        timeInvestment: "1.5 hours",
        benefit: "Ensures proper fuel for sustained focus on important projects while maximizing cognitive enhancement potential."
      },
      {
        name: "Deep Research Rabbit Hole Expedition",
        description: "Begin with a 'quick' fact-check about your task, evolve into reading 37 Wikipedia articles about tangentially related topics, watch 14 YouTube videos about productivity techniques from thought leaders, and create a comprehensive mind map connecting everything you've learned with color-coded relationship indicators.",
        timeInvestment: "3.2 hours",
        benefit: "Builds comprehensive background knowledge essential for informed decision-making and contextual understanding."
      },
      {
        name: "Social Media Competitive Intelligence Analysis",
        description: "Systematically review how industry peers are handling similar challenges by scrolling through all major platforms, analyzing their success patterns with statistical rigor, screenshot inspirational quotes for motivation database, and create a vision board of aspirational productivity aesthetics using design thinking principles.",
        timeInvestment: "2.8 hours",
        benefit: "Gathers crucial market intelligence and motivational resources for strategic advantage implementation."
      },
      {
        name: "Digital Tool Optimization Audit",
        description: "Research and test 23 new productivity apps, create detailed feature comparison matrices, migrate data between systems for optimal workflow integration, customize notification settings for maximum efficiency, and establish a personal SOP manual for tool utilization with version control.",
        timeInvestment: "3.7 hours",
        benefit: "Streamlines technological infrastructure to eliminate friction in future high-priority task execution."
      }
    ]

    // Add task-specific variations with enhanced satirical elements
    if (taskLower.includes('write') || taskLower.includes('essay') || taskLower.includes('report')) {
      baseRoutes.push({
        name: "Literary Inspiration Archaeological Expedition",
        description: "Research advanced writing techniques by reading 23 articles about productivity science, reorganize digital bookmarks into a taxonomic system worthy of Library of Congress standards, test 7 different writing applications with detailed feature matrices and performance benchmarks, and create the perfect Spotify playlist for creative flow states using neuroscience principles.",
        timeInvestment: "3.5 hours",
        benefit: "Establishes optimal creative environment for breakthrough insights and revolutionary thought leadership content."
      })
    }

    if (taskLower.includes('study') || taskLower.includes('exam') || taskLower.includes('learn')) {
      baseRoutes.push({
        name: "Neuroplasticity Enhancement Protocol Development",
        description: "Research the latest peer-reviewed studies on learning efficiency and memory consolidation, reorganize all study materials by color psychology and information architecture principles, create a complex scheduling system with 15-minute intervals optimized for circadian rhythms, and design custom flashcards with advanced typography and cognitive psychology applications.",
        timeInvestment: "2.8 hours",
        benefit: "Optimizes neural pathways for accelerated information retention and enhanced cognitive performance metrics."
      })
    }

    if (taskLower.includes('clean') || taskLower.includes('organize')) {
      baseRoutes.push({
        name: "Zen Master Space Clearing Meditation Protocol",
        description: "Read extensively about Marie Kondo's philosophy and spatial psychology research, watch minimalism documentaries for cultural context, create a detailed floor plan with precise measurements and feng shui analysis, research storage solutions for 2 hours using comparative shopping methodology, and develop a 12-step decluttering framework with photographic documentation and progress metrics.",
        timeInvestment: "4.2 hours",
        benefit: "Achieves enlightened understanding of spatial harmony principles for maximum environmental productivity enhancement."
      })
    }

    // Return 3-5 random routes with weighted selection
    const shuffled = baseRoutes.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.floor(Math.random() * 3) + 3)
  }

  const saveRoute = async () => {
    if (!user || !generatedRoute.length || !task.trim()) {
      setSaveMessage('Please log in and generate a route first.')
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const { error } = await supabase
        .from('saved_procrastination_routes')
        .insert({
          user_id: user.id,
          original_task: task.trim(),
          route_steps: generatedRoute
        })

      if (error) throw error

      setIsRouteSaved(true)
      setSaveMessage('Route saved successfully! Your procrastination strategy is now preserved for posterity.')
    } catch (error: any) {
      console.error('Error saving route:', error)
      setSaveMessage('Failed to save route. Even our procrastination system is procrastinating.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStepExpansion = (index: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <div className="max-w-5xl mx-auto p-6 corporate-detour-theme">
      <CorporateDetourHeader
        title="The Optimal Procrastination Route Planner"
        subtitle="Transform avoidance into an art form with scientifically-backed inefficiency strategies"
      />

      {/* Input Section with Corporate Styling */}
      <div className="card-corporate mb-8">
        <label className="block text-h3 font-primary font-medium text-gray-700 mb-4">
          What critical task demands your immediate avoidance today?
        </label>
        <div className="space-y-4">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g., Quarterly performance review, Annual tax preparation, Thesis chapter completion..."
            className="input-corporate text-lg"
            onKeyDown={(e) => e.key === 'Enter' && generateProcrastinationRoute()}
          />
          <button
            onClick={generateProcrastinationRoute}
            disabled={!task.trim() || isGenerating}
            className="btn-primary w-full text-lg py-4 hover-hesitate click-delay"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center space-x-3">
                <div className="loading-procrastination"></div>
                <span>Architecting Your Procrastination Methodology...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <span>Generate My Strategic Avoidance Plan</span>
              </span>
            )}
          </button>
        </div>
        
        <div className="productivity-mockery mt-4 text-sm">
          * Results optimized for maximum time displacement with minimal guilt accumulation
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <CorporateLoadingSpinner 
          message="Calibrating optimal procrastination parameters using advanced behavioral psychology algorithms..."
          size="lg"
        />
      )}

      {/* Generated Route */}
      {generatedRoute.length > 0 && !isGenerating && (
        <div className="card-corporate">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-h2 font-primary font-bold text-gray-900">
                Your Strategically Optimized Procrastination Route
              </h2>
              <p className="text-muted font-secondary mt-2">
                Scientifically designed to maximize productivity theater while minimizing actual progress
              </p>
            </div>
            
            {user && (
              <button
                onClick={saveRoute}
                disabled={isSaving || isRouteSaved}
                className={`btn-secondary hover-hesitate click-delay ${
                  isRouteSaved ? 'status-completed' : isSaving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="flex items-center space-x-2">
                  {isSaving ? (
                    <div className="loading-procrastination w-4 h-4"></div>
                  ) : isRouteSaved ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {isRouteSaved ? 'Route Archived!' : isSaving ? 'Archiving...' : 'Save Route'}
                  </span>
                </span>
              </button>
            )}
          </div>

          {saveMessage && (
            <div className={`mb-6 p-4 rounded-xl flex items-center space-x-2 ${
              saveMessage.includes('success') || saveMessage.includes('saved')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <AlertCircle className="w-5 h-5" />
              <span className="font-secondary">{saveMessage}</span>
            </div>
          )}

          <div className="space-y-6">
            {generatedRoute.map((step, index) => (
              <ProcrastinationStepCard
                key={index}
                step={step}
                index={index}
                isExpanded={expandedSteps.has(index)}
                onToggleExpand={() => toggleStepExpansion(index)}
              />
            ))}
          </div>

          {/* Satirical Footer */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 rounded-xl border-2 border-purple-200 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-gradient-to-r from-purple-400 via-blue-400 to-green-400"></div>
            </div>
            <div className="relative text-center">
              <p className="text-purple-700 font-secondary italic text-lg mb-2">
                "The art of procrastination is to put off until tomorrow what you shouldn't do today either."
              </p>
              <p className="text-sm text-gray-600 font-primary">
                — Corporate Detour Productivity Institute
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
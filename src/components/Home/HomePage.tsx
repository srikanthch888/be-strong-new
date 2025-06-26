import React, { useState } from 'react'
import { Activity, MapPin, Users, Award, ArrowRight, Star } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface HomePageProps {
  onNavigate: (page: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { user } = useAuth()
  const [boltBadgeRotating, setBoltBadgeRotating] = useState(false)

  const handleBoltBadgeClick = () => {
    setBoltBadgeRotating(true)
    setTimeout(() => setBoltBadgeRotating(false), 800)
  }

  const features = [
    {
      icon: MapPin,
      title: 'Discover Routes',
      description: 'Explore curated fitness routes for running, walking, and cycling'
    },
    {
      icon: Activity,
      title: 'Track Progress',
      description: 'Monitor your fitness journey with detailed activity tracking'
    },
    {
      icon: Users,
      title: 'Join Community',
      description: 'Connect with fellow fitness enthusiasts and share your achievements'
    },
    {
      icon: Award,
      title: 'Earn Rewards',
      description: 'Complete challenges and unlock achievements for your dedication'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Marathon Runner',
      content: 'Strong Strong helped me discover amazing running routes I never knew existed in my city.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Fitness Enthusiast',
      content: 'The route tracking and progress monitoring features keep me motivated every day.',
      rating: 5
    },
    {
      name: 'Emma Davis',
      role: 'Cyclist',
      content: 'Perfect for finding safe cycling routes. The community recommendations are spot-on.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {/* Bolt.new Badge with Rotation */}
      <a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleBoltBadgeClick}
        className="bolt-badge"
        aria-label="Powered by Bolt.new - Visit Bolt.new"
      >
        <img
          src="/black_circle_360x360.png"
          alt="Powered by Bolt.new"
          className={`bolt-badge-image ${boltBadgeRotating ? 'rotate-360' : ''}`}
        />
        <span className="sr-only">Powered by Bolt.new</span>
      </a>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
                <Activity className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Your Fitness Journey
              <span className="block text-blue-600">Starts Here</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Discover amazing fitness routes, track your progress, and join a community of 
              athletes pushing their limits every day.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('routes')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Explore Routes</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              {!user && (
                <button
                  onClick={() => onNavigate('auth')}
                  className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg border border-gray-200 hover:shadow-xl transform hover:scale-105"
                >
                  Join Now
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Stay Strong
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and features designed to support your fitness goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="bg-blue-100 p-4 rounded-xl inline-block mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Join Thousands of Active Users
            </h2>
            <p className="text-xl text-blue-100">
              Be part of a growing community committed to fitness excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">10K+</div>
              <div className="text-blue-100 text-lg">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-100 text-lg">Fitness Routes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">1M+</div>
              <div className="text-blue-100 text-lg">Miles Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real athletes achieving their goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-500 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Fitness Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join Strong Strong today and discover your strongest self
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <button
                onClick={() => onNavigate('auth')}
                className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started Free
              </button>
            ) : (
              <button
                onClick={() => onNavigate('routes')}
                className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Start Exploring</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
import React, { useState } from 'react'
import { Badge, NotificationBadge, StatusBadge } from './Badge'
import { Mail, ShoppingCart, MessageCircle, Bell, User } from 'lucide-react'

export function BadgeExamples() {
  const [notificationCount, setNotificationCount] = useState(5)
  const [showDotBadge, setShowDotBadge] = useState(true)
  const [userStatus, setUserStatus] = useState<'online' | 'offline' | 'busy' | 'away'>('online')

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Badge Component Examples</h1>
        <p className="text-gray-600">Demonstrating various badge implementations with animations and accessibility</p>
      </div>

      {/* Basic Number Badges */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Number Badges</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <Badge content={3}>
            <Mail className="w-8 h-8 text-gray-600" />
          </Badge>
          
          <Badge content={12} variant="danger">
            <Bell className="w-8 h-8 text-gray-600" />
          </Badge>
          
          <Badge content={99} variant="warning">
            <ShoppingCart className="w-8 h-8 text-gray-600" />
          </Badge>
          
          <Badge content={150} max={99} variant="success">
            <MessageCircle className="w-8 h-8 text-gray-600" />
          </Badge>
        </div>
      </section>

      {/* Dot Indicators */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Status Dot Indicators</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <Badge variant="primary" show={showDotBadge}>
            <User className="w-8 h-8 text-gray-600" />
          </Badge>
          
          <StatusBadge status={userStatus}>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
          </StatusBadge>
          
          <Badge variant="danger" pulse>
            <Bell className="w-8 h-8 text-gray-600" />
          </Badge>
        </div>
        
        <div className="mt-4 space-x-2">
          <button
            onClick={() => setShowDotBadge(!showDotBadge)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
          >
            Toggle Dot Badge
          </button>
          <select
            value={userStatus}
            onChange={(e) => setUserStatus(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="busy">Busy</option>
            <option value="away">Away</option>
          </select>
        </div>
      </section>

      {/* Pulse Animations */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Pulse Animations</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <NotificationBadge count={notificationCount}>
            <Bell className="w-8 h-8 text-gray-600" />
          </NotificationBadge>
          
          <Badge content={8} variant="danger" pulse>
            <MessageCircle className="w-8 h-8 text-gray-600" />
          </Badge>
          
          <Badge content="NEW" variant="warning" pulse>
            <ShoppingCart className="w-8 h-8 text-gray-600" />
          </Badge>
        </div>
        
        <div className="mt-4 space-x-2">
          <button
            onClick={() => setNotificationCount(prev => Math.max(0, prev - 1))}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm"
          >
            Decrease ({notificationCount})
          </button>
          <button
            onClick={() => setNotificationCount(prev => prev + 1)}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
          >
            Increase ({notificationCount})
          </button>
        </div>
      </section>

      {/* Color Variants */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Color Variants</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {['primary', 'danger', 'warning', 'success', 'info'].map((variant) => (
            <div key={variant} className="text-center">
              <Badge content={5} variant={variant as any}>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                  <Bell className="w-6 h-6 text-gray-600" />
                </div>
              </Badge>
              <p className="text-sm text-gray-600 capitalize">{variant}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Text Badges */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Text Badges</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <Badge content="NEW" variant="danger">
            <div className="px-4 py-2 bg-gray-100 rounded-lg">Product Feature</div>
          </Badge>
          
          <Badge content="HOT" variant="warning" pulse>
            <div className="px-4 py-2 bg-gray-100 rounded-lg">Trending Topic</div>
          </Badge>
          
          <Badge content="VIP" variant="success">
            <div className="px-4 py-2 bg-gray-100 rounded-lg">User Account</div>
          </Badge>
        </div>
      </section>

      {/* Dark Background Example */}
      <section className="bg-gray-900 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">On Dark Backgrounds</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <Badge content={7} variant="primary">
            <Mail className="w-8 h-8 text-white" />
          </Badge>
          
          <Badge content={23} variant="danger" pulse>
            <Bell className="w-8 h-8 text-white" />
          </Badge>
          
          <Badge variant="success">
            <User className="w-8 h-8 text-white" />
          </Badge>
        </div>
      </section>

      {/* Accessibility Information */}
      <section className="bg-blue-50 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">Accessibility Features</h2>
        <ul className="space-y-2 text-blue-800">
          <li>• ARIA labels automatically generated based on content</li>
          <li>• Screen reader announcements with role="status" and aria-live="polite"</li>
          <li>• High contrast mode support</li>
          <li>• Reduced motion support for users with vestibular disorders</li>
          <li>• Keyboard focus indicators when badges are interactive</li>
          <li>• Consistent 8px spacing from parent element edges</li>
        </ul>
      </section>
    </div>
  )
}
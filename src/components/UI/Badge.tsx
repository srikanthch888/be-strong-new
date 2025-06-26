import React from 'react'

export interface BadgeProps {
  /** Content to display - number, text, or undefined for dot indicator */
  content?: number | string
  /** Whether to show the badge */
  show?: boolean
  /** Badge variant for different use cases */
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info'
  /** Enable pulse animation for urgent notifications */
  pulse?: boolean
  /** Maximum number to display before showing "99+" */
  max?: number
  /** Additional CSS classes */
  className?: string
  /** Child element to attach badge to */
  children?: React.ReactNode
  /** Custom ARIA label for accessibility */
  ariaLabel?: string
}

export function Badge({
  content,
  show = true,
  variant = 'primary',
  pulse = false,
  max = 99,
  className = '',
  children,
  ariaLabel
}: BadgeProps) {
  // Don't render if explicitly hidden
  if (!show) {
    return children ? <div className="badge-container">{children}</div> : null
  }

  // Determine display content
  const getDisplayContent = () => {
    if (content === undefined || content === null) {
      return null // Show dot indicator
    }
    
    if (typeof content === 'number') {
      if (content <= 0) return null
      if (content > max) return `${max}+`
      return content.toString()
    }
    
    return content.toString()
  }

  const displayContent = getDisplayContent()
  const isDot = displayContent === null
  
  // Generate ARIA label
  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel
    
    if (isDot) return 'New notification'
    if (typeof content === 'number') {
      if (content === 1) return '1 notification'
      if (content > max) return `More than ${max} notifications`
      return `${content} notifications`
    }
    return `Notification: ${content}`
  }

  const badgeElement = (
    <span
      className={`
        ui-badge
        ui-badge--${variant}
        ${isDot ? 'ui-badge--dot' : 'ui-badge--content'}
        ${pulse ? 'ui-badge--pulse' : ''}
        ${className}
      `}
      role="status"
      aria-label={getAriaLabel()}
      aria-live="polite"
    >
      {!isDot && (
        <span className="ui-badge__text" aria-hidden="true">
          {displayContent}
        </span>
      )}
    </span>
  )

  // If no children, return just the badge
  if (!children) {
    return badgeElement
  }

  // Return container with children and positioned badge
  return (
    <div className="badge-container">
      {children}
      {badgeElement}
    </div>
  )
}

// Convenience components for common use cases
export function NotificationBadge({ count, ...props }: Omit<BadgeProps, 'content'> & { count?: number }) {
  return (
    <Badge
      content={count}
      variant="danger"
      pulse={count ? count > 0 : false}
      ariaLabel={count ? `${count} unread notifications` : 'New notification'}
      {...props}
    />
  )
}

export function StatusBadge({ status, ...props }: Omit<BadgeProps, 'content' | 'variant'> & { status: 'online' | 'offline' | 'busy' | 'away' }) {
  const variantMap = {
    online: 'success' as const,
    offline: 'info' as const,
    busy: 'danger' as const,
    away: 'warning' as const
  }

  return (
    <Badge
      variant={variantMap[status]}
      ariaLabel={`Status: ${status}`}
      {...props}
    />
  )
}
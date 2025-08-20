/**
 * Session security monitoring and validation
 */

import type { Session } from '@supabase/supabase-js'

export interface SecurityEvent {
  type: 'suspicious_activity' | 'session_expired' | 'concurrent_session' | 'location_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface SessionSecurityCheck {
  isSecure: boolean
  events: SecurityEvent[]
  recommendedActions: string[]
}

/**
 * Validates session security and detects potential issues
 */
export function validateSessionSecurity(
  session: Session | null,
  lastActivity?: Date,
  userAgent?: string,
  ipAddress?: string
): SessionSecurityCheck {
  const events: SecurityEvent[] = []
  const recommendedActions: string[] = []

  if (!session) {
    return {
      isSecure: false,
      events: [
        {
          type: 'session_expired',
          severity: 'medium',
          message: 'No valid session found',
          timestamp: new Date(),
        },
      ],
      recommendedActions: ['Please sign in again'],
    }
  }

  const now = new Date()
  // Calculate session age from access token creation (approximation)
  const sessionAge = session.access_token
    ? now.getTime() - new Date((session.expires_at ?? 0) * 1000 - 3600 * 1000).getTime()
    : 0
  const lastActivityAge = lastActivity ? now.getTime() - lastActivity.getTime() : 0

  // Check session age (older than 24 hours is suspicious)
  if (sessionAge > 24 * 60 * 60 * 1000) {
    events.push({
      type: 'session_expired',
      severity: 'high',
      message: 'Session is very old',
      timestamp: now,
      metadata: { sessionAge: sessionAge / 1000 / 60 / 60 }, // hours
    })
    recommendedActions.push('Consider refreshing your session')
  }

  // Check inactivity period (longer than 2 hours without activity)
  if (lastActivity && lastActivityAge > 2 * 60 * 60 * 1000) {
    events.push({
      type: 'suspicious_activity',
      severity: 'medium',
      message: 'Long period of inactivity detected',
      timestamp: now,
      metadata: { inactivityHours: lastActivityAge / 1000 / 60 / 60 },
    })
    recommendedActions.push('Verify recent account activity')
  }

  // Check token expiry
  const expiresAt = new Date((session.expires_at ?? 0) * 1000)
  const timeToExpiry = expiresAt.getTime() - now.getTime()

  if (timeToExpiry < 5 * 60 * 1000) {
    // Less than 5 minutes to expiry
    events.push({
      type: 'session_expired',
      severity: 'high',
      message: 'Session will expire soon',
      timestamp: now,
      metadata: { minutesToExpiry: timeToExpiry / 1000 / 60 },
    })
    recommendedActions.push('Session refresh required')
  } else if (timeToExpiry < 30 * 60 * 1000) {
    // Less than 30 minutes to expiry
    events.push({
      type: 'session_expired',
      severity: 'medium',
      message: 'Session approaching expiry',
      timestamp: now,
      metadata: { minutesToExpiry: timeToExpiry / 1000 / 60 },
    })
    recommendedActions.push('Consider refreshing session soon')
  }

  // Basic user agent validation (if provided)
  if (userAgent !== undefined && userAgent !== '' && userAgent.length > 500) {
    events.push({
      type: 'suspicious_activity',
      severity: 'low',
      message: 'Unusual user agent detected',
      timestamp: now,
      metadata: { userAgentLength: userAgent.length },
    })
  }

  // IP address validation (basic check if provided)
  if (ipAddress !== undefined && ipAddress !== '') {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

    if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
      events.push({
        type: 'suspicious_activity',
        severity: 'medium',
        message: 'Invalid IP address format detected',
        timestamp: now,
        metadata: { ipAddress },
      })
    }
  }

  const criticalEvents = events.filter(e => e.severity === 'critical')
  const highSeverityEvents = events.filter(e => e.severity === 'high')

  return {
    isSecure: criticalEvents.length === 0 && highSeverityEvents.length === 0,
    events,
    recommendedActions,
  }
}

/**
 * Creates a security report for logging/monitoring
 */
export function createSecurityReport(userId: string, sessionCheck: SessionSecurityCheck): string {
  const timestamp = new Date().toISOString()
  const eventSummary = sessionCheck.events
    .map(event => `${event.severity.toUpperCase()}: ${event.message}`)
    .join('; ')

  return `[${timestamp}] User ${userId} - Security Status: ${
    sessionCheck.isSecure ? 'SECURE' : 'INSECURE'
  }. Events: ${eventSummary || 'None'}. Actions: ${sessionCheck.recommendedActions.join(', ') || 'None'}`
}

/**
 * Checks for suspicious patterns in user activity
 */
export function detectSuspiciousActivity(
  recentActions: Array<{
    action: string
    timestamp: Date
    success: boolean
    metadata?: Record<string, unknown>
  }>
): SecurityEvent[] {
  const events: SecurityEvent[] = []
  const now = new Date()

  // Check for rapid repeated failures
  const recentFailures = recentActions.filter(
    action => !action.success && now.getTime() - action.timestamp.getTime() < 15 * 60 * 1000 // 15 minutes
  )

  if (recentFailures.length >= 5) {
    events.push({
      type: 'suspicious_activity',
      severity: 'high',
      message: 'Multiple failed attempts detected',
      timestamp: now,
      metadata: { failureCount: recentFailures.length },
    })
  }

  // Check for unusual activity patterns (e.g., too many actions in short time)
  const recentSuccesses = recentActions.filter(
    action => action.success && now.getTime() - action.timestamp.getTime() < 5 * 60 * 1000 // 5 minutes
  )

  if (recentSuccesses.length >= 20) {
    events.push({
      type: 'suspicious_activity',
      severity: 'medium',
      message: 'Unusually high activity detected',
      timestamp: now,
      metadata: { actionCount: recentSuccesses.length },
    })
  }

  return events
}

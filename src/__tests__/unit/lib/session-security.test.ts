import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from '@supabase/supabase-js'

import {
  validateSessionSecurity,
  createSecurityReport,
  detectSuspiciousActivity,
  type SecurityEvent,
  type SessionSecurityCheck,
} from '@/lib/session-security'

// Mock current date for consistent testing
const mockNow = new Date('2024-01-15T12:00:00Z')

describe('Session Security', () => {
  beforeEach(() => {
    vi.setSystemTime(mockNow)
  })

  describe('validateSessionSecurity', () => {
    it('should return insecure status for null session', () => {
      const result = validateSessionSecurity(null)

      expect(result.isSecure).toBe(false)
      expect(result.events).toHaveLength(1)
      expect(result.events[0]).toEqual({
        type: 'session_expired',
        severity: 'medium',
        message: 'No valid session found',
        timestamp: mockNow,
      })
      expect(result.recommendedActions).toEqual(['Please sign in again'])
    })

    it('should return secure status for valid fresh session', () => {
      const futureExpiry = Math.floor((mockNow.getTime() + 2 * 60 * 60 * 1000) / 1000) // 2 hours from now
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        expires_at: futureExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      const result = validateSessionSecurity(session)

      expect(result.isSecure).toBe(true)
      expect(result.events).toHaveLength(0)
      expect(result.recommendedActions).toHaveLength(0)
    })

    it('should detect very old session as high risk', () => {
      const oldExpiry = Math.floor((mockNow.getTime() + 2 * 60 * 60 * 1000) / 1000) // 2 hours from now
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        expires_at: oldExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      // Mock a session that's much older than 24 hours
      // Session age is calculated as now - (expires_at - 1 hour)
      const veryOldExpiry = Math.floor((mockNow.getTime() - 25 * 60 * 60 * 1000 + 60 * 60 * 1000) / 1000)
      session.expires_at = veryOldExpiry

      const result = validateSessionSecurity(session)

      expect(result.isSecure).toBe(false)
      expect(result.events.some(e => e.type === 'session_expired' && e.severity === 'high')).toBe(true)
      expect(result.events.some(e => e.message === 'Session is very old')).toBe(true)
      expect(result.recommendedActions).toContain('Consider refreshing your session')
    })

    it('should detect long inactivity period', () => {
      const futureExpiry = Math.floor((mockNow.getTime() + 2 * 60 * 60 * 1000) / 1000)
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        expires_at: futureExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      // Last activity was 3 hours ago (more than 2 hour threshold)
      const lastActivity = new Date(mockNow.getTime() - 3 * 60 * 60 * 1000)

      const result = validateSessionSecurity(session, lastActivity)

      expect(result.events.some(e => 
        e.type === 'suspicious_activity' && 
        e.severity === 'medium' &&
        e.message === 'Long period of inactivity detected'
      )).toBe(true)
      expect(result.recommendedActions).toContain('Verify recent account activity')
    })

    it('should detect session expiring soon (less than 5 minutes)', () => {
      // Session expires in 3 minutes
      const soonExpiry = Math.floor((mockNow.getTime() + 3 * 60 * 1000) / 1000)
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 180,
        expires_at: soonExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      const result = validateSessionSecurity(session)

      expect(result.isSecure).toBe(false)
      expect(result.events.some(e => 
        e.type === 'session_expired' && 
        e.severity === 'high' &&
        e.message === 'Session will expire soon'
      )).toBe(true)
      expect(result.recommendedActions).toContain('Session refresh required')
    })

    it('should detect session approaching expiry (less than 30 minutes)', () => {
      // Session expires in 15 minutes
      const approachingExpiry = Math.floor((mockNow.getTime() + 15 * 60 * 1000) / 1000)
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 900,
        expires_at: approachingExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      const result = validateSessionSecurity(session)

      expect(result.events.some(e => 
        e.type === 'session_expired' && 
        e.severity === 'medium' &&
        e.message === 'Session approaching expiry'
      )).toBe(true)
      expect(result.recommendedActions).toContain('Consider refreshing session soon')
    })

    it('should detect unusual user agent', () => {
      const futureExpiry = Math.floor((mockNow.getTime() + 2 * 60 * 60 * 1000) / 1000)
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        expires_at: futureExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      // Create a very long user agent (over 500 characters)
      const longUserAgent = 'A'.repeat(501)

      const result = validateSessionSecurity(session, undefined, longUserAgent)

      expect(result.events.some(e => 
        e.type === 'suspicious_activity' && 
        e.severity === 'low' &&
        e.message === 'Unusual user agent detected'
      )).toBe(true)
    })

    it('should detect invalid IP address format', () => {
      const futureExpiry = Math.floor((mockNow.getTime() + 2 * 60 * 60 * 1000) / 1000)
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        expires_at: futureExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      const result = validateSessionSecurity(session, undefined, undefined, 'invalid-ip')

      expect(result.events.some(e => 
        e.type === 'suspicious_activity' && 
        e.severity === 'medium' &&
        e.message === 'Invalid IP address format detected'
      )).toBe(true)
    })

    it('should accept valid IPv4 address', () => {
      const futureExpiry = Math.floor((mockNow.getTime() + 2 * 60 * 60 * 1000) / 1000)
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        expires_at: futureExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      const result = validateSessionSecurity(session, undefined, undefined, '192.168.1.1')

      expect(result.events.some(e => e.message.includes('Invalid IP address'))).toBe(false)
    })

    it('should accept valid IPv6 address', () => {
      const futureExpiry = Math.floor((mockNow.getTime() + 2 * 60 * 60 * 1000) / 1000)
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        expires_at: futureExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      const result = validateSessionSecurity(session, undefined, undefined, '2001:db8::1')

      expect(result.events.some(e => e.message.includes('Invalid IP address'))).toBe(false)
    })

    it('should handle empty string parameters gracefully', () => {
      const futureExpiry = Math.floor((mockNow.getTime() + 2 * 60 * 60 * 1000) / 1000)
      const session: Session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        expires_at: futureExpiry,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      }

      const result = validateSessionSecurity(session, undefined, '', '')

      expect(result.isSecure).toBe(true)
      expect(result.events).toHaveLength(0)
    })

    it('should handle session without expires_at', () => {
      const session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 7200,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
        },
      } as Session

      const result = validateSessionSecurity(session)

      // Should not crash and should handle gracefully
      expect(result).toBeDefined()
      expect(result.isSecure).toBeDefined()
    })
  })

  describe('createSecurityReport', () => {
    it('should create report for secure session', () => {
      const sessionCheck: SessionSecurityCheck = {
        isSecure: true,
        events: [],
        recommendedActions: [],
      }

      const report = createSecurityReport('user123', sessionCheck)

      expect(report).toContain('User user123')
      expect(report).toContain('Security Status: SECURE')
      expect(report).toContain('Events: None')
      expect(report).toContain('Actions: None')
    })

    it('should create report for insecure session with events', () => {
      const sessionCheck: SessionSecurityCheck = {
        isSecure: false,
        events: [
          {
            type: 'session_expired',
            severity: 'high',
            message: 'Session expired',
            timestamp: mockNow,
          },
          {
            type: 'suspicious_activity',
            severity: 'medium',
            message: 'Unusual activity detected',
            timestamp: mockNow,
          },
        ],
        recommendedActions: ['Refresh session', 'Verify identity'],
      }

      const report = createSecurityReport('user456', sessionCheck)

      expect(report).toContain('User user456')
      expect(report).toContain('Security Status: INSECURE')
      expect(report).toContain('HIGH: Session expired')
      expect(report).toContain('MEDIUM: Unusual activity detected')
      expect(report).toContain('Actions: Refresh session, Verify identity')
    })
  })

  describe('detectSuspiciousActivity', () => {
    it('should detect multiple failed attempts', () => {
      const recentActions = [
        { action: 'login', timestamp: new Date(mockNow.getTime() - 5 * 60 * 1000), success: false },
        { action: 'login', timestamp: new Date(mockNow.getTime() - 4 * 60 * 1000), success: false },
        { action: 'login', timestamp: new Date(mockNow.getTime() - 3 * 60 * 1000), success: false },
        { action: 'login', timestamp: new Date(mockNow.getTime() - 2 * 60 * 1000), success: false },
        { action: 'login', timestamp: new Date(mockNow.getTime() - 1 * 60 * 1000), success: false },
      ]

      const events = detectSuspiciousActivity(recentActions)

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        type: 'suspicious_activity',
        severity: 'high',
        message: 'Multiple failed attempts detected',
        timestamp: mockNow,
        metadata: { failureCount: 5 },
      })
    })

    it('should detect unusually high activity', () => {
      const recentActions = Array.from({ length: 20 }, (_, i) => ({
        action: 'api_call',
        timestamp: new Date(mockNow.getTime() - i * 10 * 1000), // 10 seconds apart
        success: true,
      }))

      const events = detectSuspiciousActivity(recentActions)

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        type: 'suspicious_activity',
        severity: 'medium',
        message: 'Unusually high activity detected',
        timestamp: mockNow,
        metadata: { actionCount: 20 },
      })
    })

    it('should return empty array for normal activity', () => {
      const recentActions = [
        { action: 'login', timestamp: new Date(mockNow.getTime() - 10 * 60 * 1000), success: true },
        { action: 'api_call', timestamp: new Date(mockNow.getTime() - 5 * 60 * 1000), success: true },
        { action: 'logout', timestamp: new Date(mockNow.getTime() - 1 * 60 * 1000), success: true },
      ]

      const events = detectSuspiciousActivity(recentActions)

      expect(events).toHaveLength(0)
    })

    it('should ignore old failed attempts', () => {
      const recentActions = [
        // Old failed attempts (more than 15 minutes ago) should be ignored
        { action: 'login', timestamp: new Date(mockNow.getTime() - 20 * 60 * 1000), success: false },
        { action: 'login', timestamp: new Date(mockNow.getTime() - 18 * 60 * 1000), success: false },
        { action: 'login', timestamp: new Date(mockNow.getTime() - 16 * 60 * 1000), success: false },
        // Recent successful attempts
        { action: 'login', timestamp: new Date(mockNow.getTime() - 5 * 60 * 1000), success: true },
      ]

      const events = detectSuspiciousActivity(recentActions)

      expect(events).toHaveLength(0)
    })

    it('should ignore old successful attempts for activity detection', () => {
      const recentActions = Array.from({ length: 25 }, (_, i) => ({
        action: 'api_call',
        timestamp: new Date(mockNow.getTime() - (i + 6) * 60 * 1000), // All more than 6 minutes ago
        success: true,
      }))

      const events = detectSuspiciousActivity(recentActions)

      expect(events).toHaveLength(0)
    })

    it('should handle empty actions array', () => {
      const events = detectSuspiciousActivity([])

      expect(events).toHaveLength(0)
    })
  })
})
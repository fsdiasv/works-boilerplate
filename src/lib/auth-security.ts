/**
 * Additional security validations and utilities for authentication
 */

/**
 * Password strength validation beyond basic requirements
 */
export interface PasswordStrengthResult {
  isStrong: boolean
  score: number // 0-4
  feedback: string[]
  criticalIssues: string[]
}

/**
 * Validates password strength with detailed feedback
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  const criticalIssues: string[] = []
  let score = 0

  // Basic length check
  if (password.length >= 12) {
    score += 1
  } else if (password.length >= 8) {
    score += 0.5
  } else {
    criticalIssues.push('Password must be at least 8 characters long')
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)

  const characterTypes = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(
    Boolean
  ).length

  if (characterTypes >= 4) {
    score += 1.5
  } else if (characterTypes >= 3) {
    score += 1
  } else if (characterTypes >= 2) {
    score += 0.5
  } else {
    criticalIssues.push('Password must contain at least 2 different character types')
  }

  if (!hasLowercase) feedback.push('Add lowercase letters')
  if (!hasUppercase) feedback.push('Add uppercase letters')
  if (!hasNumbers) feedback.push('Add numbers')
  if (!hasSpecialChars) feedback.push('Add special characters')

  // No common patterns check - removed per user request

  // Dictionary word check (simplified)
  const commonWords = ['password', 'admin', 'user', 'login', 'welcome', 'secret', 'access']
  const lowerPassword = password.toLowerCase()

  for (const word of commonWords) {
    if (lowerPassword.includes(word)) {
      score -= 0.5
      criticalIssues.push('Avoid common dictionary words')
      break
    }
  }

  // Ensure score is between 0 and 4
  score = Math.max(0, Math.min(4, score))

  return {
    isStrong: score >= 2 && criticalIssues.length === 0,
    score,
    feedback: feedback.slice(0, 3), // Limit feedback
    criticalIssues,
  }
}

/**
 * Email validation with additional security checks
 */
export interface EmailSecurityResult {
  isValid: boolean
  isSecure: boolean
  issues: string[]
}

/**
 * Validates email security beyond basic format
 */
export function validateEmailSecurity(email: string): EmailSecurityResult {
  const issues: string[] = []

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      isSecure: false,
      issues: ['Invalid email format'],
    }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\+.*@/, // Plus addressing (can be used for abuse)
    /\.{2,}/, // Multiple consecutive dots
    /^\./, // Starting with dot
    /\.$/, // Ending with dot
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      issues.push('Email contains suspicious patterns')
      break
    }
  }

  // Check for temporary email domains (basic list)
  const tempDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
  ]

  const domain = email.toLowerCase().split('@')[1]
  if (domain !== undefined && domain !== '' && tempDomains.includes(domain)) {
    issues.push('Temporary email domains are not allowed')
  }

  // Check for excessively long email
  if (email.length > 254) {
    issues.push('Email address is too long')
  }

  return {
    isValid: true,
    isSecure: issues.length === 0,
    issues,
  }
}

/**
 * Rate limiting attempt tracking
 */
export interface SecurityAttempt {
  ip: string
  email?: string
  timestamp: Date
  type: 'login' | 'signup' | 'password_reset'
  success: boolean
}

/**
 * Session security validation
 */
export interface SessionSecurity {
  isValid: boolean
  riskLevel: 'low' | 'medium' | 'high'
  issues: string[]
}

/**
 * Validates session security (to be used with proper session data)
 */
export function validateSessionSecurity(sessionAge: number, lastActivity: number): SessionSecurity {
  const issues: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' = 'low'

  // Check session age (24 hours = high risk, 12 hours = medium risk)
  if (sessionAge > 24 * 60 * 60 * 1000) {
    issues.push('Session is very old')
    riskLevel = 'high'
  } else if (sessionAge > 12 * 60 * 60 * 1000) {
    issues.push('Session is aging')
    riskLevel = 'medium'
  }

  // Check inactivity (2 hours = high risk, 1 hour = medium risk)
  if (lastActivity > 2 * 60 * 60 * 1000) {
    issues.push('Long period of inactivity')
    riskLevel = 'high'
  } else if (lastActivity > 60 * 60 * 1000) {
    issues.push('Moderate inactivity')
    if (riskLevel === 'low') riskLevel = 'medium'
  }

  return {
    isValid: riskLevel !== 'high',
    riskLevel,
    issues,
  }
}

/**
 * Input sanitization for auth fields
 */
export function sanitizeAuthInput(input: string): string {
  // Remove potentially dangerous characters while preserving legitimate use
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 1000) // Limit length
}

/**
 * Validate workspace slug security
 */
export function validateWorkspaceSlugSecurity(slug: string): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Check for reserved words
  const reservedWords = [
    'admin',
    'api',
    'www',
    'mail',
    'ftp',
    'localhost',
    'root',
    'support',
    'help',
    'blog',
    'store',
    'shop',
    'app',
    'mobile',
    'dashboard',
    'settings',
    'profile',
    'account',
    'billing',
    'auth',
    'login',
    'signup',
    'register',
    'reset',
    'verify',
    'workspace',
    'organization',
    'team',
    'company',
    'business',
  ]

  if (reservedWords.includes(slug.toLowerCase())) {
    issues.push('Slug cannot use reserved words')
  }

  // Check for security-sensitive patterns
  if (/^(\.|\-|_)/.test(slug) || /(\.|\-|_)$/.test(slug)) {
    issues.push('Slug cannot start or end with special characters')
  }

  // Check for consecutive special characters
  if (/[\-_]{2,}/.test(slug)) {
    issues.push('Slug cannot contain consecutive special characters')
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

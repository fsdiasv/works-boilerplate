/**
 * Get initials from a name
 * @param name - The full name
 * @param email - Optional email as fallback
 * @returns The initials (max 2 characters)
 */
export function getInitials(name: string | null | undefined, email?: string | null): string {
  // If no name, try to use email
  if (name === null || name === undefined || name === '') {
    if (email === null || email === undefined || email === '') return '?'
    // Extract initials from email (e.g., john.doe@example.com -> JD)
    const emailParts = email.split('@')[0]?.split('.') ?? []
    if (emailParts.length >= 2) {
      return (emailParts[0]?.[0] ?? '').toUpperCase() + (emailParts[1]?.[0] ?? '').toUpperCase()
    }
    return email[0]?.toUpperCase() ?? '?'
  }

  // Extract initials from name
  const nameParts = name.trim().split(/\s+/)
  if (nameParts.length === 1) {
    // Single name - take first two letters
    return name.slice(0, 2).toUpperCase()
  }

  // Multiple names - take first letter of first and last name
  const firstInitial = nameParts[0]?.[0] ?? ''
  const lastInitial = nameParts[nameParts.length - 1]?.[0] ?? ''
  return (firstInitial + lastInitial).toUpperCase()
}

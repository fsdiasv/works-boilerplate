import { redirect } from 'next/navigation'

import { defaultLocale } from '@/i18n/config'

export default function GlobalNotFound() {
  // Redirect to default locale home page instead of not-found to avoid loops
  redirect(`/${defaultLocale}`)
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthResendVerificationFallback() {
  // Get the user's preferred locale from cookie or default to 'en'
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'en'

  // Redirect to the localized resend verification page
  redirect(`/${locale}/auth/resend-verification`)
}

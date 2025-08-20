import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthResetPasswordFallback() {
  // Get the user's preferred locale from cookie or default to 'en'
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'en'

  // Redirect to the localized reset password page
  redirect(`/${locale}/auth/reset-password`)
}

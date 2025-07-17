import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthForgotPasswordFallback() {
  // Get the user's preferred locale from cookie or default to 'en'
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'en'

  // Redirect to the localized forgot password page
  redirect(`/${locale}/auth/forgot-password`)
}

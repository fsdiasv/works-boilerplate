import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup() {
  const testEmail = `test${Date.now()}@example.com`
  const testPassword = 'Test1234!@#$'

  console.log('Testing signup with email:', testEmail)

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          locale: 'pt',
          timezone: 'America/Sao_Paulo',
        },
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return
    }

    console.log('Signup successful!')
    console.log('User ID:', data.user?.id)
    console.log('User email:', data.user?.email)

    // Clean up - delete the test user
    if (data.user) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id)
      if (deleteError) {
        console.error('Error deleting test user:', deleteError)
      } else {
        console.log('Test user deleted successfully')
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testSignup()

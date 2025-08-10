import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Only log in development environment
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey ? '[Key Loaded]' : '[Key NOT Loaded]');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,  // ✅ Enable session persistence
    autoRefreshToken: true, // ✅ Auto refresh expired tokens
    detectSessionInUrl: true // ✅ Handle auth redirects
  }
})
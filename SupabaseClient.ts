import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Temporarily log the Supabase URL and Key to the console for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '[Key Loaded]' : '[Key NOT Loaded]');

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
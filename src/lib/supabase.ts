import { createClient } from '@supabase/supabase-js'

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

// Only create client if properly configured
export const supabase = isSupabaseConfigured() 
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null

// Mock auth object for when Supabase is not configured
const mockAuth = {
  getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  signOut: () => Promise.resolve({ error: null }),
  signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not configured') }),
  signUp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
}

// Export safe auth object
export const auth = supabase?.auth || mockAuth
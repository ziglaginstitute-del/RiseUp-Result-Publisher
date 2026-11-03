import { createClient } from '@supabase/supabase-js'

// Load Supabase credentials from environment variables or project defaults
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://mjzcxsppicererwzamjo.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Ef1cl6vrkoeCbbCyY_8s-g_Kn65lYNc'

export const isSupabaseConfigured = () => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-project') &&
    SUPABASE_URL.startsWith('http')
  )
}

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

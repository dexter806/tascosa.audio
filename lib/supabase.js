// lib/supabase.js
// ─────────────────────────────────────────────────────────────────────────────
// Supabase client — import this anywhere you need database access
// Usage: import { supabase } from '../../lib/supabase'
//    or: import { supabase } from '../lib/supabase'
// (use relative paths — no @ alias needed)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

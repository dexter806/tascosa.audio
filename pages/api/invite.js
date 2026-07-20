// FILE LOCATION: pages/api/invite.js
// ─────────────────────────────────────────────────────────────────────────────
// Invite API Route
// Triggers Supabase invite only — Supabase handles the branded email
// via custom SMTP (Resend) configured in Supabase dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  try {
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://www.tascosaaudio.com/portal/onboarding',
    })

    if (error) {
      console.error('Supabase invite error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('Invite error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

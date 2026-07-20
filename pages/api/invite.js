// FILE LOCATION: pages/api/invite.js
// ─────────────────────────────────────────────────────────────────────────────
// Invite API Route
// Called from admin portal to send a portal invite to a new client
// Uses Supabase service role key to generate invite link
// Then sends a branded email via Resend
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Service role client — has admin privileges, never expose to frontend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  try {
    // Generate invite link via Supabase admin
    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://www.tascosaaudio.com/portal/onboarding',
    })

    if (inviteError) {
      console.error('Supabase invite error:', inviteError)
      return res.status(500).json({ error: inviteError.message })
    }

    // Send branded welcome email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: email,
      replyTo: 'andy@tascosaaudio.com',
      subject: "You're invited to the Tascosa Audio Client Portal! 🎉",
      text: `
Hi there!

You've been invited to the Tascosa Audio Client Portal — your personal hub for planning your upcoming event with us.

Click the link below to create your account and get started:

${data?.user?.confirmation_sent_at ? 'Check your email for your invite link!' : 'https://www.tascosaaudio.com/portal/login'}

Inside your portal you'll be able to:
• View your event details and countdown
• Fill out your wedding planner at your own pace
• Check your balance summary
• Reach Andy directly anytime

If you have any questions before getting started, don't hesitate to reach out!

Andy Martinez
Tascosa Audio
806-670-7913
info@tascosaaudio.com
tascosaaudio.com
      `.trim(),
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      // Don't fail — the Supabase invite was sent, Resend is bonus
    }

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('Invite error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// FILE LOCATION: pages/api/auth-webhook.js
// ─────────────────────────────────────────────────────────────────────────────
// Auth Webhook — fires when a new user creates a portal account
// Supabase calls this endpoint automatically on user signup
// Sends Andy a notification email via Resend
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const payload = req.body

    // Supabase sends the user object in the payload
    const email = payload?.record?.email || payload?.email || 'Unknown'
    const userId = payload?.record?.id || payload?.user?.id || null

    // Look up their client record to get their name
    let clientName = 'New Client'
    let clientId = null
    let profileLink = 'https://www.tascosaaudio.com/admin'

    if (userId) {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('id, person1_first_name, person1_last_name')
        .eq('user_id', userId)
        .single()

      if (client) {
        clientName = `${client.person1_first_name || ''} ${client.person1_last_name || ''}`.trim()
        clientId = client.id
        profileLink = `https://www.tascosaaudio.com/admin/client/${client.id}`
      }
    }

    // Send notification email to Andy
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `🎉 New Portal Account — ${clientName}`,
      text: `Hey Andy!\n\n${clientName} just created their Tascosa Audio client portal account.\n\nEmail: ${email}\n\nView their profile:\n${profileLink}\n\nTascosa Audio Portal`,
    })

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('Auth webhook error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

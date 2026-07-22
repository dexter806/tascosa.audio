// FILE LOCATION: pages/api/auth-webhook.js
// ─────────────────────────────────────────────────────────────────────────────
// Auth Webhook — fires when a new user creates a portal account
// Uses email to look up client record since user_id isn't assigned yet
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

    // Extract email from payload — Supabase sends it in different places
    const email = payload?.user?.email
      || payload?.record?.email
      || payload?.email
      || 'Unknown'

    // Look up client by email address
    let clientName = email
    let profileLink = 'https://www.tascosaaudio.com/admin'

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, person1_first_name, person1_last_name')
      .ilike('person1_email', email)
      .single()

    if (client) {
      clientName = `${client.person1_first_name || ''} ${client.person1_last_name || ''}`.trim()
      profileLink = `https://www.tascosaaudio.com/admin/client/${client.id}`
    }

    // Send notification to Andy
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `🎉 New Portal Account — ${clientName}`,
      text: `Hey Andy!\n\n${clientName} just created their Tascosa Audio client portal account.\n\nEmail: ${email}\n\nView their profile:\n${profileLink}\n\nTascosa Audio Portal`,
    })

    // Must return this for Supabase "Before User Created" hook
    return res.status(200).json({ decision: 'continue' })

  } catch (err) {
    console.error('Auth webhook error:', err)
    // Still return continue so the signup isn't blocked
    return res.status(200).json({ decision: 'continue' })
  }
}

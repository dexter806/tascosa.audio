// FILE LOCATION: pages/api/auth-webhook.js
// Fires when a new user creates a portal account
// Notifies Andy and creates a Google Calendar event

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZnSg-uYwHIkH6JT6xXSWgA-WBpioUwYTwag0ihGab-Q7Ig21PJrljlMTlSism63VL/exec'

function djColor(assignedTo) {
  if (assignedTo === 'Andy') return '6'
  if (assignedTo === 'Austin') return '3'
  if (assignedTo === 'Joe') return '4'
  if (assignedTo === 'Danny') return '5'
  return '6'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const payload = req.body
    const email = payload?.user?.email || payload?.record?.email || payload?.email || 'Unknown'

    // Look up full client record by email
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('*')
      .ilike('person1_email', email)
      .single()

    // Determine if this is person 1 or person 2 signing up
    const isPerson1 = client
      ? client.person1_email?.toLowerCase() === email.toLowerCase()
      : false

    const clientName = client
      ? `${client.person1_first_name || ''} ${client.person1_last_name || ''}`.trim()
      : email

    const profileLink = client
      ? `https://www.tascosaaudio.com/admin/client/${client.id}`
      : 'https://www.tascosaaudio.com/admin'

    // Notify Andy
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `🎉 New Portal Account — ${clientName}`,
      text: `Hey Andy!\n\n${clientName} just created their Tascosa Audio client portal account.\n\nEmail: ${email}\n\nView their profile:\n${profileLink}\n\nTascosa Audio Portal`,
    })

    // Respond immediately so Supabase webhook doesn't time out
    res.status(200).json({ decision: 'continue' })

    // Create Google Calendar event if client has a wedding date
    if (client && client.wedding_date) {
      const eventTitle = `${client.person1_first_name} ${client.person1_last_name} & ${client.person2_first_name} ${client.person2_last_name} — ${client.venue || 'Venue TBD'}`
      const description = `Venue: ${client.venue || 'TBD'}\nPackage: ${client.package || 'TBD'}\nAssigned To: ${client.assigned_to || 'TBD'}\n${client.person1_first_name}: ${client.person1_email} · ${client.person1_phone || ''}\n${client.person2_first_name}: ${client.person2_email || ''} · ${client.person2_phone || ''}`

      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            date: client.wedding_date,
            title: eventTitle,
            notes: description,
            color: djColor(client.assigned_to),
          }),
        })

        // Mark client as calendar synced
        await supabaseAdmin
          .from('clients')
          .update({ calendar_event_id: 'synced' })
          .eq('id', client.id)
      } catch (calErr) {
        console.error('Calendar sync error:', calErr)
      }
    }

  } catch (err) {
    console.error('Auth webhook error:', err)
    return res.status(200).json({ decision: 'continue' })
  }
}

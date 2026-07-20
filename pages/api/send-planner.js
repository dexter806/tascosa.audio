// FILE LOCATION: pages/api/send-planner.js
// ─────────────────────────────────────────────────────────────────────────────
// Sends the wedding planner as a formatted email to the assigned DJ
// Called from the admin client detail page
// PDF generation happens via HTML email — upgrade to real PDF later
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── DJ CONTACT INFO — add emails/phones as you get them ─────────────────────
const DJ_CONTACTS = {
  Andy:   { email: 'andy@tascosaaudio.com',   phone: '806-670-7913' },
  Austin: { email: '',                          phone: '' }, // Add later
  Joe:    { email: '',                          phone: '' }, // Add later
  Danny:  { email: '',                          phone: '' }, // Add later
}

function formatTime(timeStr) {
  if (!timeStr) return 'Not provided'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${m} ${period}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function songLine(title, artist) {
  if (!title && !artist) return 'Not provided'
  return `${title || '—'} — ${artist || '—'}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientId, assignedTo } = req.body
  if (!clientId || !assignedTo) return res.status(400).json({ error: 'Missing clientId or assignedTo' })

  const djContact = DJ_CONTACTS[assignedTo]
  if (!djContact?.email) {
    return res.status(400).json({ error: `No email on file for ${assignedTo}. Add it to the DJ_CONTACTS list in /api/send-planner.js` })
  }

  try {
    // Load client
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    // Load planner
    const { data: planner } = await supabaseAdmin
      .from('wedding_planner')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (!client) return res.status(404).json({ error: 'Client not found' })

    const sameRole = client.person1_role === client.person2_role
    const label1 = sameRole ? `${client.person1_first_name} (${client.person1_role})` : client.person1_role
    const label2 = sameRole ? `${client.person2_first_name} (${client.person2_role})` : client.person2_role

    // Build plain text planner
    const plannerText = planner ? `
CEREMONY TIMELINE
─────────────────────────────────────
Ceremony Start:    ${formatTime(planner.ceremony_start_time)}
Reception End:     ${formatTime(planner.reception_end_time)}
${planner.event_notes ? `\nEvent Notes:\n${planner.event_notes}` : ''}

CEREMONY SONGS
─────────────────────────────────────
Parent/Grandparent Procession: ${songLine(planner.song_parent_procession_title, planner.song_parent_procession_artist)}
Groom Procession:              ${songLine(planner.song_groom_procession_title, planner.song_groom_procession_artist)}
Wedding Party / Groomsmen:     ${songLine(planner.song_groomsmen_title, planner.song_groomsmen_artist)}
Wedding Party / Bridesmaids:   ${songLine(planner.song_bridesmaids_title, planner.song_bridesmaids_artist)}
Bride Procession:              ${songLine(planner.song_bride_procession_title, planner.song_bride_procession_artist)}
Interlude:                     ${songLine(planner.song_interlude_title, planner.song_interlude_artist)}
Recessional:                   ${songLine(planner.song_recessional_title, planner.song_recessional_artist)}
${planner.ceremony_notes ? `\nCeremony Notes:\n${planner.ceremony_notes}` : ''}

INTRODUCTIONS
─────────────────────────────────────
Wedding Party Introduced First: ${planner.intro_party_first ? 'Yes' : 'No'}
${planner.intro_party_first ? `Introduction Style: ${planner.intro_party_style || '—'}` : ''}
${planner.intro_party_first && planner.intro_party_style === 'As Couples' && planner.intro_couples
  ? `\nCouple Walk-in Order:\n${planner.intro_couples.map((c, i) => `  ${i+1}. ${c.a} & ${c.b}`).join('\n')}`
  : ''}
Couple Introduction: ${planner.intro_couple_style || 'Not provided'}
${planner.intro_notes ? `\nIntro Notes:\n${planner.intro_notes}` : ''}

RECEPTION SONGS
─────────────────────────────────────
Wedding Party Entrance:        ${songLine(planner.song_party_entrance_title, planner.song_party_entrance_artist)}
${label1} & ${label2} Entrance:  ${songLine(planner.song_couple_entrance_title, planner.song_couple_entrance_artist)}
First Dance:                   ${songLine(planner.song_first_dance_title, planner.song_first_dance_artist)}
${label1} & ${planner.song_person1_parent_relation || 'Parent'} Dance:  ${songLine(planner.song_person1_parent_dance_title, planner.song_person1_parent_dance_artist)}
${label2} & ${planner.song_person2_parent_relation || 'Parent'} Dance:  ${songLine(planner.song_person2_parent_dance_title, planner.song_person2_parent_dance_artist)}
Cake Cutting:                  ${songLine(planner.song_cake_cutting_title, planner.song_cake_cutting_artist)}
Bouquet Toss:                  ${songLine(planner.song_bouquet_toss_title, planner.song_bouquet_toss_artist)}
Garter Toss:                   ${songLine(planner.song_garter_toss_title, planner.song_garter_toss_artist)}
Last Dance with Guests:        ${songLine(planner.song_last_dance_guests_title, planner.song_last_dance_guests_artist)}
Last Dance — Private:          ${songLine(planner.song_last_dance_private_title, planner.song_last_dance_private_artist)}
${planner.reception_notes ? `\nReception Notes:\n${planner.reception_notes}` : ''}

MUSIC PREFERENCES
─────────────────────────────────────
PLAY:
${planner.music_requests || 'None provided'}

DO NOT PLAY:
${planner.music_do_not_play || 'None provided'}

Playlist Links:
${planner.music_playlist_links || 'None provided'}

${planner.music_notes ? `Music Notes:\n${planner.music_notes}` : ''}
`.trim() : 'Wedding planner not yet completed by client.'

    const emailBody = `
TASCOSA AUDIO — WEDDING PLANNER
══════════════════════════════════════════════════════════

EVENT: ${client.person1_first_name} ${client.person1_last_name} & ${client.person2_first_name} ${client.person2_last_name}
DATE:  ${formatDate(client.wedding_date)}
VENUE: ${client.venue || '—'}
PACKAGE: ${client.package || '—'}
ASSIGNED TO: ${assignedTo}

CLIENT CONTACT
──────────────────────────────────────────────────────────
${label1}: ${client.person1_first_name} ${client.person1_last_name}
  Email: ${client.person1_email || '—'}
  Phone: ${client.person1_phone || '—'}

${label2}: ${client.person2_first_name} ${client.person2_last_name}
  Email: ${client.person2_email || '—'}
  Phone: ${client.person2_phone || '—'}

══════════════════════════════════════════════════════════
WEDDING PLANNER DETAILS
══════════════════════════════════════════════════════════

${plannerText}

══════════════════════════════════════════════════════════
Sent by Tascosa Audio Admin Portal
Questions? Contact Andy at andy@tascosaaudio.com | 806-670-7913
    `.trim()

    const { error: emailError } = await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: djContact.email,
      replyTo: 'andy@tascosaaudio.com',
      subject: `Wedding Planner — ${client.person1_first_name} & ${client.person2_first_name} | ${formatDate(client.wedding_date)}`,
      text: emailBody,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('Send planner error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

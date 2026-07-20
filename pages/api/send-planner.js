// FILE LOCATION: pages/api/send-planner.js
// ─────────────────────────────────────────────────────────────────────────────
// Sends the wedding planner as a PDF attachment to the assigned DJ
// Uses pdf-lib to generate the PDF in memory
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── DJ CONTACT INFO — add emails as you get them ────────────────────────────
const DJ_CONTACTS = {
  Andy:   { email: 'andy@tascosaaudio.com',   phone: '806-670-7913' },
  Austin: { email: '',                          phone: '' },
  Joe:    { email: '',                          phone: '' },
  Danny:  { email: '',                          phone: '' },
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
  return [title, artist].filter(Boolean).join(' — ')
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
async function generatePlannerPDF(client, planner, label1, label2) {
  const pdfDoc = await PDFDocument.create()
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const orange = rgb(0.863, 0.373, 0.078) // #DC5F14
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.85, 0.85, 0.85)

  // Page setup
  const pageWidth = 612  // Letter width
  const pageHeight = 792 // Letter height
  const margin = 50
  const colWidth = pageWidth - (margin * 2)

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  // Helper to add a new page when needed
  function checkPage(needed = 30) {
    if (y < margin + needed) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  // Helper to draw a line
  function drawLine(color = lightGray) {
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color,
    })
    y -= 10
  }

  // Helper to draw text
  function drawText(text, { fontSize = 10, font = regularFont, color = black, x = margin, indent = 0 } = {}) {
    checkPage(fontSize + 6)
    const safeText = (text || '').replace(/[^\x20-\x7E]/g, ' ').substring(0, 200)
    page.drawText(safeText, {
      x: x + indent,
      y,
      size: fontSize,
      font,
      color,
    })
    y -= fontSize + 6
  }

  // Helper to draw a section header
  function drawSection(title) {
    checkPage(40)
    y -= 8
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: colWidth,
      height: 22,
      color: orange,
    })
    page.drawText(title.toUpperCase(), {
      x: margin + 8,
      y: y + 2,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    })
    y -= 22
  }

  // Helper to draw a song row
  function drawSong(label, title, artist) {
    checkPage(28)
    page.drawText(label, { x: margin + 8, y, size: 9, font: boldFont, color: gray })
    y -= 13
    const value = songLine(title, artist)
    page.drawText(value.substring(0, 80), { x: margin + 16, y, size: 9, font: regularFont, color: black })
    y -= 14
    drawLine()
  }

  // Helper for info row
  function drawInfoRow(label, value) {
    checkPage(20)
    page.drawText(label + ':', { x: margin + 8, y, size: 9, font: boldFont, color: gray })
    page.drawText((value || 'Not provided').substring(0, 70), { x: margin + 130, y, size: 9, font: regularFont, color: black })
    y -= 16
    drawLine()
  }

  // ── HEADER ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: pageHeight - 80, width: pageWidth, height: 80, color: rgb(0.06, 0.06, 0.06) })
  page.drawText('TASCOSA AUDIO', { x: margin, y: pageHeight - 35, size: 18, font: boldFont, color: rgb(1,1,1) })
  page.drawText('WEDDING PLANNER', { x: margin, y: pageHeight - 55, size: 11, font: regularFont, color: orange })
  page.drawText(`Prepared for: ${client.person1_first_name} & ${client.person2_first_name}`, {
    x: margin, y: pageHeight - 72, size: 9, font: regularFont, color: rgb(0.7, 0.7, 0.7)
  })
  y = pageHeight - 100

  // ── EVENT OVERVIEW ──────────────────────────────────────────────────────────
  drawSection('Event Overview')
  y -= 4
  drawInfoRow('Couple', `${client.person1_first_name} ${client.person1_last_name} & ${client.person2_first_name} ${client.person2_last_name}`)
  drawInfoRow('Date', formatDate(client.wedding_date))
  drawInfoRow('Venue', client.venue || '—')
  drawInfoRow('Package', client.package || '—')
  drawInfoRow('Assigned DJ', client.assigned_to || '—')

  // ── CONTACT INFO ────────────────────────────────────────────────────────────
  drawSection('Client Contact Information')
  y -= 4
  drawInfoRow(label1, `${client.person1_first_name} ${client.person1_last_name}`)
  drawInfoRow(`${label1} Email`, client.person1_email || '—')
  drawInfoRow(`${label1} Phone`, client.person1_phone || '—')
  drawInfoRow(label2, `${client.person2_first_name} ${client.person2_last_name}`)
  drawInfoRow(`${label2} Email`, client.person2_email || '—')
  drawInfoRow(`${label2} Phone`, client.person2_phone || '—')

  if (!planner) {
    drawSection('Wedding Planner')
    y -= 4
    drawText('The client has not yet completed their wedding planner.', { color: gray })
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }

  // ── TIMELINE ────────────────────────────────────────────────────────────────
  drawSection('Event Timeline')
  y -= 4
  drawInfoRow('Ceremony Start', formatTime(planner.ceremony_start_time))
  drawInfoRow('Reception End', formatTime(planner.reception_end_time))
  if (planner.event_notes) {
    y -= 4
    drawText('Event Notes:', { font: boldFont, color: gray, fontSize: 9 })
    drawText(planner.event_notes.substring(0, 300), { indent: 8, fontSize: 9, color: black })
  }

  // ── CEREMONY SONGS ──────────────────────────────────────────────────────────
  drawSection('Ceremony Songs')
  y -= 4
  drawSong('Parent / Grandparent Procession', planner.song_parent_procession_title, planner.song_parent_procession_artist)
  drawSong('Groom Procession', planner.song_groom_procession_title, planner.song_groom_procession_artist)
  drawSong('Wedding Party / Groomsmen', planner.song_groomsmen_title, planner.song_groomsmen_artist)
  drawSong('Wedding Party / Bridesmaids', planner.song_bridesmaids_title, planner.song_bridesmaids_artist)
  drawSong('Bride Procession', planner.song_bride_procession_title, planner.song_bride_procession_artist)
  drawSong('Interlude', planner.song_interlude_title, planner.song_interlude_artist)
  drawSong('Recessional', planner.song_recessional_title, planner.song_recessional_artist)
  if (planner.ceremony_notes) {
    y -= 4
    drawText('Ceremony Notes:', { font: boldFont, color: gray, fontSize: 9 })
    drawText(planner.ceremony_notes.substring(0, 300), { indent: 8, fontSize: 9 })
  }

  // ── INTRODUCTIONS ───────────────────────────────────────────────────────────
  drawSection('Wedding Party Introductions')
  y -= 4
  drawInfoRow('Party Introduced First', planner.intro_party_first ? 'Yes' : 'No')
  if (planner.intro_party_first) {
    drawInfoRow('Introduction Style', planner.intro_party_style || '—')
    if (planner.intro_party_style === 'As Couples' && planner.intro_couples) {
      drawText('Couple Walk-in Order:', { font: boldFont, color: gray, fontSize: 9 })
      planner.intro_couples.forEach((couple, i) => {
        drawText(`  ${i + 1}. ${couple.a || '—'} & ${couple.b || '—'}`, { fontSize: 9, indent: 8 })
      })
    }
  }
  if (planner.intro_couple_style) {
    drawText('Couple Introduction:', { font: boldFont, color: gray, fontSize: 9 })
    drawText(planner.intro_couple_style.substring(0, 200), { indent: 8, fontSize: 9 })
  }
  if (planner.intro_notes) {
    drawText('Intro Notes:', { font: boldFont, color: gray, fontSize: 9 })
    drawText(planner.intro_notes.substring(0, 200), { indent: 8, fontSize: 9 })
  }

  // ── RECEPTION SONGS ─────────────────────────────────────────────────────────
  drawSection('Reception Songs')
  y -= 4
  drawSong('Wedding Party Entrance', planner.song_party_entrance_title, planner.song_party_entrance_artist)
  drawSong(`${label1} & ${label2} Entrance`, planner.song_couple_entrance_title, planner.song_couple_entrance_artist)
  drawSong('First Dance', planner.song_first_dance_title, planner.song_first_dance_artist)
  drawSong(`${label1} & ${planner.song_person1_parent_relation || 'Parent'} Dance`, planner.song_person1_parent_dance_title, planner.song_person1_parent_dance_artist)
  drawSong(`${label2} & ${planner.song_person2_parent_relation || 'Parent'} Dance`, planner.song_person2_parent_dance_title, planner.song_person2_parent_dance_artist)
  drawSong('Cake Cutting', planner.song_cake_cutting_title, planner.song_cake_cutting_artist)
  drawSong('Bouquet Toss', planner.song_bouquet_toss_title, planner.song_bouquet_toss_artist)
  drawSong('Garter Toss', planner.song_garter_toss_title, planner.song_garter_toss_artist)
  drawSong('Last Dance with Guests', planner.song_last_dance_guests_title, planner.song_last_dance_guests_artist)
  drawSong('Last Dance — Private', planner.song_last_dance_private_title, planner.song_last_dance_private_artist)
  if (planner.reception_notes) {
    y -= 4
    drawText('Reception Notes:', { font: boldFont, color: gray, fontSize: 9 })
    drawText(planner.reception_notes.substring(0, 300), { indent: 8, fontSize: 9 })
  }

  // ── MUSIC PREFERENCES ───────────────────────────────────────────────────────
  drawSection('Music Preferences')
  y -= 4
  drawText('PLAY:', { font: boldFont, color: gray, fontSize: 9 })
  drawText((planner.music_requests || 'None provided').substring(0, 400), { indent: 8, fontSize: 9 })
  y -= 6
  drawText('DO NOT PLAY:', { font: boldFont, color: gray, fontSize: 9 })
  drawText((planner.music_do_not_play || 'None provided').substring(0, 400), { indent: 8, fontSize: 9 })
  if (planner.music_playlist_links) {
    y -= 6
    drawText('Playlist Links:', { font: boldFont, color: gray, fontSize: 9 })
    drawText(planner.music_playlist_links.substring(0, 300), { indent: 8, fontSize: 9 })
  }
  if (planner.music_notes) {
    y -= 6
    drawText('Music Notes:', { font: boldFont, color: gray, fontSize: 9 })
    drawText(planner.music_notes.substring(0, 300), { indent: 8, fontSize: 9 })
  }

  // ── FOOTER on last page ──────────────────────────────────────────────────────
  page.drawLine({ start: { x: margin, y: 40 }, end: { x: pageWidth - margin, y: 40 }, thickness: 0.5, color: lightGray })
  page.drawText('Tascosa Audio · andy@tascosaaudio.com · 806-670-7913 · tascosaaudio.com', {
    x: margin, y: 26, size: 8, font: regularFont, color: gray
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientId, assignedTo } = req.body
  if (!clientId || !assignedTo) return res.status(400).json({ error: 'Missing clientId or assignedTo' })

  const djContact = DJ_CONTACTS[assignedTo]
  if (!djContact?.email) {
    return res.status(400).json({ error: `No email on file for ${assignedTo}. Add it to DJ_CONTACTS in /api/send-planner.js` })
  }

  try {
    const { data: client } = await supabaseAdmin.from('clients').select('*').eq('id', clientId).single()
    const { data: planner } = await supabaseAdmin.from('wedding_planner').select('*').eq('client_id', clientId).single()

    if (!client) return res.status(404).json({ error: 'Client not found' })

    const sameRole = client.person1_role === client.person2_role
    const label1 = sameRole ? `${client.person1_first_name} (${client.person1_role})` : client.person1_role
    const label2 = sameRole ? `${client.person2_first_name} (${client.person2_role})` : client.person2_role

    // Generate PDF
    const pdfBuffer = await generatePlannerPDF(client, planner, label1, label2)
    const pdfBase64 = pdfBuffer.toString('base64')

    const fileName = `${client.person1_first_name}_${client.person2_first_name}_Wedding_Planner.pdf`.replace(/\s+/g, '_')

    const { error: emailError } = await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: djContact.email,
      replyTo: 'andy@tascosaaudio.com',
      subject: `Wedding Planner — ${client.person1_first_name} & ${client.person2_first_name} | ${formatDate(client.wedding_date)}`,
      text: `Hi ${assignedTo},\n\nPlease find attached the wedding planner for ${client.person1_first_name} & ${client.person2_first_name} on ${formatDate(client.wedding_date)} at ${client.venue || 'TBD'}.\n\nQuestions? Contact Andy at andy@tascosaaudio.com or 806-670-7913.\n\nTascosa Audio`,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('Send planner error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}

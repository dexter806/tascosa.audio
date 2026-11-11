// FILE LOCATION: pages/api/send-wedding-planner.js
// ─────────────────────────────────────────────────────────────────────────────
// Generates a PDF from the couple's wedding_planner_data and either:
//   - returns it as a download (action: 'download')
//   - emails it to the couple (action: 'email')
//   - does both (action: 'both')
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(str) {
  return (str || '').replace(/[^\x20-\x7E]/g, '-')
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${m} ${period}`
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

async function generateWeddingPlannerPDF(client, data) {
  const pdfDoc = await PDFDocument.create()
  const boldFont   = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const orange    = rgb(0.863, 0.373, 0.078) // #DC5F14
  const pink      = rgb(0.859, 0.282, 0.443) // #DB4871
  const black     = rgb(0, 0, 0)
  const gray      = rgb(0.4, 0.4, 0.4)
  const lightGray = rgb(0.85, 0.85, 0.85)
  const white     = rgb(1, 1, 1)

  const pageWidth  = 612
  const pageHeight = 792
  const margin     = 50
  const colWidth   = pageWidth - margin * 2

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y    = pageHeight - margin

  function checkPage(needed = 30) {
    if (y < margin + needed) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  function drawLine(color = lightGray) {
    page.drawLine({
      start: { x: margin, y },
      end:   { x: pageWidth - margin, y },
      thickness: 0.5,
      color,
    })
    y -= 8
  }

  function wrapText(text, font, fontSize, maxWidth) {
    const safe = sanitize(text || '').replace(/\n/g, '\n')
    const paragraphs = safe.split('\n')
    const lines = []
    for (const para of paragraphs) {
      if (!para.trim()) { lines.push(''); continue }
      const words = para.split(' ')
      let current = ''
      for (const word of words) {
        const test = current ? current + ' ' + word : word
        if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
          lines.push(current)
          current = word
        } else {
          current = test
        }
      }
      if (current) lines.push(current)
    }
    return lines
  }

  function drawText(text, { fontSize = 10, font = regularFont, color = black, indent = 0 } = {}) {
    checkPage(fontSize + 6)
    const safe = sanitize(text || '').substring(0, 200)
    page.drawText(safe, { x: margin + indent, y, size: fontSize, font, color })
    y -= fontSize + 6
  }

  function drawWrappedText(text, { fontSize = 9, font = regularFont, color = black, indent = 0 } = {}) {
    const lines = wrapText(text, font, fontSize, colWidth - indent - 10)
    for (const line of lines) {
      checkPage(fontSize + 5)
      if (line) page.drawText(line, { x: margin + indent, y, size: fontSize, font, color })
      y -= fontSize + 5
    }
  }

  function drawSection(title) {
    checkPage(44)
    y -= 10
    page.drawRectangle({ x: margin, y: y - 4, width: colWidth, height: 22, color: pink })
    page.drawText(title.toUpperCase(), { x: margin + 8, y: y + 2, size: 10, font: boldFont, color: white })
    y -= 26
  }

  function drawInfoRow(label, value) {
    checkPage(18)
    page.drawText(sanitize(label + ':').substring(0, 30), { x: margin + 8, y, size: 9, font: boldFont, color: gray })
    page.drawText(sanitize(value || '-').substring(0, 70), { x: margin + 150, y, size: 9, font: regularFont, color: black })
    y -= 15
    drawLine()
  }

  // ── HEADER ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: pageHeight - 80, width: pageWidth, height: 80, color: rgb(0.06, 0.06, 0.06) })
  page.drawText('TASCOSA AUDIO', { x: margin, y: pageHeight - 34, size: 18, font: boldFont, color: white })
  page.drawText('WEDDING PLANNING GUIDE', { x: margin, y: pageHeight - 54, size: 11, font: regularFont, color: pink })

  const coupleNames = [client.person1_first_name, client.person2_first_name].filter(Boolean).join(' & ')
    || client.contact_name || 'Your Wedding'
  page.drawText(`Prepared for: ${coupleNames}`, { x: margin, y: pageHeight - 70, size: 9, font: regularFont, color: rgb(0.65, 0.65, 0.65) })

  const generatedStr = `Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  const genWidth = regularFont.widthOfTextAtSize(generatedStr, 8)
  page.drawText(generatedStr, { x: pageWidth - margin - genWidth, y: pageHeight - 70, size: 8, font: regularFont, color: rgb(0.5, 0.5, 0.5) })

  y = pageHeight - 100

  // ── COUPLE & EVENT OVERVIEW ───────────────────────────────────────────────
  drawSection('Our Wedding')
  y -= 2

  const role1 = client.person1_role || 'Partner 1'
  const role2 = client.person2_role || 'Partner 2'
  if (client.person1_first_name) drawInfoRow(role1, `${client.person1_first_name} ${client.person1_last_name || ''}`.trim())
  if (client.person2_first_name) drawInfoRow(role2, `${client.person2_first_name} ${client.person2_last_name || ''}`.trim())
  if (client.wedding_date)        drawInfoRow('Wedding Date', formatDate(client.wedding_date))
  if (client.venue)               drawInfoRow('Venue', client.venue)
  if (client.person1_email)       drawInfoRow('Email', client.person1_email)
  if (client.person2_email)       drawInfoRow('Email 2', client.person2_email)

  const checklist = data.checklist || []
  const vendors   = data.vendors   || []
  const guests    = data.guests    || []
  const budget    = data.budget    || { total: 0, items: [] }
  const timeline  = data.timeline  || []
  const notes     = data.notes     || ''

  // ── CHECKLIST ────────────────────────────────────────────────────────────
  if (checklist.length > 0) {
    drawSection('Wedding Checklist')
    y -= 2

    const done  = checklist.filter(i => i.checked).length
    const total = checklist.length
    const pct   = total ? Math.round((done / total) * 100) : 0

    drawText(`${done} of ${total} items complete (${pct}%)`, { fontSize: 9, color: gray, indent: 8 })
    y -= 4

    // Progress bar
    checkPage(16)
    page.drawRectangle({ x: margin + 8, y, width: colWidth - 16, height: 8, color: rgb(0.9, 0.9, 0.9) })
    if (pct > 0) {
      page.drawRectangle({ x: margin + 8, y, width: (colWidth - 16) * (pct / 100), height: 8, color: pink })
    }
    y -= 18

    // Group by category
    const categories = [...new Set(checklist.map(i => i.category))]
    for (const cat of categories) {
      const items = checklist.filter(i => i.category === cat)
      checkPage(20)
      y -= 4
      drawText(cat, { fontSize: 9, font: boldFont, color: gray, indent: 8 })
      for (const item of items) {
        checkPage(14)
        const mark = item.checked ? '[x]' : '[ ]'
        const textColor = item.checked ? gray : black
        page.drawText(mark, { x: margin + 16, y, size: 9, font: regularFont, color: item.checked ? pink : gray })
        const safe = (item.text || '').replace(/[^\x20-\x7E]/g, ' ').substring(0, 90)
        page.drawText(safe, { x: margin + 40, y, size: 9, font: regularFont, color: textColor })
        y -= 14
      }
    }
  }

  // ── VENDORS ───────────────────────────────────────────────────────────────
  if (vendors.length > 0) {
    drawSection('Vendor Directory')
    y -= 2

    const booked = vendors.filter(v => v.booked).length
    drawText(`${vendors.length} vendor${vendors.length !== 1 ? 's' : ''} - ${booked} booked`, { fontSize: 9, color: gray, indent: 8 })
    y -= 4

    for (const v of vendors) {
      checkPage(50)
      y -= 4

      // Vendor name + category + booked badge
      const nameStr = (v.name || 'Unnamed Vendor').replace(/[^\x20-\x7E]/g, ' ').substring(0, 40)
      page.drawText(nameStr, { x: margin + 8, y, size: 10, font: boldFont, color: black })
      if (v.booked) {
        const bw = boldFont.widthOfTextAtSize('BOOKED', 7)
        page.drawRectangle({ x: pageWidth - margin - bw - 10, y: y - 2, width: bw + 10, height: 13, color: rgb(0.9, 1, 0.9) })
        page.drawText('BOOKED', { x: pageWidth - margin - bw - 5, y: y + 1, size: 7, font: boldFont, color: rgb(0.1, 0.6, 0.2) })
      }
      y -= 13

      page.drawText((v.category || '').replace(/[^\x20-\x7E]/g, ' '), { x: margin + 8, y, size: 8, font: regularFont, color: gray })
      y -= 12

      if (v.phone)   { page.drawText(`Ph: ${v.phone.replace(/[^\x20-\x7E]/g, ' ')}`,   { x: margin + 16, y, size: 8, font: regularFont, color: black }); y -= 11 }
      if (v.email)   { page.drawText(`Email: ${v.email.replace(/[^\x20-\x7E]/g, ' ')}`,   { x: margin + 16, y, size: 8, font: regularFont, color: black }); y -= 11 }
      if (v.website) { page.drawText(`Web: ${v.website.replace(/[^\x20-\x7E]/g, ' ')}`, { x: margin + 16, y, size: 8, font: regularFont, color: black }); y -= 11 }
      if (v.notes) {
        drawWrappedText(v.notes, { fontSize: 8, color: gray, indent: 16 })
      }
      drawLine()
    }
  }

  // ── GUESTS ────────────────────────────────────────────────────────────────
  if (guests.length > 0) {
    drawSection('Guest List')
    y -= 2

    const yes     = guests.filter(g => g.rsvp === 'Yes').length
    const no      = guests.filter(g => g.rsvp === 'No').length
    const pending = guests.filter(g => !g.rsvp || g.rsvp === 'Pending').length
    const plusOnes = guests.filter(g => g.plusOne).length

    drawText(`${guests.length} guests - ${yes} confirmed - ${no} declined - ${pending} pending - ${plusOnes} +1s`, { fontSize: 9, color: gray, indent: 8 })
    y -= 6

    // Header row
    checkPage(16)
    page.drawRectangle({ x: margin, y: y - 2, width: colWidth, height: 15, color: rgb(0.95, 0.95, 0.95) })
    page.drawText('NAME',  { x: margin + 8,         y: y + 1, size: 8, font: boldFont, color: gray })
    page.drawText('RSVP',  { x: margin + colWidth - 110, y: y + 1, size: 8, font: boldFont, color: gray })
    page.drawText('+1',    { x: margin + colWidth - 55,  y: y + 1, size: 8, font: boldFont, color: gray })
    y -= 18

    for (const g of guests) {
      checkPage(14)
      const rsvpColor = g.rsvp === 'Yes' ? rgb(0.1, 0.6, 0.2) : g.rsvp === 'No' ? rgb(0.8, 0.1, 0.1) : gray
      page.drawText(sanitize(g.name || '-').substring(0, 45), { x: margin + 8, y, size: 9, font: regularFont, color: black })
      page.drawText(sanitize(g.rsvp || 'Pending'), { x: margin + colWidth - 110, y, size: 9, font: regularFont, color: rsvpColor })
      page.drawText(g.plusOne ? 'Y' : '-', { x: margin + colWidth - 55, y, size: 9, font: regularFont, color: g.plusOne ? pink : gray })
      y -= 13
      if (g.notes) {
        page.drawText(g.notes.replace(/[^\x20-\x7E]/g, ' ').substring(0, 70), { x: margin + 16, y, size: 7, font: regularFont, color: gray })
        y -= 11
      }
      drawLine()
    }
  }

  // ── BUDGET ────────────────────────────────────────────────────────────────
  const hasbudget = budget.total > 0 || (budget.items && budget.items.length > 0)
  if (hasbudget) {
    drawSection('Budget')
    y -= 2

    if (budget.total > 0) {
      checkPage(20)
      page.drawText('OVERALL BUDGET', { x: margin + 8, y, size: 9, font: boldFont, color: gray })
      const totalStr = `$${parseFloat(budget.total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      const tw = boldFont.widthOfTextAtSize(totalStr, 14)
      page.drawText(totalStr, { x: pageWidth - margin - tw, y: y - 2, size: 14, font: boldFont, color: pink })
      y -= 22
    }

    if (budget.items && budget.items.length > 0) {
      const totalEst    = budget.items.reduce((s, i) => s + (parseFloat(i.estimated) || 0), 0)
      const totalActual = budget.items.reduce((s, i) => s + (parseFloat(i.actual) || 0), 0)

      y -= 4
      // Header
      checkPage(16)
      page.drawRectangle({ x: margin, y: y - 2, width: colWidth, height: 15, color: rgb(0.95, 0.95, 0.95) })
      page.drawText('ITEM',      { x: margin + 8,                  y: y + 1, size: 8, font: boldFont, color: gray })
      page.drawText('ESTIMATED', { x: margin + colWidth - 170,     y: y + 1, size: 8, font: boldFont, color: gray })
      page.drawText('ACTUAL',    { x: margin + colWidth - 90,      y: y + 1, size: 8, font: boldFont, color: gray })
      page.drawText('PAID',      { x: margin + colWidth - 20,      y: y + 1, size: 8, font: boldFont, color: gray })
      y -= 18

      for (const item of budget.items) {
        checkPage(14)
        page.drawText(sanitize(item.label || '-').substring(0, 35), { x: margin + 8, y, size: 9, font: regularFont, color: black })
        page.drawText(item.estimated ? `$${parseFloat(item.estimated).toFixed(0)}` : '-', { x: margin + colWidth - 170, y, size: 9, font: regularFont, color: black })
        page.drawText(item.actual    ? `$${parseFloat(item.actual).toFixed(0)}` : '-',    { x: margin + colWidth - 90,  y, size: 9, font: regularFont, color: black })
        page.drawText(item.paid ? 'Y' : '-', { x: margin + colWidth - 18, y, size: 9, font: regularFont, color: item.paid ? rgb(0.1, 0.6, 0.2) : gray })
        y -= 13
        drawLine()
      }

      // Totals row
      checkPage(18)
      page.drawRectangle({ x: margin, y: y - 2, width: colWidth, height: 15, color: rgb(0.95, 0.95, 0.95) })
      page.drawText('TOTAL', { x: margin + 8, y: y + 1, size: 9, font: boldFont, color: black })
      page.drawText(`$${totalEst.toFixed(0)}`, { x: margin + colWidth - 170, y: y + 1, size: 9, font: boldFont, color: black })
      if (totalActual > 0) page.drawText(`$${totalActual.toFixed(0)}`, { x: margin + colWidth - 90, y: y + 1, size: 9, font: boldFont, color: black })
      y -= 20
    }
  }

  // ── DAY-OF TIMELINE ───────────────────────────────────────────────────────
  if (timeline.length > 0) {
    drawSection('Day-of Timeline')
    y -= 2

    for (const item of timeline) {
      checkPage(22)
      const timeStr = item.time ? formatTime(item.time) : '-'
      page.drawText(timeStr, { x: margin + 8, y, size: 9, font: boldFont, color: pink })
      page.drawText((item.label || '').replace(/[^\x20-\x7E]/g, ' ').substring(0, 55), { x: margin + 80, y, size: 9, font: regularFont, color: black })
      y -= 13
      if (item.notes) {
        page.drawText(item.notes.replace(/[^\x20-\x7E]/g, ' ').substring(0, 70), { x: margin + 80, y, size: 8, font: regularFont, color: gray })
        y -= 11
      }
      drawLine()
    }
  }

  // ── NOTES ─────────────────────────────────────────────────────────────────
  if (notes && notes.trim()) {
    drawSection('Notes')
    y -= 4
    drawWrappedText(notes, { fontSize: 9, indent: 8 })
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: margin, y: 40 }, end: { x: pageWidth - margin, y: 40 }, thickness: 0.5, color: lightGray })
  page.drawText('Tascosa Audio  |  andy@tascosaaudio.com  |  806-670-7913  |  tascosaaudio.com', {
    x: margin, y: 26, size: 8, font: regularFont, color: gray
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clientId, action } = req.body
  // action: 'download' | 'email' | 'both'

  if (!clientId) return res.status(400).json({ error: 'Missing clientId' })
  if (!['download', 'email', 'both'].includes(action)) return res.status(400).json({ error: 'Invalid action' })

  try {
    const { data: client } = await supabaseAdmin.from('clients').select('*').eq('id', clientId).single()
    if (!client) return res.status(404).json({ error: 'Client not found' })

    const { data: plannerData } = await supabaseAdmin
      .from('wedding_planner_data')
      .select('*')
      .eq('client_id', clientId)
      .single()

    const data = plannerData || { checklist: [], vendors: [], guests: [], budget: { total: 0, items: [] }, timeline: [], notes: '' }

    const pdfBuffer = await generateWeddingPlannerPDF(client, data)

    const firstName1 = client.person1_first_name || ''
    const firstName2 = client.person2_first_name || ''
    const fileName = `${firstName1}_${firstName2}_Wedding_Planner.pdf`.replace(/\s+/g, '_').replace(/^_|_$/g, '') || 'Wedding_Planner.pdf'

    // ── Download only ──────────────────────────────────────────────────────
    if (action === 'download') {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      return res.send(pdfBuffer)
    }

    // ── Email only or Both ─────────────────────────────────────────────────
    const emails = [client.person1_email, client.person2_email].filter(Boolean)
    if (emails.length === 0) {
      // No emails on file — if download requested alongside, still send that
      if (action === 'both') {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
        return res.send(pdfBuffer)
      }
      return res.status(400).json({ error: 'No email addresses on file for this client.' })
    }

    const coupleNames = [firstName1, firstName2].filter(Boolean).join(' & ') || 'Your Wedding'
    const dateStr = formatDate(client.wedding_date)

    const { error: emailError } = await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: emails,
      replyTo: 'andy@tascosaaudio.com',
      subject: `Your Wedding Planning Guide — ${coupleNames}`,
      text: `Hi ${coupleNames},\n\nAttached is your wedding planning guide — a summary of everything you've put together so far.\n\nKeep adding to it in your Tascosa Audio portal any time:\nhttps://tascosaaudio.com/portal/dashboard\n\nYour wedding is on ${dateStr}. We can't wait to be part of your day!\n\nAndy & the Tascosa Audio team\nandy@tascosaaudio.com · 806-670-7913`,
      attachments: [{ filename: fileName, content: pdfBuffer.toString('base64') }],
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      // If 'both' was requested, still return the PDF even if email fails
      if (action === 'both') {
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
        return res.send(pdfBuffer)
      }
      return res.status(500).json({ error: 'Email failed to send. Please try again.' })
    }

    // Email sent — if 'both', also return PDF for download
    if (action === 'both') {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      return res.send(pdfBuffer)
    }

    return res.status(200).json({ success: true, sentTo: emails })

  } catch (err) {
    console.error('Wedding planner export error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}

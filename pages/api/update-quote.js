// FILE LOCATION: pages/api/update-quote.js
// Updates an existing quote row and re-sends the branded email to the client

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { quoteId, to, cc, clientName, subject, html, quoteData } = req.body
  if (!quoteId || !to || !html) return res.status(400).json({ error: 'Missing required fields' })

  try {
    // 1. Update the existing quote row
    const { error: dbError } = await supabaseAdmin
      .from('quotes')
      .update({
        client_name: quoteData.clientName,
        client_email: quoteData.clientEmail,
        client_phone: quoteData.clientPhone,
        event_date: quoteData.eventDate || null,
        venue: quoteData.venue,
        event_type: quoteData.eventType,
        package_id: quoteData.packageId,
        package_name: quoteData.packageName,
        base_price: quoteData.basePrice,
        extra_hours_before: quoteData.extraHoursBefore || 0,
        extra_hours_after: quoteData.extraHoursAfter || 0,
        rehearsal: quoteData.rehearsal || false,
        travel_fee: quoteData.travelFee || 0,
        travel_label: quoteData.travelLabel || '',
        deposit: quoteData.deposit || 200,
        total: quoteData.total,
        notes: quoteData.notes || '',
      })
      .eq('id', quoteId)

    if (dbError) {
      console.error('DB error:', dbError)
      return res.status(500).json({ error: 'Failed to update quote' })
    }

    const quoteLink = `https://www.tascosaaudio.com/pay?quote=${quoteId}`

    // 2. Personalize the HTML with the correct quote link
    const personalizedHtml = html
      .replace('https://www.tascosaaudio.com/pay', quoteLink)
      .replace('Review, Sign &amp; Pay Deposit →', 'Review, Sign & Pay Deposit →')

    // 3. Send updated email to client
    const { error: emailError } = await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to,
      ...(cc ? { cc } : {}),
      replyTo: 'andy@tascosaaudio.com',
      subject: subject || 'Updated Quote from Tascosa Audio',
      html: personalizedHtml,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return res.status(500).json({ error: 'Quote updated but email failed to send' })
    }

    // 4. Notify Andy
    const formattedDate = quoteData.eventDate
      ? new Date(quoteData.eventDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : null

    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `✏️ Quote Updated — ${clientName}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#dc5f14;">✏️ Quote Updated</h2>
          <p>You updated and resent the quote for <strong>${clientName}</strong> (${to}).</p>
          <p><strong>Total:</strong> $${quoteData.total}</p>
          <p><strong>Package:</strong> ${quoteData.packageName}</p>
          ${formattedDate ? `<p><strong>Event Date:</strong> ${formattedDate}</p>` : ''}
          ${quoteData.venue ? `<p><strong>Venue:</strong> ${quoteData.venue}</p>` : ''}
          <p><strong>Quote Link:</strong> <a href="${quoteLink}">${quoteLink}</a></p>
        </div>
      `,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Update quote error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

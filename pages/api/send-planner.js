// FILE LOCATION: pages/api/send-quote.js
// Saves quote to DB, generates unique link, sends branded email to client

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, clientName, subject, html, quoteData } = req.body
  if (!to || !html) return res.status(400).json({ error: 'Missing required fields' })

  try {
    // 1. Save quote to database
    const { data: quote, error: dbError } = await supabaseAdmin
      .from('quotes')
      .insert({
        client_name: quoteData.clientName,
        client_email: quoteData.clientEmail,
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
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      return res.status(500).json({ error: 'Failed to save quote' })
    }

    const quoteLink = `https://www.tascosaaudio.com/pay?quote=${quote.id}`

    // 2. Replace the generic pay link with the quote-specific link
    const personalizedHtml = html
      .replace('https://www.tascosaaudio.com/pay', quoteLink)
      .replace('Review, Sign &amp; Pay Deposit →', 'Review, Sign & Pay Deposit →')

    // 3. Send email to client
    const { error: emailError } = await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to,
      replyTo: 'andy@tascosaaudio.com',
      subject: subject || 'Your Quote from Tascosa Audio',
      html: personalizedHtml,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    // 4. Notify Andy
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `📋 Quote Sent — ${clientName}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#dc5f14;">📋 Quote Sent</h2>
          <p>You just sent a quote to <strong>${clientName}</strong> (${to}).</p>
          <p><strong>Total:</strong> $${quoteData.total}</p>
          <p><strong>Package:</strong> ${quoteData.packageName}</p>
          ${quoteData.eventDate ? `<p><strong>Event Date:</strong> ${quoteData.eventDate}</p>` : ''}
          ${quoteData.venue ? `<p><strong>Venue:</strong> ${quoteData.venue}</p>` : ''}
          <p><strong>Quote Link:</strong> <a href="${quoteLink}">${quoteLink}</a></p>
        </div>
      `,
    })

    return res.status(200).json({ success: true, quoteId: quote.id })
  } catch (err) {
    console.error('Send quote error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

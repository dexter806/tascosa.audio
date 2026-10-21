// FILE LOCATION: pages/api/resend-quote.js
// Resends an existing quote email to a (possibly different) email address
// Does NOT create a new quote row — uses the existing quote ID

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { quoteId, toEmail } = req.body
  if (!quoteId || !toEmail) return res.status(400).json({ error: 'Missing quoteId or toEmail' })

  try {
    // 1. Fetch the existing quote
    const { data: quote, error: dbError } = await supabaseAdmin
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (dbError || !quote) {
      console.error('DB error:', dbError)
      return res.status(404).json({ error: 'Quote not found' })
    }

    const quoteLink = `https://www.tascosaaudio.com/pay?quote=${quote.id}`
    const eventDateFormatted = formatDate(quote.event_date)

    // 2. Rebuild the quote email HTML (same style as the original send)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Quote from Tascosa Audio</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0a0a0a;">

    <!-- Header -->
    <div style="background:#111111;border-bottom:3px solid #dc5f14;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">
        TASCOSA <span style="color:#dc5f14;">AUDIO</span>
      </h1>
      <p style="margin:6px 0 0;font-size:12px;color:#666;letter-spacing:2px;text-transform:uppercase;">
        DJ &amp; Live Sound — Amarillo, TX
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="color:#ccc;font-size:16px;margin:0 0 8px;">Hi ${quote.client_name},</p>
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 32px;">
        Here's your quote from Tascosa Audio. Review the details below and use the button to sign and submit your deposit when you're ready.
      </p>

      <!-- Quote card -->
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:28px;margin-bottom:28px;">
        <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#dc5f14;">
          Quote Summary
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#888;font-size:13px;">Package</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#fff;font-size:13px;font-weight:600;text-align:right;">${quote.package_name}</td>
          </tr>
          ${eventDateFormatted ? `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#888;font-size:13px;">Event Date</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#fff;font-size:13px;font-weight:600;text-align:right;">${eventDateFormatted}</td>
          </tr>` : ''}
          ${quote.venue ? `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#888;font-size:13px;">Venue</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#fff;font-size:13px;font-weight:600;text-align:right;">${quote.venue}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#888;font-size:13px;">Base Price</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#fff;font-size:13px;font-weight:600;text-align:right;">$${(quote.base_price || 0).toFixed(2)}</td>
          </tr>
          ${(quote.travel_fee > 0) ? `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#888;font-size:13px;">${quote.travel_label || 'Travel Fee'}</td>
            <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#fff;font-size:13px;font-weight:600;text-align:right;">$${(quote.travel_fee || 0).toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:12px 0 0;color:#888;font-size:13px;">Total</td>
            <td style="padding:12px 0 0;color:#dc5f14;font-size:18px;font-weight:900;text-align:right;">$${(quote.total || 0).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      ${quote.notes ? `
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#666;">Notes</p>
        <p style="margin:0;color:#ccc;font-size:14px;line-height:1.6;">${quote.notes}</p>
      </div>` : ''}

      <!-- Deposit note -->
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-left:3px solid #dc5f14;border-radius:12px;padding:20px;margin-bottom:32px;">
        <p style="margin:0;color:#ccc;font-size:13px;line-height:1.7;">
          A <strong style="color:#fff;">$${(quote.deposit || 200).toFixed(2)} deposit</strong> is due to reserve your date.
          The remaining balance of <strong style="color:#fff;">$${((quote.total || 0) - (quote.deposit || 200)).toFixed(2)}</strong> is due on the day of your event.
        </p>
      </div>

      <!-- CTA button -->
      <div style="text-align:center;margin-bottom:32px;">
        <a href="${quoteLink}"
           style="display:inline-block;background:#dc5f14;color:#000000;font-weight:900;font-size:15px;padding:16px 40px;border-radius:50px;text-decoration:none;letter-spacing:0.3px;">
          Review, Sign &amp; Pay Deposit →
        </a>
      </div>

      <p style="color:#555;font-size:13px;text-align:center;margin:0;">
        Questions? Reply to this email or call/text Andy directly.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1f1f1f;padding:24px 40px;text-align:center;">
      <p style="margin:0;color:#444;font-size:11px;">
        Tascosa Audio · Amarillo, TX · <a href="https://www.tascosaaudio.com" style="color:#dc5f14;text-decoration:none;">tascosaaudio.com</a>
      </p>
    </div>

  </div>
</body>
</html>`

    // 3. Send to the new/updated email
    const { error: emailError } = await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: toEmail,
      replyTo: 'andy@tascosaaudio.com',
      subject: `Your Quote from Tascosa Audio`,
      html,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    // 4. Notify Andy
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `📋 Quote Resent — ${quote.client_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#dc5f14;">📋 Quote Resent</h2>
          <p>You resent the quote for <strong>${quote.client_name}</strong> to <strong>${toEmail}</strong>.</p>
          <p><strong>Total:</strong> $${(quote.total || 0).toFixed(2)}</p>
          <p><strong>Package:</strong> ${quote.package_name}</p>
          ${eventDateFormatted ? `<p><strong>Event Date:</strong> ${eventDateFormatted}</p>` : ''}
          <p><strong>Quote Link:</strong> <a href="${quoteLink}">${quoteLink}</a></p>
        </div>
      `,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Resend quote error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

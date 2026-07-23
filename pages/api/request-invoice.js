// FILE LOCATION: pages/api/request-invoice.js
// Fires when a client requests a Stripe invoice from the pay page

import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { signature, addOns, addOnTotal } = req.body

  const addOnList = [
    addOns?.rehearsal ? 'Rehearsal Coverage (+$150)' : null,
    addOns?.extraHoursBefore > 0 ? `Extra Hours Before Midnight x${addOns.extraHoursBefore} (+$${addOns.extraHoursBefore * 100})` : null,
    addOns?.extraHoursAfter > 0 ? `Extra Hours After Midnight x${addOns.extraHoursAfter} (+$${addOns.extraHoursAfter * 200})` : null,
  ].filter(Boolean)

  const totalDue = 200 + (addOnTotal || 0)
  const signedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  try {
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `💳 Invoice Requested — ${signature}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#dc5f14;">Invoice Requested</h2>
          <p><strong>${signature}</strong> has signed their quote and is requesting a Stripe invoice.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <p><strong>Signed by:</strong> ${signature}</p>
          <p><strong>Date:</strong> ${signedDate}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <h3 style="margin-bottom:8px;">Quote Breakdown</h3>
          <p><strong>Deposit:</strong> $200.00</p>
          ${addOnList.length > 0 ? `
          <p><strong>Add-ons:</strong></p>
          <ul>${addOnList.map(a => `<li>${a}</li>`).join('')}</ul>
          <p><strong>Add-on Total:</strong> $${addOnTotal}</p>
          ` : '<p>No add-ons selected.</p>'}
          <p style="font-size:18px;font-weight:bold;color:#dc5f14;">Total Invoice Amount: $${totalDue}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <p style="color:#888;font-size:13px;">Please send them a Stripe invoice at your earliest convenience.</p>
        </div>
      `,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Invoice request error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

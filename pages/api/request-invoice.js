// FILE LOCATION: pages/api/request-invoice.js
// Fires when a client requests a Stripe invoice from the pay page

import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { signature, addOns, addOnTotal } = req.body

  const addOnList = [
    addOns.rehearsal ? 'Rehearsal Coverage (+$150)' : null,
    addOns.extraHoursBefore > 0 ? `Extra Hours Before Midnight x${addOns.extraHoursBefore} (+$${addOns.extraHoursBefore * 100})` : null,
    addOns.extraHoursAfter > 0 ? `Extra Hours After Midnight x${addOns.extraHoursAfter} (+$${addOns.extraHoursAfter * 200})` : null,
  ].filter(Boolean)

  try {
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `💳 Invoice Requested — ${signature}`,
      text: `${signature} has signed their quote and is requesting a Stripe invoice for their deposit.

Signed by: ${signature}
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Add-ons requested:
${addOnList.length > 0 ? addOnList.join('\n') : 'None'}
${addOnTotal > 0 ? `\nAdd-on total: $${addOnTotal}` : ''}

Deposit due: $200
Please send them a Stripe invoice at your earliest convenience.`,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Invoice request error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

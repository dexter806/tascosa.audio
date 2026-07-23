// FILE LOCATION: pages/api/quote-signed.js
// Fires when a client signs the quote and hits "Sign & Continue to Payment"
// Notifies Andy immediately with signature, add-ons, and new total

import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { signature, addOns, addOnTotal } = req.body

  const addOnList = [
    addOns?.rehearsal ? 'Rehearsal Coverage — +$150' : null,
    addOns?.extraHoursBefore > 0 ? `Extra Hours Before Midnight x${addOns.extraHoursBefore} — +$${addOns.extraHoursBefore * 100}` : null,
    addOns?.extraHoursAfter > 0 ? `Extra Hours After Midnight x${addOns.extraHoursAfter} — +$${addOns.extraHoursAfter * 200}` : null,
  ].filter(Boolean)

  const totalDue = 200 + (addOnTotal || 0)
  const signedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  try {
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `✍️ Quote Signed — ${signature}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#dc5f14;">✍️ Quote Signed!</h2>
          <p><strong>${signature}</strong> has signed their Tascosa Audio quote and is proceeding to payment.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <p><strong>Signature:</strong> <em>${signature}</em></p>
          <p><strong>Signed at:</strong> ${signedDate}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <h3 style="margin-bottom:8px;">Quote Breakdown</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 0;">Deposit (non-refundable)</td>
              <td style="text-align:right;padding:8px 0;font-weight:bold;">$200.00</td>
            </tr>
            ${addOnList.map(a => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 0;color:#666;">${a.split(' — ')[0]}</td>
              <td style="text-align:right;padding:8px 0;color:#dc5f14;">${a.split(' — ')[1]}</td>
            </tr>`).join('')}
            <tr>
              <td style="padding:12px 0;font-size:16px;font-weight:bold;">Total Due Now</td>
              <td style="text-align:right;padding:12px 0;font-size:18px;font-weight:bold;color:#dc5f14;">$${totalDue}.00</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          ${addOnList.length > 0 ? `<p style="color:#888;font-size:13px;">⚠️ Client selected add-ons. Update their contract total if they pay via Venmo/Cash App/Zelle. If they request an invoice you'll get a separate email.</p>` : ''}
          <p style="color:#888;font-size:13px;">Client is now on the payment page choosing how to pay their deposit.</p>
        </div>
      `,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Quote signed error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

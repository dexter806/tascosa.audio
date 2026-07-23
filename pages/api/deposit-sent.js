// FILE LOCATION: pages/api/deposit-sent.js
// Fires when a client clicks "I've Sent My Deposit" on the pay page
// Notifies Andy to go check Venmo/Cash App/Zelle

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
  const sentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  try {
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `💰 Deposit Sent — ${signature}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
          <h2 style="color:#dc5f14;">💰 Deposit Sent!</h2>
          <p><strong>${signature}</strong> has indicated they've sent their deposit. Go check your Venmo, Cash App, or Zelle!</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <p><strong>Client:</strong> ${signature}</p>
          <p><strong>Sent at:</strong> ${sentDate}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <h3 style="margin-bottom:8px;">Expected Amount</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 0;">Deposit</td>
              <td style="text-align:right;padding:8px 0;font-weight:bold;">$200.00</td>
            </tr>
            ${addOnList.map(a => `
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 0;color:#666;">${a.split(' — ')[0]}</td>
              <td style="text-align:right;padding:8px 0;color:#dc5f14;">${a.split(' — ')[1]}</td>
            </tr>`).join('')}
            <tr>
              <td style="padding:12px 0;font-weight:bold;">Total Expected</td>
              <td style="text-align:right;padding:12px 0;font-size:18px;font-weight:bold;color:#dc5f14;">$${totalDue}.00</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <p style="color:#888;font-size:13px;">Once you confirm receipt, send them a booking confirmation email.</p>
          <div style="background:#fff8f0;border:1px solid #fde8d0;border-radius:8px;padding:12px;margin-top:12px;">
            <p style="margin:0;font-size:13px;color:#dc5f14;font-weight:bold;">📱 Check: Venmo (@TascosaAudio) · Cash App ($tascosaaudio) · Zelle (andy@tascosaaudio.com)</p>
          </div>
        </div>
      `,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Deposit sent notification error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

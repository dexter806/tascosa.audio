// FILE LOCATION: pages/api/quote-signed.js
// Fires when a client signs the quote and hits "Sign & Continue to Payment"

import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { signature, clientName, packageName, addOns, addOnTotal, grandTotal, deposit } = req.body

  // Only list NEW add-ons the client added on the pay page
  const newAddOns = [
    addOns?.rehearsalAdded ? 'Rehearsal Coverage (added by client) — +$150' : null,
    addOns?.extraHoursBeforeAdded > 0 ? `Extra Hours Before Midnight x${addOns.extraHoursBeforeAdded} (added by client) — +$${addOns.extraHoursBeforeAdded * 100}` : null,
    addOns?.extraHoursAfterAdded > 0 ? `Extra Hours After Midnight x${addOns.extraHoursAfterAdded} (added by client) — +$${addOns.extraHoursAfterAdded * 200}` : null,
  ].filter(Boolean)

  const balanceDue = (grandTotal || 0) - (deposit || 200)
  const signedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  try {
    // Save signature to database
    if (quoteId) {
      await supabaseAdmin
        .from('quotes')
        .update({
          signed_by: signature,
          signed_at: new Date().toISOString(),
          signed_grand_total: grandTotal || 0,
          add_on_total: addOnTotal || 0,
        })
        .eq('id', quoteId)
    }

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
          ${packageName ? `<p><strong>Package:</strong> ${packageName}</p>` : ''}
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <h3 style="margin-bottom:8px;">Quote Breakdown</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 0;">Grand Total</td>
              <td style="text-align:right;padding:8px 0;font-weight:bold;">$${(grandTotal || 0).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 0;color:#dc5f14;">Deposit Due Now</td>
              <td style="text-align:right;padding:8px 0;color:#dc5f14;font-weight:bold;">$${(deposit || 200).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:8px 0;color:#666;">Balance Due (1 week before event)</td>
              <td style="text-align:right;padding:8px 0;color:#666;">$${balanceDue.toFixed(2)}</td>
            </tr>
          </table>
          ${newAddOns.length > 0 ? `
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <h4 style="margin-bottom:8px;color:#dc5f14;">⚠️ Client Added Extra Items</h4>
          <ul style="padding-left:16px;color:#666;font-size:13px;">
            ${newAddOns.map(a => `<li>${a.split(' — ')[0]}</li>`).join('')}
          </ul>
          <p style="font-size:13px;color:#888;">Add-on total: +$${addOnTotal}. Update their contract total if they pay via Venmo/Cash App/Zelle.</p>
          ` : '<p style="color:#888;font-size:13px;">No add-ons selected beyond what was quoted.</p>'}
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
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

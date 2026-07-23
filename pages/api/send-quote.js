// FILE LOCATION: pages/api/send-quote.js
// Sends the formatted quote email to the client via Resend

import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, clientName, subject, html } = req.body

  if (!to || !html) return res.status(400).json({ error: 'Missing required fields' })

  try {
    const { error } = await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to,
      replyTo: 'andy@tascosaaudio.com',
      subject: subject || 'Your Quote from Tascosa Audio',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return res.status(500).json({ error: 'Failed to send email' })
    }

    // Also notify Andy
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `📋 Quote Sent — ${clientName}`,
      text: `You just sent a quote to ${clientName} (${to}).\n\nSubject: ${subject}`,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Send quote error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

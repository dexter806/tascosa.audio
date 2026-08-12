// FILE LOCATION: pages/api/venue-remove-client.js

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { venueName, clientName, clientId } = req.body

  const profileLink = `https://tascosaaudio.com/admin/client/${clientId}`

  try {
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `🗑 Client Removed by ${venueName}`,
      text: `Hey Andy!\n\n${venueName} has removed a client from their portal.\n\nClient: ${clientName}\n\nTheir record has been marked inactive but is still in the database.\n\nView their profile:\n${profileLink}\n\nTascosa Audio`,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('venue-remove-client error:', err)
    return res.status(500).json({ error: 'Failed to send notification' })
  }
}

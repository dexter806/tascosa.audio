// FILE LOCATION: pages/api/venue-add-client.js

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const {
    venueName,
    clientId,
    person1Name,
    person1Email,
    person1Phone,
    person2Name,
    person2Email,
    weddingDate,
  } = req.body

  const profileLink = `https://tascosaaudio.com/admin/client/${clientId}`
  const formattedDate = weddingDate
    ? new Date(weddingDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : 'Date not provided'

  try {
    await resend.emails.send({
      from: 'info@tascosaaudio.com',
      to: 'andy@tascosaaudio.com',
      subject: `📋 New Client Added by ${venueName}`,
      text: `Hey Andy!\n\n${venueName} just added a new client to their portal.\n\nClient Details:\nName: ${person1Name}\nEmail: ${person1Email || 'Not provided'}\nPhone: ${person1Phone || 'Not provided'}\nWedding Date: ${formattedDate}${person2Name ? `\n\nSecond Person:\nName: ${person2Name}\nEmail: ${person2Email || 'Not provided'}` : ''}\n\nView their profile:\n${profileLink}\n\nTascosa Audio`,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('venue-add-client error:', err)
    return res.status(500).json({ error: 'Failed to send notification' })
  }
}

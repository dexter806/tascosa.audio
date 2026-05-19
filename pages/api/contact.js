// FILE LOCATION: pages/api/contact.js
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO USE THIS FILE:
// 1. In your GitHub repo, click into the "pages" folder
// 2. Click "Add file" → "Create new file"
// 3. In the filename box type:  api/contact.js
//    (GitHub will create the api folder automatically when you type the slash)
// 4. Copy and paste ALL of this code in
// 5. Click "Commit changes"
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Change FROM_EMAIL once your domain is verified in Resend ─────────────────
// Until then, the sandbox address below will deliver to your Resend account email.
// Once tascosaaudio.com is verified inside Resend, change FROM_EMAIL to:
// "info@tascosaaudio.com"
const FROM_EMAIL = "onboarding@resend.dev";
const TO_EMAIL   = "info@tascosaaudio.com";
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {

  // Only allow POST requests — anything else gets rejected
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { name, email, phone, service, pkg, eventDate, message } = req.body;

    // Basic check — name and email are required
    if (!name || !email || !service) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Build the email that lands in your inbox
    const emailBody = `
New Quote Request — Tascosa Audio
══════════════════════════════════════

Name:        ${name}
Email:       ${email}
Phone:       ${phone || "Not provided"}
Service:     ${service}
${pkg        ? `Package:     ${pkg}` : ""}
${eventDate  ? `Event Date:  ${eventDate}` : ""}

Details:
${message || "No details provided."}

══════════════════════════════════════
Submitted via tascosaaudio.com
    `.trim();

    // Send the email via Resend
    const { error } = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      TO_EMAIL,
      replyTo: email,          // So you can hit Reply in Gmail and it goes straight to the customer
      subject: `New Quote Request from ${name} — ${service}`,
      text:    emailBody,
    });

    // If Resend returns an error, tell the frontend
    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email." });
    }

    // All good — tell the frontend it worked
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}

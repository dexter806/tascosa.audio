import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { name, email, phone, service, pkg, eventDate, message } = req.body;

    if (!name || !email || !service) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const emailBody = `
New Quote Request — Tascosa Audio

Name:        ${name}
Email:       ${email}
Phone:       ${phone || "Not provided"}
Service:     ${service}
${pkg        ? `Package:     ${pkg}` : ""}
${eventDate  ? `Event Date:  ${eventDate}` : ""}

Details:
${message || "No details provided."}

Submitted via tascosaaudio.com
    `.trim();

    const { error } = await resend.emails.send({
      from:    "info@tascosaaudio.com",
      to:      "andy@tascosaaudio.com",
      replyTo: email,
      subject: `New Quote Request from ${name} — ${service}`,
      text:    emailBody,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email." });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}

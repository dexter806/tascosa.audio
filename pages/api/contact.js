// FILE LOCATION: /app/api/contact/route.js
// (Place this file at that exact path inside your Next.js project)
//
// SETUP STEPS:
// 1. Go to resend.com → sign up free → create an API key
// 2. In Vercel dashboard → your project → Settings → Environment Variables
//    Add: RESEND_API_KEY = (your key from Resend)
// 3. Run locally: create a .env.local file in your project root with:
//    RESEND_API_KEY=your_key_here
// 4. In Resend, verify your sending domain OR use their free sandbox:
//    onboarding@resend.dev (sandbox, receives to your account email only)
//    Once your domain tascosaaudio.com is verified, change FROM_EMAIL below.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Change these once your domain is verified in Resend ───────────────────
const FROM_EMAIL = "onboarding@resend.dev";        // → change to: "info@tascosaaudio.com"
const TO_EMAIL   = "info@tascosaaudio.com";        // Where quotes land in your inbox
// ───────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, service, pkg, eventDate, message } = body;

    // Basic server-side validation
    if (!name || !email || !service) {
      return Response.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const emailBody = `
New Quote Request — Tascosa Audio
══════════════════════════════════════

Name:        ${name}
Email:       ${email}
Phone:       ${phone || "Not provided"}
Service:     ${service}
${pkg       ? `Package:     ${pkg}\n` : ""}
${eventDate ? `Event Date:  ${eventDate}\n` : ""}
Details:
${message || "No details provided."}

══════════════════════════════════════
Submitted via tascosaaudio.com
    `.trim();

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to:   TO_EMAIL,
      replyTo: email,
      subject: `New Quote Request from ${name} — ${service}`,
      text: emailBody,
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error: "Failed to send email." }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error("API route error:", err);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}

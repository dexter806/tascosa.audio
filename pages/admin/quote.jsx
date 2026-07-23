// FILE LOCATION: pages/admin/quote.jsx
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_USER_ID = '8ce9e75b-9309-4ce9-8d01-9e840431c572'

const PACKAGES = [
  {
    id: 'private_party', name: 'Private Party', price: 600,
    description: 'Perfect for private events and celebrations',
    features: ['DJ Service', 'Dinner/Party Music', 'Wireless Mic', 'Dance Lighting'],
  },
  {
    id: 'wedding_reception', name: 'Wedding Reception', price: 900,
    description: '4 hours · Reception only, no ceremony',
    features: ['Up to 4 hours of MC/DJ Service', 'Reception/Dinner Music', 'Wireless Mic', 'Dance Lighting'],
  },
  {
    id: 'full_service', name: 'Wedding Full Service', price: 1250,
    description: '6 hours · Ceremony + Reception',
    features: ['Up to 6 hours of MC/DJ Service', 'Ceremony Music', 'Reception/Dinner Music', 'Wireless Mics', 'Dance Lighting'],
  },
  {
    id: 'partner_venue', name: 'Partner Venue Deal', price: 1000,
    description: '6 hours · Special rate for partner venues',
    features: ['Up to 6 hours of MC/DJ Service', 'Ceremony Music', 'Reception/Dinner Music', 'Wireless Mics', 'Dance Lighting'],
  },
]

const TRAVEL_FEES = [
  { label: '0–30 miles', fee: 0 },
  { label: '31–60 miles', fee: 50 },
  { label: '61–100 miles', fee: 75 },
  { label: '100+ miles', fee: 125 },
]

const PAYMENT_METHODS = [
  { id: 'venmo', label: 'Venmo', icon: '💜' },
  { id: 'cashapp', label: 'Cash App', icon: '💚' },
  { id: 'zelle', label: 'Zelle', icon: '🔵' },
  { id: 'invoice', label: 'Invoice', icon: '📄' },
]

export default function QuoteBuilder() {
  const router = useRouter()

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [venue, setVenue] = useState('')
  const [eventType, setEventType] = useState('')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [customPrice, setCustomPrice] = useState('')
  const [useCustomPrice, setUseCustomPrice] = useState(false)
  const [extraHours, setExtraHours] = useState(0)
  const [extraHoursAfterMidnight, setExtraHoursAfterMidnight] = useState(0)
  const [rehearsal, setRehearsal] = useState(false)
  const [travelFeeIdx, setTravelFeeIdx] = useState(0)
  const [deposit, setDeposit] = useState(200)
  const [selectedPayments, setSelectedPayments] = useState(['venmo', 'cashapp', 'zelle', 'invoice'])
  const [notes, setNotes] = useState('')
  const [sendStatus, setSendStatus] = useState('idle')
  const [previewMode, setPreviewMode] = useState(false)

  const basePrice = useCustomPrice
    ? (parseFloat(customPrice) || 0)
    : (selectedPackage ? PACKAGES.find(p => p.id === selectedPackage)?.price || 0 : 0)

  const extraHoursCost = (extraHours * 100) + (extraHoursAfterMidnight * 200)
  const rehearsalCost = rehearsal ? 150 : 0
  const travelCost = TRAVEL_FEES[travelFeeIdx].fee
  const total = basePrice + extraHoursCost + rehearsalCost + travelCost
  const balanceDue = total - deposit
  const pkg = PACKAGES.find(p => p.id === selectedPackage)

  async function sendQuote() {
    if (!clientEmail || !clientName || !selectedPackage) {
      alert('Please fill in client name, email, and select a package.')
      return
    }
    setSendStatus('sending')

    const lineItems = [
      { label: pkg?.name || 'Package', amount: basePrice },
      ...(extraHours > 0 ? [{ label: `Extra Hours (${extraHours}hr @ $100/hr)`, amount: extraHours * 100 }] : []),
      ...(extraHoursAfterMidnight > 0 ? [{ label: `Extra Hours After Midnight (${extraHoursAfterMidnight}hr @ $200/hr)`, amount: extraHoursAfterMidnight * 200 }] : []),
      ...(rehearsal ? [{ label: 'Rehearsal Coverage', amount: 150 }] : []),
      ...(travelCost > 0 ? [{ label: `Travel Fee (${TRAVEL_FEES[travelFeeIdx].label})`, amount: travelCost }] : []),
    ]

    const formattedDate = eventDate
      ? new Date(eventDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : ''

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .header { background: #0f0f0f; padding: 30px; text-align: center; }
  .header h1 { color: white; margin: 15px 0 5px; font-size: 22px; }
  .header p { color: #dc5f14; margin: 0; font-size: 14px; }
  .body { padding: 30px; }
  .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
  .quote-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .quote-table th { background: #0f0f0f; color: white; padding: 10px 14px; text-align: left; font-size: 13px; }
  .quote-table td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 14px; }
  .quote-table .amount { text-align: right; }
  .total-row { background: #f9f9f9; font-weight: bold; }
  .deposit-row { color: #dc5f14; font-weight: bold; }
  .sign-section { border: 2px solid #dc5f14; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
  .sign-section h3 { margin: 0 0 10px; color: #dc5f14; font-size: 16px; }
  .sign-section p { font-size: 13px; color: #555; margin: 0 0 16px; line-height: 1.6; }
  .sign-btn { display: block; background: #dc5f14; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; }
  .notes { background: #fffbf0; border-left: 3px solid #dc5f14; padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 14px; color: #555; }
  .footer { background: #0f0f0f; padding: 20px; text-align: center; color: #888; font-size: 12px; }
  .footer a { color: #dc5f14; text-decoration: none; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>Your Quote from Tascosa Audio</h1>
    <p>Professional DJ &amp; Audio Services &middot; Amarillo, TX</p>
  </div>
  <div class="body">
    <p class="greeting">Hi ${clientName},</p>
    <p class="greeting">Thank you for your interest in Tascosa Audio! Here&apos;s your personalized quote:</p>

    ${eventDate || venue || eventType ? `
    <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:bold;">Event Details</p>
      <table style="width:100%;border-collapse:collapse;">
        ${formattedDate ? `<tr><td style="padding:6px 0;color:#888;font-size:14px;width:110px;">Date</td><td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">${formattedDate}</td></tr>` : ''}
        ${venue ? `<tr><td style="padding:6px 0;color:#888;font-size:14px;width:110px;">Venue</td><td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">${venue}</td></tr>` : ''}
        ${eventType ? `<tr><td style="padding:6px 0;color:#888;font-size:14px;width:110px;">Event Type</td><td style="padding:6px 0;color:#333;font-size:14px;font-weight:600;">${eventType}</td></tr>` : ''}
      </table>
    </div>` : ''}

    <table class="quote-table">
      <thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead>
      <tbody>
        ${lineItems.map(item => `<tr><td>${item.label}</td><td class="amount">$${item.amount.toFixed(2)}</td></tr>`).join('')}
        <tr class="total-row"><td><strong>Total</strong></td><td class="amount"><strong>$${total.toFixed(2)}</strong></td></tr>
        <tr class="deposit-row"><td>Deposit Due to Reserve Your Date</td><td class="amount">$${deposit.toFixed(2)}</td></tr>
        <tr><td style="color:#333;">Balance Due (1 week before event)</td><td class="amount" style="color:#333;">$${balanceDue.toFixed(2)}</td></tr>
      </tbody>
    </table>

    ${pkg ? `
    <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:bold;">What&apos;s Included</p>
      ${pkg.features.map(f => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:14px;color:#333;"><span style="color:#dc5f14;font-weight:bold;">&#10003;</span>${f}</div>`).join('')}
    </div>` : ''}

    <div style="background:#fff8f0;border:1px solid #fde8d0;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#dc5f14;font-weight:bold;">Available Add-Ons</p>
      <p style="font-size:13px;color:#666;margin:0 0 10px;">Want to customize your experience? You can add these extras:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 8px;font-size:13px;background:white;border-radius:4px;margin-bottom:4px;">&#9200; Extra Hours (before midnight)</td><td style="text-align:right;font-weight:bold;color:#dc5f14;padding:6px 8px;">$100/hr</td></tr>
        <tr><td style="padding:6px 8px;font-size:13px;">&#127769; Extra Hours (after midnight)</td><td style="text-align:right;font-weight:bold;color:#dc5f14;padding:6px 8px;">$200/hr</td></tr>
        <tr><td style="padding:6px 8px;font-size:13px;">&#127908; Rehearsal Coverage</td><td style="text-align:right;font-weight:bold;color:#dc5f14;padding:6px 8px;">$150</td></tr>
      </table>
    </div>

    <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:bold;">Deposit Payment Options</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${selectedPayments.map(id => { const m = PAYMENT_METHODS.find(m => m.id === id); return `<div style="background:white;border:1px solid #ddd;border-radius:20px;padding:6px 14px;font-size:13px;">${m.icon} ${m.label}</div>` }).join('')}
      </div>
      <p style="font-size:12px;color:#888;margin-top:10px;">Please send deposit to: @TascosaAudio (Venmo/Cash App) &middot; andy@tascosaaudio.com (Zelle) &middot; Request an invoice</p>
    </div>

    ${notes ? `<div class="notes"><strong>Notes from Andy:</strong><br/>${notes}</div>` : ''}

    <div class="sign-section">
      <h3>&#128221; Ready to Book?</h3>
      <p>To secure your date, please sign this quote and pay your $${deposit} deposit. Your date is not reserved until your deposit is received.</p>
      <a href="https://www.tascosaaudio.com/pay" class="sign-btn">Review, Sign &amp; Pay Deposit &rarr;</a>
    </div>

    <p style="font-size:13px;color:#888;">Questions? Call or text Andy directly at <strong>806-670-7913</strong> or reply to this email.</p>
  </div>
  <div class="footer">
    <p>Tascosa Audio &middot; Amarillo, TX &middot; <a href="https://www.tascosaaudio.com">tascosaaudio.com</a></p>
    <p>andy@tascosaaudio.com &middot; 806-670-7913</p>
  </div>
</div>
</body>
</html>`

    const res = await fetch('/api/send-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: clientEmail,
        clientName,
        subject: `Your Quote from Tascosa Audio${eventDate ? ` — ${formattedDate}` : ''}`,
        html: emailHtml,
        quoteData: {
          clientName,
          clientEmail,
          eventDate,
          venue,
          eventType,
          packageId: selectedPackage,
          packageName: pkg?.name,
          basePrice,
          extraHoursBefore: extraHours,
          extraHoursAfter: extraHoursAfterMidnight,
          rehearsal,
          travelFee: travelCost,
          travelLabel: TRAVEL_FEES[travelFeeIdx].label,
          deposit,
          total,
          notes,
        },
      }),
    })

    if (res.ok) {
      setSendStatus('sent')
      setTimeout(() => setSendStatus('idle'), 5000)
    } else {
      setSendStatus('error')
      setTimeout(() => setSendStatus('idle'), 4000)
    }
  }

  return (
    <>
      <Head>
        <title>Quote Builder — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/quotes')} className="text-neutral-400 hover:text-white transition-colors text-sm">
                ← Quotes
              </button>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-sm">New Quote</span>
            </div>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`text-xs border rounded-xl px-3 py-2 transition-all ${previewMode ? 'border-tascosa-orange text-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
            >
              {previewMode ? '✏️ Hide Preview' : '👁 Preview Email'}
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-6">

            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Client Info */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Client Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Client Name *</label>
                    <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Sarah & John Smith" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Email Address *</label>
                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Event Date</label>
                      <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Event Type</label>
                      <input value={eventType} onChange={e => setEventType(e.target.value)} placeholder="Wedding, Party..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Venue</label>
                    <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Iron Rose, Knotting Hill..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                </div>
              </div>

              {/* Package */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Package *
                </h2>
                <div className="space-y-2">
                  {PACKAGES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPackage(p.id); setUseCustomPrice(false) }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selectedPackage === p.id && !useCustomPrice ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800 hover:border-neutral-700'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white">{p.name}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{p.description}</p>
                          {selectedPackage === p.id && !useCustomPrice && (
                            <ul className="mt-2 space-y-1">
                              {p.features.map(f => (
                                <li key={f} className="text-xs text-neutral-300 flex items-center gap-1.5">
                                  <span className="text-tascosa-orange">✓</span> {f}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <span className={`text-lg font-black ml-4 flex-shrink-0 ${selectedPackage === p.id && !useCustomPrice ? 'text-tascosa-orange' : 'text-neutral-400'}`}>
                          ${p.price}
                        </span>
                      </div>
                    </button>
                  ))}
                  <div className={`p-4 rounded-xl border transition-all ${useCustomPrice ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setUseCustomPrice(!useCustomPrice)} className={`w-4 h-4 rounded border flex-shrink-0 ${useCustomPrice ? 'bg-tascosa-orange border-tascosa-orange' : 'border-neutral-600'}`} />
                      <span className="text-sm text-neutral-300 font-medium">Custom / Discounted Price</span>
                    </div>
                    {useCustomPrice && (
                      <div className="mt-3 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                        <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="0.00" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Add-Ons
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Extra Hours Before Midnight ($100/hr)</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setExtraHours(Math.max(0, extraHours - 1))} className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold text-lg flex items-center justify-center">−</button>
                      <span className="text-xl font-black text-white w-8 text-center">{extraHours}</span>
                      <button onClick={() => setExtraHours(extraHours + 1)} className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold text-lg flex items-center justify-center">+</button>
                      {extraHours > 0 && <span className="text-tascosa-orange font-bold ml-2">+${extraHours * 100}</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Extra Hours After Midnight ($200/hr)</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setExtraHoursAfterMidnight(Math.max(0, extraHoursAfterMidnight - 1))} className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold text-lg flex items-center justify-center">−</button>
                      <span className="text-xl font-black text-white w-8 text-center">{extraHoursAfterMidnight}</span>
                      <button onClick={() => setExtraHoursAfterMidnight(extraHoursAfterMidnight + 1)} className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold text-lg flex items-center justify-center">+</button>
                      {extraHoursAfterMidnight > 0 && <span className="text-tascosa-orange font-bold ml-2">+${extraHoursAfterMidnight * 200}</span>}
                    </div>
                  </div>
                  <button onClick={() => setRehearsal(!rehearsal)} className={`w-full p-4 rounded-xl border text-left transition-all ${rehearsal ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-white">Rehearsal Coverage</p>
                        <p className="text-xs text-neutral-500 mt-0.5">DJ present for rehearsal run-through</p>
                      </div>
                      <span className={`font-black ${rehearsal ? 'text-tascosa-orange' : 'text-neutral-400'}`}>+$150</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Travel */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Travel Fee
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {TRAVEL_FEES.map((t, idx) => (
                    <button key={idx} onClick={() => setTravelFeeIdx(idx)} className={`p-3 rounded-xl border text-left transition-all ${travelFeeIdx === idx ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
                      <p className="text-xs text-neutral-400">{t.label}</p>
                      <p className={`font-black text-sm mt-0.5 ${travelFeeIdx === idx ? 'text-tascosa-orange' : 'text-white'}`}>{t.fee === 0 ? 'Free' : `$${t.fee}`}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Payment Methods to Offer
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} onClick={() => setSelectedPayments(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} className={`p-3 rounded-xl border text-left transition-all ${selectedPayments.includes(m.id) ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
                      <span className="text-lg">{m.icon}</span>
                      <p className="text-sm font-bold text-white mt-1">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deposit */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Deposit Amount
                </h2>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <input type="number" value={deposit} onChange={e => setDeposit(parseFloat(e.target.value) || 0)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                </div>
              </div>

              {/* Notes */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Notes to Client
                </h2>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special notes, offers, or details..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
              </div>
            </div>

            {/* ── RIGHT COLUMN — SUMMARY ───────────────────────────────────── */}
            <div className="space-y-5">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sticky top-24">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Quote Summary
                </h2>

                {clientName && <p className="text-white font-bold text-lg mb-1">{clientName}</p>}
                {clientEmail && <p className="text-neutral-400 text-sm mb-4">{clientEmail}</p>}
                {eventDate && <p className="text-tascosa-orange text-sm font-semibold mb-4">{new Date(eventDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>}

                <div className="space-y-2 border-t border-neutral-800 pt-4">
                  {selectedPackage && <div className="flex justify-between text-sm"><span className="text-neutral-400">{pkg?.name}</span><span className="text-white font-bold">${basePrice.toFixed(2)}</span></div>}
                  {extraHours > 0 && <div className="flex justify-between text-sm"><span className="text-neutral-400">Extra Hours ({extraHours}hr)</span><span className="text-white">+${(extraHours * 100).toFixed(2)}</span></div>}
                  {extraHoursAfterMidnight > 0 && <div className="flex justify-between text-sm"><span className="text-neutral-400">After Midnight ({extraHoursAfterMidnight}hr)</span><span className="text-white">+${(extraHoursAfterMidnight * 200).toFixed(2)}</span></div>}
                  {rehearsal && <div className="flex justify-between text-sm"><span className="text-neutral-400">Rehearsal Coverage</span><span className="text-white">+$150.00</span></div>}
                  {travelCost > 0 && <div className="flex justify-between text-sm"><span className="text-neutral-400">Travel ({TRAVEL_FEES[travelFeeIdx].label})</span><span className="text-white">+${travelCost.toFixed(2)}</span></div>}
                </div>

                <div className="border-t border-neutral-700 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-white">Total</span>
                    <span className="font-black text-2xl text-white">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-tascosa-orange font-bold">Deposit Due</span>
                    <span className="text-tascosa-orange font-bold">${deposit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Balance Due (1 week before)</span>
                    <span className="text-neutral-400">${balanceDue.toFixed(2)}</span>
                  </div>
                </div>

                {selectedPayments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Payment Options</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedPayments.map(id => { const m = PAYMENT_METHODS.find(m => m.id === id); return <span key={id} className="text-xs bg-neutral-800 px-2.5 py-1 rounded-full text-neutral-300">{m.icon} {m.label}</span> })}
                    </div>
                  </div>
                )}

                <button
                  onClick={sendQuote}
                  disabled={sendStatus === 'sending' || sendStatus === 'sent' || !clientEmail || !selectedPackage}
                  className="w-full mt-6 rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {sendStatus === 'sending' ? 'Sending...' :
                   sendStatus === 'sent' ? '✓ Quote Sent!' :
                   sendStatus === 'error' ? 'Failed — Try Again' :
                   '📧 Send Quote to Client'}
                </button>
                {sendStatus === 'sent' && <p className="text-emerald-400 text-xs text-center mt-2">Quote sent to {clientEmail}!</p>}
                {(!clientEmail || !selectedPackage) && <p className="text-neutral-600 text-xs text-center mt-2">{!clientEmail ? 'Add client email to send' : 'Select a package to send'}</p>}
              </div>
            </div>
          </div>

          {/* ── EMAIL PREVIEW ─────────────────────────────────────────────── */}
          {previewMode && (
            <div className="mt-6 border border-tascosa-orange/30 rounded-2xl overflow-hidden">
              <div className="bg-tascosa-orange/10 border-b border-tascosa-orange/20 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-tascosa-orange"></span>
                  <p className="text-sm font-bold text-tascosa-orange">Email Preview</p>
                </div>
                <p className="text-xs text-neutral-500">How the email will look to {clientEmail || 'your client'}</p>
              </div>
              <div className="bg-white rounded-b-2xl p-6" style={{color:'#333',fontFamily:'sans-serif'}}>
                <div style={{maxWidth:'560px',margin:'0 auto'}}>
                  <div style={{background:'#0f0f0f',padding:'24px',borderRadius:'8px 8px 0 0',textAlign:'center'}}>
                    <p style={{color:'white',fontWeight:'bold',fontSize:'18px',margin:'0 0 4px'}}>Your Quote from Tascosa Audio</p>
                    <p style={{color:'#dc5f14',margin:0,fontSize:'13px'}}>Professional DJ & Audio Services · Amarillo, TX</p>
                  </div>
                  <div style={{border:'1px solid #eee',borderTop:'none',padding:'24px',borderRadius:'0 0 8px 8px'}}>
                    <p style={{fontSize:'15px'}}>Hi <strong>{clientName || '[Client Name]'}</strong>,</p>
                    <p style={{fontSize:'14px',color:'#555'}}>Thank you for your interest in Tascosa Audio! Here's your personalized quote:</p>
                    {(eventDate || venue || eventType) && (
                      <div style={{background:'#f9f9f9',borderRadius:'6px',padding:'14px',marginBottom:'16px'}}>
                        <p style={{fontSize:'11px',textTransform:'uppercase',letterSpacing:'1px',color:'#888',margin:'0 0 10px',fontWeight:'bold'}}>Event Details</p>
                        {eventDate && <div style={{display:'flex',gap:'16px',padding:'5px 0',fontSize:'13px',borderBottom:'1px solid #eee'}}><span style={{color:'#888',minWidth:'90px'}}>Date</span><span style={{fontWeight:'600'}}>{new Date(eventDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</span></div>}
                        {venue && <div style={{display:'flex',gap:'16px',padding:'5px 0',fontSize:'13px',borderBottom:'1px solid #eee'}}><span style={{color:'#888',minWidth:'90px'}}>Venue</span><span style={{fontWeight:'600'}}>{venue}</span></div>}
                        {eventType && <div style={{display:'flex',gap:'16px',padding:'5px 0',fontSize:'13px'}}><span style={{color:'#888',minWidth:'90px'}}>Event Type</span><span style={{fontWeight:'600'}}>{eventType}</span></div>}
                      </div>
                    )}
                    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'16px',fontSize:'14px'}}>
                      <thead><tr style={{background:'#0f0f0f'}}><th style={{color:'white',padding:'8px 12px',textAlign:'left'}}>Description</th><th style={{color:'white',padding:'8px 12px',textAlign:'right'}}>Amount</th></tr></thead>
                      <tbody>
                        {pkg && <tr><td style={{padding:'8px 12px',borderBottom:'1px solid #eee'}}>{pkg.name}</td><td style={{padding:'8px 12px',borderBottom:'1px solid #eee',textAlign:'right'}}>${basePrice.toFixed(2)}</td></tr>}
                        {extraHours > 0 && <tr><td style={{padding:'8px 12px',borderBottom:'1px solid #eee'}}>Extra Hours ({extraHours}hr)</td><td style={{padding:'8px 12px',borderBottom:'1px solid #eee',textAlign:'right'}}>${(extraHours*100).toFixed(2)}</td></tr>}
                        {extraHoursAfterMidnight > 0 && <tr><td style={{padding:'8px 12px',borderBottom:'1px solid #eee'}}>After Midnight ({extraHoursAfterMidnight}hr)</td><td style={{padding:'8px 12px',borderBottom:'1px solid #eee',textAlign:'right'}}>${(extraHoursAfterMidnight*200).toFixed(2)}</td></tr>}
                        {rehearsal && <tr><td style={{padding:'8px 12px',borderBottom:'1px solid #eee'}}>Rehearsal Coverage</td><td style={{padding:'8px 12px',borderBottom:'1px solid #eee',textAlign:'right'}}>$150.00</td></tr>}
                        {travelCost > 0 && <tr><td style={{padding:'8px 12px',borderBottom:'1px solid #eee'}}>Travel ({TRAVEL_FEES[travelFeeIdx].label})</td><td style={{padding:'8px 12px',borderBottom:'1px solid #eee',textAlign:'right'}}>${travelCost.toFixed(2)}</td></tr>}
                        <tr style={{fontWeight:'bold',background:'#f9f9f9'}}><td style={{padding:'8px 12px',borderBottom:'1px solid #eee'}}>Total</td><td style={{padding:'8px 12px',borderBottom:'1px solid #eee',textAlign:'right'}}>${total.toFixed(2)}</td></tr>
                        <tr style={{color:'#dc5f14',fontWeight:'bold'}}><td style={{padding:'8px 12px',borderBottom:'1px solid #eee'}}>Deposit Due Now</td><td style={{padding:'8px 12px',borderBottom:'1px solid #eee',textAlign:'right'}}>${deposit.toFixed(2)}</td></tr>
                        <tr><td style={{padding:'8px 12px'}}>Balance Due (1 week before event)</td><td style={{padding:'8px 12px',textAlign:'right'}}>${balanceDue.toFixed(2)}</td></tr>
                      </tbody>
                    </table>
                    {notes && <div style={{background:'#fffbf0',borderLeft:'3px solid #dc5f14',padding:'12px',marginBottom:'16px',fontSize:'13px',color:'#555'}}><strong>Notes from Andy:</strong><br/>{notes}</div>}
                    <div style={{border:'2px solid #dc5f14',borderRadius:'8px',padding:'16px',textAlign:'center'}}>
                      <p style={{fontWeight:'bold',color:'#dc5f14',margin:'0 0 8px',fontSize:'15px'}}>📝 Ready to Book?</p>
                      <p style={{fontSize:'13px',color:'#555',margin:'0 0 12px'}}>Sign your quote and pay your ${deposit} deposit to secure your date.</p>
                      <div style={{background:'#dc5f14',color:'white',padding:'12px',borderRadius:'6px',fontWeight:'bold'}}>Review, Sign & Pay Deposit →</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  )
}

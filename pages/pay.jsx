// FILE LOCATION: pages/pay.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tascosa Audio — Quote Sign & Pay Page
// Reads quote ID from URL: /pay?quote=<uuid>
// Shows quote details, contract terms, add-ons, signature, then payment
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PayPage() {
  const router = useRouter()
  const { quote: quoteId } = router.query

  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)

  // Add-ons (client can add more on top of what was quoted)
  const [addOns, setAddOns] = useState({
    rehearsal: false,
    extraHoursBefore: 0,
    extraHoursAfter: 0,
  })
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')
  const [invoiceStatus, setInvoiceStatus] = useState('idle')
  const [fundsSent, setFundsSent] = useState(false)
  const [showVenmoQR, setShowVenmoQR] = useState(false)
  const [showCashAppQR, setShowCashAppQR] = useState(false)
  const [showZelleQR, setShowZelleQR] = useState(false)

  useEffect(() => {
    if (!quoteId) return
    supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        setQuote(data)
        // Pre-check rehearsal if it was included in the quote
        if (data?.rehearsal) setAddOns(p => ({ ...p, rehearsal: true }))
        setLoading(false)
      })
  }, [quoteId])

  // Only count add-ons BEYOND what was already in the quote
  const rehearsalAdded = addOns.rehearsal && !quote?.rehearsal
  const extraHoursBeforeAdded = Math.max(0, addOns.extraHoursBefore - (quote?.extra_hours_before || 0))
  const extraHoursAfterAdded = Math.max(0, addOns.extraHoursAfter - (quote?.extra_hours_after || 0))
  const addOnTotal =
    (rehearsalAdded ? 150 : 0) +
    (extraHoursBeforeAdded * 100) +
    (extraHoursAfterAdded * 200)

  const grandTotal = (quote?.total || 0) + addOnTotal
  const balanceDue = grandTotal - (quote?.deposit || 200)

  function handleSign() {
    if (!agreed) { alert('Please check the agreement box.'); return }
    if (!signature.trim()) { alert('Please type your full name as your signature.'); return }

    fetch('/api/quote-signed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature,
        quoteId,
        clientName: quote?.client_name,
        packageName: quote?.package_name,
        addOns: {
          ...addOns,
          rehearsalAdded,
          extraHoursBeforeAdded,
          extraHoursAfterAdded,
        },
        addOnTotal,
        grandTotal,
        deposit: quote?.deposit || 200,
      }),
    }).catch(err => console.error('Signature notification failed:', err))

    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function requestInvoice() {
    setInvoiceStatus('sending')
    const res = await fetch('/api/request-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature,
        quoteId,
        clientName: quote?.client_name,
        packageName: quote?.package_name,
        addOns,
        addOnTotal,
        grandTotal,
        deposit: quote?.deposit || 200,
      }),
    })
    if (res.ok) setInvoiceStatus('sent')
    else setInvoiceStatus('error')
  }

  if (loading && quoteId) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading your quote...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Review & Sign — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Header */}
        <header className="border-b border-neutral-800 bg-neutral-950">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
            <img src="/TA Logo.png" alt="Tascosa Audio" className="h-8 w-auto object-contain" />
            <div>
              <p className="font-bold text-sm">Tascosa Audio</p>
              <p className="text-xs text-neutral-500">Quote Review & Agreement</p>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-10">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {['Review & Sign', 'Pay Deposit'].map((label, idx) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${step === idx + 1 ? 'text-tascosa-orange' : step > idx + 1 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border ${
                    step === idx + 1 ? 'border-tascosa-orange bg-tascosa-orange/10 text-tascosa-orange' :
                    step > idx + 1 ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400' :
                    'border-neutral-700 text-neutral-600'
                  }`}>
                    {step > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                {idx === 0 && <div className={`h-px w-8 ${step > 1 ? 'bg-emerald-400' : 'bg-neutral-700'}`} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: QUOTE + TERMS + SIGN ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">

              {/* Quote Summary */}
              {quote && (
                <div className="bg-neutral-900 border border-tascosa-orange/30 rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-1 text-tascosa-orange">Your Quote</h2>
                  {quote.client_name && <p className="text-white font-bold text-xl mb-1">{quote.client_name}</p>}
                  {quote.event_date && <p className="text-tascosa-orange text-sm font-semibold mb-4">{formatDate(quote.event_date)}</p>}
                  {quote.venue && <p className="text-neutral-400 text-sm mb-4">📍 {quote.venue}</p>}

                  <div className="space-y-2 border-t border-neutral-800 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">{quote.package_name}</span>
                      <span className="text-white font-bold">${quote.base_price?.toFixed(2)}</span>
                    </div>
                    {quote.extra_hours_before > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Extra Hours ({quote.extra_hours_before}hr before midnight)</span>
                        <span className="text-white">+${(quote.extra_hours_before * 100).toFixed(2)}</span>
                      </div>
                    )}
                    {quote.extra_hours_after > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Extra Hours ({quote.extra_hours_after}hr after midnight)</span>
                        <span className="text-white">+${(quote.extra_hours_after * 200).toFixed(2)}</span>
                      </div>
                    )}
                    {quote.rehearsal && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Rehearsal Coverage</span>
                        <span className="text-white">+$150.00</span>
                      </div>
                    )}
                    {quote.travel_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Travel ({quote.travel_label})</span>
                        <span className="text-white">+${quote.travel_fee?.toFixed(2)}</span>
                      </div>
                    )}
                    {addOnTotal > 0 && (
                      <div className="flex justify-between text-sm border-t border-neutral-800 pt-2">
                        <span className="text-tascosa-orange">Additional Add-ons</span>
                        <span className="text-tascosa-orange">+${addOnTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-neutral-700 mt-4 pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-white">Total</span>
                      <span className="font-black text-2xl text-white">${grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-tascosa-orange font-bold">Deposit Due Now</span>
                      <span className="text-tascosa-orange font-bold">${(quote.deposit || 200).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Balance Due (1 week before event)</span>
                      <span className="text-neutral-400">${balanceDue.toFixed(2)}</span>
                    </div>
                  </div>

                  {quote.notes && (
                    <div className="mt-4 pt-4 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Note from Andy</p>
                      <p className="text-sm text-neutral-300">{quote.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Contract Terms */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Contract Terms
                </h2>
                <div className="space-y-5 text-sm text-neutral-300 leading-relaxed">
                  <div>
                    <p className="font-bold text-white mb-1">Service Hours & Overtime</p>
                    <p>This booking includes service beginning at the start of the ceremony and continuing through the last dance, up until midnight.</p>
                    <p className="mt-2">Overtime before midnight: <span className="text-tascosa-orange font-semibold">$100 per additional hour.</span></p>
                    <p>Overtime after midnight: <span className="text-tascosa-orange font-semibold">$200 per additional hour.</span></p>
                    <p className="mt-2 text-neutral-400">Overtime must be approved and paid in advance or at the event before extra time begins.</p>
                  </div>
                  <div className="border-t border-neutral-800 pt-5">
                    <p className="font-bold text-white mb-1">Rehearsal & Travel Fees</p>
                    <p><span className="text-neutral-400">Rehearsals:</span> We can be available to attend rehearsals for an additional $150 fee. Attendance is subject to schedule availability and should be requested in advance.</p>
                    <p className="mt-2"><span className="text-neutral-400">Travel:</span> A travel fee applies to venues located more than 30 miles from Amarillo, TX.</p>
                    <div className="mt-2 bg-neutral-800/50 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between"><span>0–30 miles</span><span className="text-emerald-400">Free</span></div>
                      <div className="flex justify-between"><span>31–60 miles</span><span className="text-tascosa-orange">$50</span></div>
                      <div className="flex justify-between"><span>61–100 miles</span><span className="text-tascosa-orange">$75</span></div>
                      <div className="flex justify-between"><span>100+ miles</span><span className="text-tascosa-orange">$125</span></div>
                    </div>
                  </div>
                  <div className="border-t border-neutral-800 pt-5">
                    <p className="font-bold text-white mb-1">Deposit & Payment Terms</p>
                    <p>A non-refundable deposit of <span className="text-tascosa-orange font-semibold">$200</span> is required to secure your event date. The deposit is due within 5 days of signing this agreement.</p>
                    <p className="mt-2">The remaining balance (including any add-on or travel fees) is due no later than <span className="text-tascosa-orange font-semibold">one week before the event.</span></p>
                  </div>
                  <div className="border-t border-neutral-800 pt-5">
                    <p className="font-bold text-white mb-1">Cancellation Policy</p>
                    <p>The deposit is non-refundable. In the event of a cancellation, the deposit will be retained by Tascosa Audio as a reservation fee.</p>
                  </div>
                </div>
              </div>

              {/* Add-on Options */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Add-On Options
                </h2>
                <p className="text-sm text-neutral-400 mb-4">Want to add anything to your package?</p>
                <div className="space-y-3">
                  {/* Rehearsal */}
                  <button
                    onClick={() => setAddOns(p => ({ ...p, rehearsal: !p.rehearsal }))}
                    disabled={quote?.rehearsal}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${addOns.rehearsal ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800 hover:border-neutral-700'} ${quote?.rehearsal ? 'opacity-50 cursor-default' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-white">Rehearsal Coverage</p>
                        <p className="text-xs text-neutral-500">{quote?.rehearsal ? 'Already included in your quote' : 'DJ present for your rehearsal run-through'}</p>
                      </div>
                      <span className={`font-black ${addOns.rehearsal ? 'text-tascosa-orange' : 'text-neutral-400'}`}>{quote?.rehearsal ? '✓ Included' : '+$150'}</span>
                    </div>
                  </button>

                  {/* Extra hours before midnight */}
                  <div className={`p-4 rounded-xl border transition-all ${addOns.extraHoursBefore > (quote?.extra_hours_before || 0) ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-white">Extra Hours (before midnight)</p>
                        <p className="text-xs text-neutral-500">$100 per hour{quote?.extra_hours_before > 0 ? ` · ${quote.extra_hours_before}hr already quoted` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setAddOns(p => ({ ...p, extraHoursBefore: Math.max(quote?.extra_hours_before || 0, p.extraHoursBefore - 1) }))} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold flex items-center justify-center">−</button>
                        <span className="font-black text-white w-4 text-center">{addOns.extraHoursBefore}</span>
                        <button onClick={() => setAddOns(p => ({ ...p, extraHoursBefore: p.extraHoursBefore + 1 }))} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold flex items-center justify-center">+</button>
                        {addOns.extraHoursBefore > (quote?.extra_hours_before || 0) && (
                          <span className="text-tascosa-orange font-bold text-sm">+${(addOns.extraHoursBefore - (quote?.extra_hours_before || 0)) * 100}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Extra hours after midnight */}
                  <div className={`p-4 rounded-xl border transition-all ${addOns.extraHoursAfter > (quote?.extra_hours_after || 0) ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-white">Extra Hours (after midnight)</p>
                        <p className="text-xs text-neutral-500">$200 per hour{quote?.extra_hours_after > 0 ? ` · ${quote.extra_hours_after}hr already quoted` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setAddOns(p => ({ ...p, extraHoursAfter: Math.max(quote?.extra_hours_after || 0, p.extraHoursAfter - 1) }))} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold flex items-center justify-center">−</button>
                        <span className="font-black text-white w-4 text-center">{addOns.extraHoursAfter}</span>
                        <button onClick={() => setAddOns(p => ({ ...p, extraHoursAfter: p.extraHoursAfter + 1 }))} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold flex items-center justify-center">+</button>
                        {addOns.extraHoursAfter > (quote?.extra_hours_after || 0) && (
                          <span className="text-tascosa-orange font-bold text-sm">+${(addOns.extraHoursAfter - (quote?.extra_hours_after || 0)) * 200}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Agreement & Signature
                </h2>
                <p className="text-sm text-neutral-400 mb-5 leading-relaxed">
                  By signing below, you acknowledge that you have read, understood, and agree to the terms outlined above. You authorize Tascosa Audio to provide services for your event and understand that your date is not reserved until your deposit has been received.
                </p>
                <div className="mb-4">
                  <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Type Your Full Name as Signature *</label>
                  <input
                    type="text"
                    value={signature}
                    onChange={e => setSignature(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange text-lg italic"
                    style={{ fontFamily: 'Georgia, serif' }}
                  />
                  {signature && (
                    <p className="text-xs text-neutral-500 mt-1">Signed: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  )}
                </div>
                <button
                  onClick={() => setAgreed(!agreed)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${agreed ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-700 hover:border-neutral-600'}`}
                >
                  <div className={`w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${agreed ? 'bg-tascosa-orange border-tascosa-orange' : 'border-neutral-600'}`}>
                    {agreed && <span className="text-black text-xs font-black">✓</span>}
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    I have read and agree to the Tascosa Audio contract terms. I understand my date is not reserved until my ${quote?.deposit || 200} deposit is received within 5 days of signing.
                  </p>
                </button>
                <button
                  onClick={handleSign}
                  disabled={!agreed || !signature.trim()}
                  className="w-full mt-5 rounded-2xl py-4 bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Sign & Continue to Payment →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: PAYMENT ──────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">

              {/* Signed confirmation */}
              <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-5 flex items-start gap-3">
                <span className="text-emerald-400 text-xl">✓</span>
                <div>
                  <p className="font-bold text-emerald-400">Agreement Signed!</p>
                  <p className="text-sm text-neutral-400 mt-0.5">Signed by <span className="text-white font-semibold italic" style={{ fontFamily: 'Georgia, serif' }}>{signature}</span> on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Deposit summary */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Deposit Due
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Quote Total</span>
                    <span className="font-bold text-white">${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-tascosa-orange font-bold">Deposit Due Now (non-refundable)</span>
                    <span className="text-tascosa-orange font-bold">${(quote?.deposit || 200).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Balance Due (1 week before event)</span>
                    <span className="text-neutral-400">${balanceDue.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-4">Your date is not reserved until your deposit is received within 5 days.</p>
              </div>

              {/* Payment options */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Pay Your Deposit
                </h2>
                <p className="text-sm text-neutral-400 mb-5">Choose your preferred payment method below.</p>
                <div className="space-y-3">

                  {/* Venmo */}
                  <div className="border border-neutral-800 rounded-xl overflow-hidden">
                    <button onClick={() => { setShowVenmoQR(!showVenmoQR); setShowCashAppQR(false); setShowZelleQR(false) }}
                      className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💜</span>
                        <div className="text-left"><p className="font-bold text-white">Venmo</p><p className="text-xs text-neutral-500">@TascosaAudio</p></div>
                      </div>
                      <span className="text-neutral-500 text-sm">{showVenmoQR ? '▲ Hide' : '▼ Show QR'}</span>
                    </button>
                    {showVenmoQR && (
                      <div className="border-t border-neutral-800 p-6 flex flex-col items-center bg-neutral-950/50">
                        <img src="/venmo-qr.jpg" alt="Venmo QR Code" className="w-48 h-48 object-contain rounded-xl" />
                        <p className="text-sm text-neutral-400 mt-3">Scan with your camera or Venmo app</p>
                        <p className="text-tascosa-orange font-bold mt-1">@TascosaAudio</p>
                      </div>
                    )}
                  </div>

                  {/* Cash App */}
                  <div className="border border-neutral-800 rounded-xl overflow-hidden">
                    <button onClick={() => { setShowCashAppQR(!showCashAppQR); setShowVenmoQR(false); setShowZelleQR(false) }}
                      className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💚</span>
                        <div className="text-left"><p className="font-bold text-white">Cash App</p><p className="text-xs text-neutral-500">$tascosaaudio</p></div>
                      </div>
                      <span className="text-neutral-500 text-sm">{showCashAppQR ? '▲ Hide' : '▼ Show QR'}</span>
                    </button>
                    {showCashAppQR && (
                      <div className="border-t border-neutral-800 p-6 flex flex-col items-center bg-neutral-950/50">
                        <img src="/cashapp-qr.jpg" alt="Cash App QR Code" className="w-48 h-48 object-contain rounded-xl" />
                        <p className="text-sm text-neutral-400 mt-3">Scan with your camera or Cash App</p>
                        <p className="text-tascosa-orange font-bold mt-1">$tascosaaudio</p>
                      </div>
                    )}
                  </div>

                  {/* Zelle */}
                  <div className="border border-neutral-800 rounded-xl overflow-hidden">
                    <button onClick={() => { setShowZelleQR(!showZelleQR); setShowVenmoQR(false); setShowCashAppQR(false) }}
                      className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔵</span>
                        <div className="text-left"><p className="font-bold text-white">Zelle</p><p className="text-xs text-neutral-500">andy@tascosaaudio.com</p></div>
                      </div>
                      <span className="text-neutral-500 text-sm">{showZelleQR ? '▲ Hide' : '▼ Show QR'}</span>
                    </button>
                    {showZelleQR && (
                      <div className="border-t border-neutral-800 p-6 flex flex-col items-center bg-neutral-950/50">
                        <img src="/zelle-qr.jpg" alt="Zelle QR Code" className="w-48 h-48 object-contain rounded-xl" />
                        <p className="text-sm text-neutral-400 mt-3">Scan with your banking app</p>
                        <p className="text-tascosa-orange font-bold mt-1">andy@tascosaaudio.com</p>
                      </div>
                    )}
                  </div>

                  {/* Request Invoice — hide if funds sent */}
                  {!fundsSent && (
                    <div className="border border-neutral-800 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <p className="font-bold text-white">Request an Invoice</p>
                          <p className="text-xs text-neutral-500">We'll send you a Stripe invoice via email</p>
                        </div>
                      </div>
                      {invoiceStatus === 'sent' ? (
                        <div className="bg-neutral-800 rounded-xl p-3 text-center">
                          <p className="text-neutral-400 text-sm">Invoice requested — Andy will be in touch shortly.</p>
                        </div>
                      ) : (
                        <button onClick={requestInvoice} disabled={invoiceStatus === 'sending'}
                          className="w-full py-3 rounded-xl border border-neutral-700 hover:border-tascosa-orange text-neutral-300 hover:text-tascosa-orange font-bold text-sm transition-all disabled:opacity-50">
                          {invoiceStatus === 'sending' ? 'Sending request...' : 'Request Invoice →'}
                        </button>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Sent funds — hide if invoice requested */}
              {invoiceStatus !== 'sent' && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                    Sent Your Payment?
                  </h2>
                  {fundsSent ? (
                    <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-4 text-center">
                      <p className="text-emerald-400 font-bold">✓ Thanks! We've got your confirmation.</p>
                      <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                        Once your deposit is received and verified, you will receive a booking confirmation email within <span className="text-white font-semibold">24–48 hours</span>.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-neutral-400 mb-4">After sending your deposit via Venmo, Cash App, or Zelle, tap the button below to let Andy know.</p>
                      <button
                        onClick={async () => {
                          setFundsSent(true)
                          fetch('/api/deposit-sent', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              signature,
                              quoteId,
                              clientName: quote?.client_name,
                              addOns: {
                                ...addOns,
                                rehearsalAdded,
                                extraHoursBeforeAdded,
                                extraHoursAfterAdded,
                              },
                              addOnTotal,
                              grandTotal,
                              deposit: quote?.deposit || 200,
                            }),
                          }).catch(err => console.error('Deposit notification failed:', err))
                        }}
                        className="w-full py-3 rounded-xl bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 transition-all"
                      >
                        ✓ I've Sent My Deposit
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </main>

        <footer className="border-t border-neutral-800 mt-10 py-6 text-center">
          <p className="text-xs text-neutral-600">Tascosa Audio · Amarillo, TX · tascosaaudio.com · 806-670-7913</p>
        </footer>

      </div>
    </>
  )
}

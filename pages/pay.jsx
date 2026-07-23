// FILE LOCATION: pages/pay.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tascosa Audio — Quote Sign & Pay Page
// Public page — accessible via link in quote email
// Flow: Terms → Add-ons → Sign → Payment
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Head from 'next/head'

export default function PayPage() {
  const [step, setStep] = useState(1) // 1=terms, 2=payment
  const [addOns, setAddOns] = useState({
    rehearsal: false,
    extraHoursBefore: 0,
    extraHoursAfter: 0,
  })
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [invoiceStatus, setInvoiceStatus] = useState('idle')
  const [showVenmoQR, setShowVenmoQR] = useState(false)
  const [showCashAppQR, setShowCashAppQR] = useState(false)
  const [showZelleQR, setShowZelleQR] = useState(false)

  const addOnTotal =
    (addOns.rehearsal ? 150 : 0) +
    (addOns.extraHoursBefore * 100) +
    (addOns.extraHoursAfter * 200)

  function handleSign() {
    if (!agreed) { alert('Please check the agreement box.'); return }
    if (!signature.trim()) { alert('Please type your name as your signature.'); return }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function requestInvoice() {
    setInvoiceStatus('sending')
    const res = await fetch('/api/request-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature, addOns, addOnTotal }),
    })
    if (res.ok) setInvoiceStatus('sent')
    else setInvoiceStatus('error')
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

          {/* ── STEP 1: TERMS & SIGN ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">

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
                <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  Add-On Options
                </h2>
                <p className="text-sm text-neutral-400 mb-4">Would you like to add any of the following? These will be included in your invoice.</p>

                <div className="space-y-3">
                  {/* Rehearsal */}
                  <button
                    onClick={() => setAddOns(p => ({ ...p, rehearsal: !p.rehearsal }))}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${addOns.rehearsal ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800 hover:border-neutral-700'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-white">Rehearsal Coverage</p>
                        <p className="text-xs text-neutral-500 mt-0.5">DJ present for your rehearsal run-through</p>
                      </div>
                      <span className={`font-black ${addOns.rehearsal ? 'text-tascosa-orange' : 'text-neutral-400'}`}>+$150</span>
                    </div>
                  </button>

                  {/* Extra hours before midnight */}
                  <div className={`p-4 rounded-xl border transition-all ${addOns.extraHoursBefore > 0 ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-white">Extra Hours (before midnight)</p>
                        <p className="text-xs text-neutral-500 mt-0.5">$100 per hour</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setAddOns(p => ({ ...p, extraHoursBefore: Math.max(0, p.extraHoursBefore - 1) }))} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold flex items-center justify-center">−</button>
                        <span className="font-black text-white w-4 text-center">{addOns.extraHoursBefore}</span>
                        <button onClick={() => setAddOns(p => ({ ...p, extraHoursBefore: p.extraHoursBefore + 1 }))} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold flex items-center justify-center">+</button>
                        {addOns.extraHoursBefore > 0 && <span className="text-tascosa-orange font-bold text-sm">+${addOns.extraHoursBefore * 100}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Extra hours after midnight */}
                  <div className={`p-4 rounded-xl border transition-all ${addOns.extraHoursAfter > 0 ? 'border-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-800'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-white">Extra Hours (after midnight)</p>
                        <p className="text-xs text-neutral-500 mt-0.5">$200 per hour</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setAddOns(p => ({ ...p, extraHoursAfter: Math.max(0, p.extraHoursAfter - 1) }))} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold flex items-center justify-center">−</button>
                        <span className="font-black text-white w-4 text-center">{addOns.extraHoursAfter}</span>
                        <button onClick={() => setAddOns(p => ({ ...p, extraHoursAfter: p.extraHoursAfter + 1 }))} className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold flex items-center justify-center">+</button>
                        {addOns.extraHoursAfter > 0 && <span className="text-tascosa-orange font-bold text-sm">+${addOns.extraHoursAfter * 200}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {addOnTotal > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between">
                    <span className="text-sm text-neutral-400">Add-on Total</span>
                    <span className="font-black text-tascosa-orange">+${addOnTotal}</span>
                  </div>
                )}
              </div>

              {/* Signature & Agreement */}
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
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange font-semibold text-lg italic"
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
                    I have read and agree to the Tascosa Audio contract terms. I understand my date is not reserved until my $200 deposit is received within 5 days of signing.
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

              {/* Confirmation */}
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
                    <span className="text-neutral-400">Non-refundable deposit</span>
                    <span className="font-bold text-white">$200.00</span>
                  </div>
                  {addOnTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Add-ons (due with balance)</span>
                      <span className="text-neutral-400">+${addOnTotal}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500">Your date is not reserved until your $200 deposit is received. Please send payment within 5 days.</p>
                </div>
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
                    <button
                      onClick={() => { setShowVenmoQR(!showVenmoQR); setShowCashAppQR(false); setShowZelleQR(false) }}
                      className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💜</span>
                        <div className="text-left">
                          <p className="font-bold text-white">Venmo</p>
                          <p className="text-xs text-neutral-500">@TascosaAudio</p>
                        </div>
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
                    <button
                      onClick={() => { setShowCashAppQR(!showCashAppQR); setShowVenmoQR(false); setShowZelleQR(false) }}
                      className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💚</span>
                        <div className="text-left">
                          <p className="font-bold text-white">Cash App</p>
                          <p className="text-xs text-neutral-500">$tascosaaudio</p>
                        </div>
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
                    <button
                      onClick={() => { setShowZelleQR(!showZelleQR); setShowVenmoQR(false); setShowCashAppQR(false) }}
                      className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔵</span>
                        <div className="text-left">
                          <p className="font-bold text-white">Zelle</p>
                          <p className="text-xs text-neutral-500">andy@tascosaaudio.com</p>
                        </div>
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

                  {/* Request Invoice */}
                  <div className="border border-neutral-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-bold text-white">Request an Invoice</p>
                        <p className="text-xs text-neutral-500">We'll send you a Stripe invoice via email</p>
                      </div>
                    </div>
                    {invoiceStatus === 'sent' ? (
                      <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-3 text-center">
                        <p className="text-emerald-400 font-bold text-sm">✓ Invoice Requested!</p>
                        <p className="text-xs text-neutral-400 mt-1">Andy will send your Stripe invoice shortly.</p>
                      </div>
                    ) : (
                      <button
                        onClick={requestInvoice}
                        disabled={invoiceStatus === 'sending'}
                        className="w-full py-3 rounded-xl border border-neutral-700 hover:border-tascosa-orange text-neutral-300 hover:text-tascosa-orange font-bold text-sm transition-all disabled:opacity-50"
                      >
                        {invoiceStatus === 'sending' ? 'Sending request...' : 'Request Invoice →'}
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* After payment note */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 text-center">
                <p className="text-sm text-neutral-400 leading-relaxed">
                  After sending your deposit, please text or call Andy to confirm receipt.<br />
                  <span className="text-tascosa-orange font-bold">806-670-7913</span>
                </p>
              </div>

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

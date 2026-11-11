// FILE LOCATION: pages/portal/dashboard.jsx

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(dateStr)
  event.setHours(0, 0, 0, 0)
  const diff = Math.round((event - today) / (1000 * 60 * 60 * 24))
  return diff
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function Dashboard() {
  const router = useRouter()
  const [client, setClient] = useState(null)
  const [planner, setPlanner] = useState(null)
  const [weddingData, setWeddingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [displayDays, setDisplayDays] = useState(null)

  useEffect(() => {
    if (!loading && client?.wedding_date) {
      const target = daysUntil(client.wedding_date)
      if (!target || target <= 0) { setDisplayDays(target); return }

      // Short delay, then start counting — number fades/flips in on first render
      const startTimer = setTimeout(() => {
        let current = 0
        const duration = 1200
        const steps = Math.min(target, 60)
        const interval = duration / steps
        const increment = target / steps
        const timer = setInterval(() => {
          current += increment
          if (current >= target) {
            setDisplayDays(target)
            clearInterval(timer)
          } else {
            setDisplayDays(Math.floor(current))
          }
        }, interval)
      }, 400)

      return () => clearTimeout(startTimer)
    }
  }, [loading, client])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }

      let clientData = null
      const { data: data1 } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (data1) {
        clientData = data1
      } else {
        const { data: data2 } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id_2', session.user.id)
          .single()
        clientData = data2
      }

      if (!clientData || !clientData.person1_first_name) {
        router.push('/portal/onboarding')
        return
      }

      setClient(clientData)

      // Music planner status
      const { data: plannerData } = await supabase
        .from('wedding_planner')
        .select('id, updated_at')
        .eq('client_id', clientData.id)
        .single()
      setPlanner(plannerData)

      // Wedding planning tools snapshot
      const { data: wedding } = await supabase
        .from('wedding_planner_data')
        .select('checklist, vendors, guests, budget')
        .eq('client_id', clientData.id)
        .single()
      setWeddingData(wedding)

      setLoading(false)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/portal/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading your dashboard...</div>
      </div>
    )
  }

  const days = daysUntil(client?.wedding_date)
  const person1Name = client?.person1_first_name || 'Person 1'
  const person2Name = client?.person2_first_name || 'Person 2'
  const person1Role = client?.person1_role || 'Person 1'
  const person2Role = client?.person2_role || 'Person 2'
  const sameRole = person1Role === person2Role
  const label1 = sameRole ? `${person1Name} (${person1Role})` : person1Role
  const label2 = sameRole ? `${person2Name} (${person2Role})` : person2Role

  const plannerComplete = client?.planner_completed
  const balanceDue = client?.balance_due || 0
  const totalContract = client?.total_contract || 0
  const totalPaid = client?.total_paid || 0

  // Wedding planner tools stats
  let wChecklistPct = 0, wVendors = 0, wGuests = 0
  if (weddingData) {
    const cl = weddingData.checklist || []
    wChecklistPct = cl.length ? Math.round((cl.filter(i => i.checked).length / cl.length) * 100) : 0
    wVendors = (weddingData.vendors || []).length
    wGuests = (weddingData.guests || []).length
  }

  return (
    <>
      <Head>
        <title>My Dashboard — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{`
          @keyframes flipIn {
            0%   { opacity: 0; transform: rotateX(90deg) scale(0.85); }
            65%  { opacity: 1; transform: rotateX(-6deg) scale(1.03); }
            85%  { transform: rotateX(2deg) scale(0.99); }
            100% { opacity: 1; transform: rotateX(0deg) scale(1); }
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/TA Logo.png" alt="Tascosa Audio" className="h-8 w-auto object-contain" />
              <span className="font-bold text-sm tracking-wide hidden sm:block">Client Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-400 hidden sm:block">
                Welcome, {person1Name} & {person2Name}!
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-neutral-500 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-xl px-3 py-2 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">

          {/* Countdown hero */}
          {days !== null && (
            <div className="rounded-3xl border border-tascosa-orange/30 bg-tascosa-orange/5 p-8 text-center relative overflow-hidden">
              <div className="absolute -top-20 -right-20 h-48 w-48 bg-tascosa-orange/10 blur-3xl rounded-full" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tascosa-orange mb-3">Your Big Day</p>
              {days > 0 ? (
                <>
                  <div
                    className="text-6xl md:text-8xl font-extrabold text-white"
                    style={{
                      display: 'inline-block',
                      opacity: displayDays === null ? 0 : 1,
                      animation: displayDays !== null ? 'flipIn 0.5s cubic-bezier(0.23,1,0.32,1) both' : 'none',
                      transformOrigin: 'center top',
                    }}
                  >
                    {displayDays ?? 0}
                  </div>
                  <div className="text-neutral-400 mt-2 text-lg">days to go</div>
                </>
              ) : days === 0 ? (
                <div className="text-4xl font-extrabold text-tascosa-orange">Today is the day! 🎉</div>
              ) : (
                <div className="text-2xl font-bold text-neutral-400">Your event has passed — congratulations! 🎉</div>
              )}
              <p className="text-neutral-500 text-sm mt-3">{formatDate(client?.wedding_date)}</p>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Event details */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Event Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Date</span>
                  <span className="text-white font-medium">{formatDate(client?.wedding_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Venue</span>
                  <span className="text-white font-medium text-right max-w-[200px]">{client?.venue || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Package</span>
                  <span className="text-white font-medium">{client?.package || 'To be confirmed'}</span>
                </div>
              </div>
            </div>

            {/* People */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Your Information
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">{label1}</span>
                  <span className="text-white font-medium">{person1Name} {client?.person1_last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{label2}</span>
                  <span className="text-white font-medium">{person2Name} {client?.person2_last_name}</span>
                </div>
              </div>
              <button
                onClick={() => router.push('/portal/onboarding')}
                className="text-xs text-tascosa-orange hover:underline"
              >
                Edit your information →
              </button>
            </div>

            {/* Balance */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Balance Summary
              </h2>
              {client?.package && client?.package.toLowerCase().includes('inclusive') ? (
                <div className="text-center py-4">
                  <div className="text-3xl font-black text-tascosa-orange">$0.00</div>
                  <p className="text-neutral-400 text-sm mt-1">Covered by your venue package ✓</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Total Contract</span>
                    <span className="text-white font-medium">${totalContract.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Total Paid</span>
                    <span className="text-emerald-400 font-medium">${totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-800 pt-3">
                    <span className="text-white font-bold">Balance Due</span>
                    <span className={`font-black text-lg ${balanceDue > 0 ? 'text-tascosa-orange' : 'text-emerald-400'}`}>
                      ${balanceDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs text-neutral-600">
                Questions about your balance?{' '}
                <a href="tel:8066707913" className="text-tascosa-orange hover:underline">Call or text Andy</a>
              </p>
            </div>

            {/* ── 🎵 Music Planner (was "Wedding Planner") ── */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                🎵 Music Planner
              </h2>
              {plannerComplete ? (
                <div className="text-center py-2">
                  <div className="text-emerald-400 font-bold text-lg">✓ Completed!</div>
                  {planner?.updated_at && (
                    <p className="text-neutral-500 text-xs mt-1">
                      Last updated {new Date(planner.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Your music planner helps us make sure every song, every moment, and every detail is perfect for your day.
                  </p>
                  {client?.wedding_date && (() => {
                    const dueDate = new Date(client.wedding_date + 'T12:00:00')
                    dueDate.setDate(dueDate.getDate() - 7)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
                    const isPastDue = daysUntilDue < 0
                    const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 14
                    return (
                      <div className={`mt-3 rounded-xl px-4 py-2.5 flex items-center justify-between ${isPastDue ? 'bg-red-400/10 border border-red-400/30' : isDueSoon ? 'bg-yellow-400/10 border border-yellow-400/30' : 'bg-neutral-800 border border-neutral-700'}`}>
                        <span className="text-xs font-bold text-neutral-400">Due by</span>
                        <span className={`text-sm font-black ${isPastDue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-white'}`}>
                          {dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {isPastDue ? ' — Past Due!' : daysUntilDue === 0 ? ' — Due Today!' : isDueSoon ? ` — ${daysUntilDue} days left` : ''}
                        </span>
                      </div>
                    )
                  })()}
                  <div className="mt-3 h-2 rounded-full bg-neutral-800">
                    <div className="h-2 rounded-full bg-tascosa-orange/40" style={{ width: planner ? '40%' : '0%' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{planner ? 'In progress' : 'Not started yet'}</p>
                </div>
              )}
              <button
                onClick={() => router.push('/portal/planner')}
                className="w-full rounded-2xl py-3 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 transition-all text-sm"
              >
                {plannerComplete ? 'Review Music Planner' : planner ? 'Continue Music Planner →' : 'Start Music Planner →'}
              </button>
            </div>

            {/* ── 💍 Wedding Planning Tools (new) ── */}
            <button
              onClick={() => router.push('/portal/wedding-planner')}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-left hover:border-pink-500/40 hover:bg-neutral-800/50 transition-all group md:col-span-2"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold flex items-center gap-2 mb-1">
                    <span className="h-4 w-1 bg-pink-400 rounded-full"></span>
                    💍 Wedding Planning Tools
                    <span className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold">Free Resource</span>
                  </h2>
                  <p className="text-neutral-500 text-sm ml-3">Checklist · Vendors · Guest list · Budget · Day-of timeline</p>
                </div>
                <span className="text-neutral-700 group-hover:text-pink-400 transition-colors text-lg mt-1">→</span>
              </div>

              {weddingData ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 ml-3">
                  <div className="bg-neutral-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-emerald-400">{wChecklistPct}%</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Checklist</div>
                  </div>
                  <div className="bg-neutral-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-blue-400">{wVendors}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Vendors</div>
                  </div>
                  <div className="bg-neutral-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-purple-400">{wGuests}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Guests</div>
                  </div>
                  {weddingData?.budget?.total > 0 && (
                    <div className="bg-neutral-800/60 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-yellow-400">${(weddingData.budget.total / 1000).toFixed(0)}k</div>
                      <div className="text-xs text-neutral-500 mt-0.5">Budget</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm ml-3">
                  A free planning tool — checklist, vendor contacts, guest list, budget tracker, and day-of timeline. Use as much or as little as you'd like.
                </p>
              )}

              <div className="mt-4 ml-3 inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-1.5">
                {weddingData ? 'Open Planner →' : 'Get Started →'}
              </div>
            </button>

          </div>

          {/* Contact Andy */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">Need to reach Andy?</h3>
              <p className="text-neutral-400 text-sm mt-1">We're always happy to help with any questions about your event.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a href="tel:8066707913" className="rounded-2xl px-5 py-3 border border-neutral-700 hover:border-tascosa-orange hover:text-tascosa-orange text-sm font-semibold transition-all">
                📞 Call
              </a>
              <a href="sms:+18066707913" className="rounded-2xl px-5 py-3 bg-tascosa-orange text-black font-black hover:brightness-110 transition-all text-sm">
                💬 Text
              </a>
            </div>
          </div>

        </main>

        <footer className="border-t border-neutral-900 py-8 text-center">
          <p className="text-neutral-600 text-xs">© {new Date().getFullYear()} Tascosa Audio LLC · Audio solutions made simple.</p>
        </footer>

      </div>
    </>
  )
}

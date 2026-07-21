// FILE LOCATION: pages/portal/dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Client portal dashboard — main hub after onboarding is complete
// Shows event summary, countdown, and links to wedding planner
// ─────────────────────────────────────────────────────────────────────────────

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
  // Append time to prevent UTC midnight timezone shift
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  const event = new Date(d)
  event.setHours(0, 0, 0, 0)
  return Math.round((event - today) / (1000 * 60 * 60 * 24))
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }

      // Get client data
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (!clientData || !clientData.person1_first_name) {
        router.push('/portal/onboarding')
        return
      }

      setClient(clientData)

      // Get wedding planner completion status
      const { data: plannerData } = await supabase
        .from('wedding_planner')
        .select('id, updated_at')
        .eq('client_id', clientData.id)
        .single()

      setPlanner(plannerData)
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

  // Use first names if both have same role
  const label1 = sameRole ? `${person1Name} (${person1Role})` : person1Role
  const label2 = sameRole ? `${person2Name} (${person2Role})` : person2Role

  const plannerComplete = client?.planner_completed
  const balanceDue = client?.balance_due || 0
  const totalContract = client?.total_contract || 0
  const totalPaid = client?.total_paid || 0

  return (
    <>
      <Head>
        <title>My Dashboard — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
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
                  <div className="text-6xl md:text-8xl font-extrabold text-white">{days}</div>
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

          {/* Event summary grid */}
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

            {/* Wedding planner status */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Wedding Planner
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
                    Your wedding planner helps us make sure every song, every moment, and every detail is perfect for your day.
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-neutral-800">
                    <div className="h-2 rounded-full bg-tascosa-orange/40" style={{ width: planner ? '40%' : '0%' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{planner ? 'In progress' : 'Not started yet'}</p>
                </div>
              )}
              <button
                onClick={() => router.push('/portal/planner')}
                className="w-full rounded-2xl py-3 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 transition-all text-sm"
              >
                {plannerComplete ? 'Review Wedding Planner' : planner ? 'Continue Wedding Planner →' : 'Start Wedding Planner →'}
              </button>
            </div>

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

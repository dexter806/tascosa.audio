// FILE LOCATION: pages/portal/dashboard.jsx
// Updated: renamed "Wedding Planner" card → "🎵 Music Planner"
//          added new "💍 Wedding Planning Tools" card

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Dashboard() {
  const router = useRouter()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plannerData, setPlannerData] = useState(null)   // music planner (wedding_planner table)
  const [weddingData, setWeddingData] = useState(null)   // wedding planner (wedding_planner_data table)
  const [daysUntil, setDaysUntil] = useState(null)

  useEffect(() => {
    // onAuthStateChange fires reliably on hydration; getSession alone can miss it
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) { router.push('/portal/login'); return }

      let clientData = null
      const { data: d1 } = await supabase
        .from('clients')
        .select('*, quotes(*)')
        .eq('user_id', session.user.id)
        .single()
      if (d1) clientData = d1
      else {
        const { data: d2 } = await supabase
          .from('clients')
          .select('*, quotes(*)')
          .eq('user_id_2', session.user.id)
          .single()
        clientData = d2
      }

      if (!clientData) { router.push('/portal/login'); return }
      setClient(clientData)

      // Days until wedding
      if (clientData.event_date) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const event = new Date(clientData.event_date + 'T00:00:00')
        const diff = Math.round((event - today) / (1000 * 60 * 60 * 24))
        setDaysUntil(diff)
      }

      const { data: planner } = await supabase
        .from('wedding_planner')
        .select('*')
        .eq('client_id', clientData.id)
        .single()
      setPlannerData(planner)

      const { data: wedding } = await supabase
        .from('wedding_planner_data')
        .select('checklist, vendors, guests, budget, timeline')
        .eq('client_id', clientData.id)
        .single()
      setWeddingData(wedding)

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

      // Find client by either partner email
      let clientData = null
      const { data: d1 } = await supabase
        .from('clients')
        .select('*, quotes(*)')
        .eq('user_id', session.user.id)
        .single()
      if (d1) clientData = d1
      else {
        const { data: d2 } = await supabase
          .from('clients')
          .select('*, quotes(*)')
          .eq('user_id_2', session.user.id)
          .single()
        clientData = d2
      }

      if (!clientData) { router.push('/portal/login'); return }
      setClient(clientData)

      // Days until wedding
      if (clientData.event_date) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const event = new Date(clientData.event_date + 'T00:00:00')
        const diff = Math.round((event - today) / (1000 * 60 * 60 * 24))
        setDaysUntil(diff)
      }

      // Music planner progress
      const { data: planner } = await supabase
        .from('wedding_planner')
        .select('*')
        .eq('client_id', clientData.id)
        .single()
      setPlannerData(planner)

      // Wedding planner data
      const { data: wedding } = await supabase
        .from('wedding_planner_data')
        .select('checklist, vendors, guests, budget, timeline')
        .eq('client_id', clientData.id)
        .single()
      setWeddingData(wedding)

      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-neutral-400 text-sm animate-pulse">Loading your portal...</div>
    </div>
  )

  if (!client) return null

  const quote = client.quotes?.[0]
  const totalOwed = quote ? (parseFloat(quote.total_price || 0) - parseFloat(quote.amount_paid || 0)) : 0
  const isPaid = totalOwed <= 0

  // Music planner progress
  const musicPlannerComplete = plannerData?.planner_completed || false
  const musicSections = {
    ceremony: plannerData?.ceremony_complete,
    cocktail: plannerData?.cocktail_complete,
    dinner: plannerData?.dinner_complete,
    reception: plannerData?.reception_complete,
  }
  const musicSectionsComplete = Object.values(musicSections).filter(Boolean).length
  const musicProgress = Math.round((musicSectionsComplete / 4) * 100)

  // Wedding planner stats
  let wChecklistPct = 0, wVendors = 0, wGuests = 0
  if (weddingData) {
    const cl = weddingData.checklist || []
    wChecklistPct = cl.length ? Math.round((cl.filter(i => i.checked).length / cl.length) * 100) : 0
    wVendors = (weddingData.vendors || []).length
    wGuests = (weddingData.guests || []).length
  }

  const hasWeddingPlanner = !!weddingData

  const formatDate = (d) => {
    if (!d) return '—'
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatPhone = (p) => {
    if (!p) return null
    const d = p.replace(/\D/g, '')
    if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
    return p
  }

  return (
    <>
      <Head>
        <title>Client Portal — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Header */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-black text-orange-400">T</div>
              <span className="font-bold text-sm tracking-tight">Tascosa Audio</span>
              <span className="text-neutral-700 text-xs hidden sm:inline">Client Portal</span>
            </div>
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/portal/login'))}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

          {/* Countdown hero */}
          <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #dc5f14 0%, transparent 60%)' }} />
            <div className="relative">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Hello, {client.bride_name || client.contact_name?.split(' ')[0] || 'there'} 👋</p>
              {daysUntil !== null ? (
                daysUntil > 0 ? (
                  <>
                    <div className="text-5xl font-black text-white tracking-tight">{daysUntil}</div>
                    <div className="text-sm text-neutral-400 mt-1">days until your wedding</div>
                    <div className="text-xs text-neutral-600 mt-0.5">{formatDate(client.event_date)}</div>
                  </>
                ) : daysUntil === 0 ? (
                  <>
                    <div className="text-4xl font-black text-orange-400">Today's the Day! 🎉</div>
                    <div className="text-xs text-neutral-600 mt-1">{formatDate(client.event_date)}</div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-black text-neutral-400">Congratulations! 🥂</div>
                    <div className="text-xs text-neutral-600 mt-1">{formatDate(client.event_date)}</div>
                  </>
                )
              ) : (
                <div className="text-2xl font-black text-neutral-400">Welcome to your portal</div>
              )}
            </div>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Event Details */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Event Details</p>
              <div className="space-y-3">
                <Row label="Date" value={formatDate(client.event_date)} />
                <Row label="Venue" value={client.venue_name} />
                <Row label="Package" value={quote?.package_name} />
                <Row label="DJ" value={client.assigned_dj} />
                {client.ceremony_time && <Row label="Ceremony" value={client.ceremony_time} />}
                {client.reception_time && <Row label="Reception" value={client.reception_time} />}
              </div>
            </div>

            {/* Your Information */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Your Information</p>
              <div className="space-y-3">
                {client.bride_name && <Row label="Bride" value={client.bride_name} />}
                {client.groom_name && <Row label="Groom" value={client.groom_name} />}
                {client.contact_email && <Row label="Email" value={client.contact_email} />}
                {client.contact_phone && <Row label="Phone" value={formatPhone(client.contact_phone)} />}
                {client.contact_email_2 && <Row label="Email 2" value={client.contact_email_2} />}
              </div>
            </div>

            {/* Balance Summary */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Balance Summary</p>
              {quote ? (
                <div className="space-y-3">
                  <Row label="Package Total" value={`$${parseFloat(quote.total_price || 0).toFixed(2)}`} />
                  <Row label="Paid" value={`$${parseFloat(quote.amount_paid || 0).toFixed(2)}`} />
                  <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-300">Balance Due</span>
                    <span className={`text-sm font-black ${isPaid ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {isPaid ? '✓ Paid in Full' : `$${totalOwed.toFixed(2)}`}
                    </span>
                  </div>
                  {quote.deposit_due_date && !isPaid && (
                    <p className="text-xs text-neutral-600">Deposit due: {formatDate(quote.deposit_due_date)}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-600">No quote on file yet.</p>
              )}
            </div>

            {/* ── 🎵 MUSIC PLANNER (renamed from "Wedding Planner") ──────── */}
            <button
              onClick={() => router.push('/portal/planner')}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-left hover:border-orange-500/40 hover:bg-neutral-800/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">🎵 Music Planner</p>
                  <p className="text-xs text-neutral-600 mt-0.5">Your songs &amp; timeline with Tascosa</p>
                </div>
                <span className="text-neutral-700 group-hover:text-orange-400 transition-colors text-sm">→</span>
              </div>

              {musicPlannerComplete ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-xs text-emerald-400 font-black">✓</div>
                  <span className="text-sm font-bold text-emerald-400">Planner Complete!</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                    <span>{musicSectionsComplete}/4 sections</span>
                    <span>{musicProgress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800">
                    <div
                      className="h-1.5 rounded-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${musicProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">
                    {musicProgress === 0 ? "Get started — pick your songs!" : "Keep going — your DJ will love it."}
                  </p>
                </>
              )}

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
                Open Music Planner →
              </div>
            </button>

            {/* ── 💍 WEDDING PLANNING TOOLS (new, fully separate) ────────── */}
            <button
              onClick={() => router.push('/portal/wedding-planner')}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-left hover:border-pink-500/40 hover:bg-neutral-800/50 transition-all group sm:col-span-2"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">💍 Wedding Planning Tools</p>
                    <span className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold">Free Resource</span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5">Checklist · Vendors · Guest list · Budget · Day-of timeline</p>
                </div>
                <span className="text-neutral-700 group-hover:text-pink-400 transition-colors text-sm">→</span>
              </div>

              {hasWeddingPlanner ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  <MiniStat label="Checklist" value={`${wChecklistPct}%`} sub="done" color="emerald" />
                  <MiniStat label="Vendors" value={wVendors} sub="added" color="blue" />
                  <MiniStat label="Guests" value={wGuests} sub="on list" color="purple" />
                  {weddingData?.budget?.total > 0 && (
                    <MiniStat label="Budget" value={`$${(weddingData.budget.total / 1000).toFixed(0)}k`} sub="set" color="yellow" />
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-600">
                  A free planning tool — checklist, vendor contacts, guest list, budget tracker, and day-of timeline. Use as much or as little as you'd like.
                </p>
              )}

              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-1.5">
                {hasWeddingPlanner ? 'Open Planner →' : 'Get Started →'}
              </div>
            </button>

          </div>

          {/* Contact Andy */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Your Contact at Tascosa Audio</p>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-sm font-black text-orange-400 flex-shrink-0">A</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">Andy</p>
                <p className="text-xs text-neutral-500">Tascosa Audio · Owner / Lead DJ</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href="tel:+18064570027" className="text-xs px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all">📞 Call</a>
                <a href="mailto:tascosaaudio@gmail.com" className="text-xs px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all">✉️ Email</a>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  )
}

// ── Small helpers ────────────────────────────────────────────────────────────

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-neutral-600 flex-shrink-0">{label}</span>
      <span className="text-xs text-neutral-300 text-right">{value}</span>
    </div>
  )
}

function MiniStat({ label, value, sub, color }) {
  const colors = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    pink: 'text-pink-400',
  }
  return (
    <div className="bg-neutral-800/60 rounded-xl p-3 text-center">
      <div className={`text-lg font-black ${colors[color] || 'text-white'}`}>{value}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-neutral-700">{sub}</div>}
    </div>
  )
}

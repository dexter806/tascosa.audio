// FILE LOCATION: pages/venue/client/[id].jsx
// ─────────────────────────────────────────────────────────────────────────────
// Venue Partner — Client Detail View
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${m} ${period}`
}

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 py-2.5 border-b border-neutral-800 last:border-0">
    <span className="text-sm text-neutral-400 flex-shrink-0">{label}</span>
    <span className="text-sm text-white font-medium text-right">{value || '—'}</span>
  </div>
)

export default function VenueClientDetail() {
  const router = useRouter()
  const { id } = router.query
  const [venue, setVenue] = useState(null)
  const [client, setClient] = useState(null)
  const [planner, setPlanner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }

      // Verify venue user
      const { data: venueData } = await supabase
        .from('venues')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (!venueData) { router.push('/portal/login'); return }
      setVenue(venueData)

      // Load client — must belong to this venue
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('venue_id', venueData.id)
        .single()

      if (!clientData) { router.push('/venue/dashboard'); return }
      setClient(clientData)

      // Load planner if exists
      const { data: plannerData } = await supabase
        .from('wedding_planner')
        .select('*')
        .eq('client_id', id)
        .single()

      setPlanner(plannerData)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  const daysUntil = Math.ceil((new Date(client.wedding_date + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))

  return (
    <>
      <Head>
        <title>{client.person1_first_name} & {client.person2_first_name} — {venue.name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100 relative overflow-x-hidden">

        {/* Watermark */}
        {venue.logo_url && (
          <div className="fixed left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-0 select-none">
            <img src={venue.logo_url} alt="" className="w-full h-full object-contain opacity-[0.10] mix-blend-screen" />
          </div>
        )}

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/venue/dashboard')} className="text-neutral-400 hover:text-white transition-colors text-sm">
                ← Dashboard
              </button>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-sm">{client.person1_first_name} & {client.person2_first_name}</span>
            </div>
            <div className="flex items-center gap-3">
              {venue.logo_url ? (
                <img src={venue.logo_url} alt={venue.name} className="h-8 w-auto object-contain" />
              ) : (
                <span className="text-sm font-bold text-white">{venue.name}</span>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-4 relative z-10">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold">
                {client.person1_first_name} {client.person1_last_name}
                {client.person2_first_name ? ` & ${client.person2_first_name} ${client.person2_last_name}` : ''}
              </h1>
              <p className="text-tascosa-orange font-semibold mt-1 text-sm">{formatDate(client.wedding_date)}</p>
            </div>
            {/* Countdown */}
            {daysUntil > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-3 text-center">
                <p className="text-3xl font-black text-tascosa-orange">{daysUntil}</p>
                <p className="text-xs text-neutral-500 mt-0.5">days away</p>
              </div>
            )}
            {daysUntil === 0 && (
              <div className="bg-tascosa-orange/10 border border-tascosa-orange/30 rounded-2xl px-5 py-3 text-center">
                <p className="text-lg font-black text-tascosa-orange">🎉 TODAY!</p>
              </div>
            )}
          </div>

          {/* Status badges */}
          <div className="flex gap-2 flex-wrap">
            {(client.user_id || client.user_id_2) ? (
              <span className="text-xs bg-emerald-400/10 text-emerald-400 px-3 py-1.5 rounded-full font-bold">✓ Portal Active</span>
            ) : (
              <span className="text-xs bg-neutral-800 text-neutral-400 px-3 py-1.5 rounded-full font-bold">No Portal Yet</span>
            )}
            {client.package && (
              <span className="text-xs bg-tascosa-orange/10 text-tascosa-orange px-3 py-1.5 rounded-full font-bold">{client.package}</span>
            )}
            {client.planner_completed ? (
              <span className="text-xs bg-emerald-400/10 text-emerald-400 px-3 py-1.5 rounded-full font-bold">✓ Planner Complete</span>
            ) : (
              <span className="text-xs bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-full font-bold">⏳ Planner Pending</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Contact Info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                Contact Information
              </h3>
              <InfoRow label={client.person1_role || 'Person 1'} value={`${client.person1_first_name} ${client.person1_last_name}`} />
              <InfoRow label="Email" value={client.person1_email} />
              <InfoRow label="Phone" value={client.person1_phone} />
              {client.person2_first_name && (
                <>
                  <div className="my-3 border-t border-neutral-800" />
                  <InfoRow label={client.person2_role || 'Person 2'} value={`${client.person2_first_name} ${client.person2_last_name}`} />
                  <InfoRow label="Email" value={client.person2_email} />
                  <InfoRow label="Phone" value={client.person2_phone} />
                </>
              )}
            </div>

            {/* Event Details */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                Event Details
              </h3>
              <InfoRow label="Wedding Date" value={formatDate(client.wedding_date)} />
              <InfoRow label="Venue" value={client.venue} />
              {planner && (
                <>
                  <InfoRow label="Ceremony Start" value={formatTime(planner.ceremony_start_time)} />
                  <InfoRow label="Reception End" value={formatTime(planner.reception_end_time)} />
                  {planner.event_notes && (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Event Notes</p>
                      <p className="text-sm text-neutral-300 leading-relaxed">{planner.event_notes}</p>
                    </div>
                  )}
                </>
              )}
              {client.assigned_to && (
                <div className="mt-3 pt-3 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">DJ Assigned</p>
                  <p className="text-sm text-white font-bold">{client.assigned_to}</p>
                </div>
              )}
            </div>

          </div>

          <div className="h-6" />
        </main>
      </div>
    </>
  )
}

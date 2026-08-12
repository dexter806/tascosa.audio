// FILE LOCATION: pages/admin/venues.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Venue Management — Tascosa Audio
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ADMIN_USER_ID = '8ce9e75b-9309-4ce9-8d01-9e840431c572'

export default function AdminVenues() {
  const router = useRouter()
  const [venues, setVenues] = useState([])
  const [clientCounts, setClientCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddVenue, setShowAddVenue] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', logo_url: '' })
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_USER_ID) {
        router.push('/portal/login')
        return
      }
      await loadVenues()
    })
  }, [])

  async function loadVenues() {
    const { data: venueData } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true })

    if (!venueData) { setLoading(false); return }
    setVenues(venueData)

    // Get client counts per venue
    const { data: clients } = await supabase
      .from('clients')
      .select('venue_id, wedding_date, is_active')
      .not('venue_id', 'is', null)

    const counts = {}
    if (clients) {
      clients.forEach(c => {
        if (!c.venue_id) return
        if (!counts[c.venue_id]) counts[c.venue_id] = { total: 0, upcoming: 0 }
        if (c.is_active) {
          counts[c.venue_id].total++
          if (c.wedding_date && new Date(c.wedding_date + 'T12:00:00') >= new Date()) {
            counts[c.venue_id].upcoming++
          }
        }
      })
    }
    setClientCounts(counts)
    setLoading(false)
  }

  async function addVenue() {
    if (!form.name || !form.email) {
      alert('Please enter a venue name and email.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('venues').insert({
      name: form.name,
      email: form.email.toLowerCase().trim(),
      phone: form.phone,
      logo_url: form.logo_url,
    })

    if (error) {
      console.error(error)
      alert('Failed to add venue. Email may already exist.')
      setSaving(false)
      return
    }

    setForm({ name: '', email: '', phone: '', logo_url: '' })
    setShowAddVenue(false)
    setSaving(false)
    setSuccessMsg(`${form.name} added! Don't forget to invite their email from Supabase Auth.`)
    setTimeout(() => setSuccessMsg(''), 6000)
    await loadVenues()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Venue Partners — Tascosa Audio Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                ← Admin
              </button>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-sm">Venue Partners</span>
            </div>
            <button
              onClick={() => setShowAddVenue(true)}
              className="bg-tascosa-orange text-black font-black text-xs rounded-xl px-3 py-2 hover:brightness-110 active:scale-95 transition-all"
            >
              + Add Venue
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* Success message */}
          {successMsg && (
            <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl px-4 py-3 text-emerald-400 text-sm font-medium">
              ✓ {successMsg}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-tascosa-orange">{venues.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5 uppercase tracking-wide">Venue Partners</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">
                {Object.values(clientCounts).reduce((sum, c) => sum + c.upcoming, 0)}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5 uppercase tracking-wide">Upcoming Bookings</div>
            </div>
          </div>

          {/* Venue list */}
          {venues.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center">
              <p className="text-neutral-500 text-sm">No venue partners yet.</p>
              <button onClick={() => setShowAddVenue(true)} className="mt-4 text-tascosa-orange text-sm font-bold hover:underline">
                + Add your first venue
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                All Venues
              </h2>
              {venues.map(venue => {
                const counts = clientCounts[venue.id] || { total: 0, upcoming: 0 }
                return (
                  <div
                    key={venue.id}
                    onClick={() => router.push(`/admin/venue/${venue.id}`)}
                    className="bg-neutral-900 border border-neutral-800 hover:border-tascosa-orange/50 rounded-2xl px-4 py-4 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Logo */}
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {venue.logo_url ? (
                          <img src={venue.logo_url} alt={venue.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-lg font-black text-neutral-500">{venue.name[0]}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white group-hover:text-tascosa-orange transition-colors">{venue.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{venue.email}</p>
                        {venue.phone && <p className="text-xs text-neutral-600">{venue.phone}</p>}
                      </div>

                      {/* Stats */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-lg font-black text-tascosa-orange">{counts.upcoming}</p>
                            <p className="text-xs text-neutral-600">Upcoming</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black text-neutral-400">{counts.total}</p>
                            <p className="text-xs text-neutral-600">Total</p>
                          </div>
                          <span className="text-neutral-600 group-hover:text-tascosa-orange transition-colors">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="h-6" />
        </main>

        {/* Add Venue Modal */}
        {showAddVenue && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 w-full max-w-md">
              <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Add Venue Partner
              </h2>
              <p className="text-xs text-neutral-500 mb-4">After adding, invite their email from Supabase Authentication.</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Venue Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="The Grand Ballroom"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Login Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="contact@thegrandballroom.com"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(806) 555-0000"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Logo URL</label>
                  <input
                    value={form.logo_url}
                    onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))}
                    placeholder="https://... (from Supabase Storage)"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                  />
                  {form.logo_url && (
                    <div className="mt-2 w-12 h-12 rounded-xl bg-neutral-800 overflow-hidden">
                      <img src={form.logo_url} alt="Preview" className="w-full h-full object-contain p-1" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setShowAddVenue(false); setForm({ name: '', email: '', phone: '', logo_url: '' }) }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addVenue}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Adding...' : 'Add Venue'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

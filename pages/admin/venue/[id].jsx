// FILE LOCATION: pages/admin/venue/[id].jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin — Individual Venue Detail
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

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T12:00:00')
  d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / (1000 * 60 * 60 * 24))
}

export default function AdminVenueDetail() {
  const router = useRouter()
  const { id } = router.query
  const [venue, setVenue] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (!id) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_USER_ID) {
        router.push('/portal/login')
        return
      }

      const { data: venueData } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single()

      if (!venueData) { router.push('/admin/venues'); return }
      setVenue(venueData)
      setEditForm({
        name: venueData.name,
        email: venueData.email,
        phone: venueData.phone || '',
        logo_url: venueData.logo_url || '',
      })

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('venue_id', id)
        .order('wedding_date', { ascending: true })

      setClients(clientData || [])
      setLoading(false)
    })
  }, [id])

  async function saveVenue() {
    setSaving(true)
    setSaveStatus('saving')
    const { error } = await supabase
      .from('venues')
      .update({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        logo_url: editForm.logo_url,
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      setSaveStatus('error')
    } else {
      setVenue(prev => ({ ...prev, ...editForm }))
      setSaveStatus('saved')
      setEditing(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  const upcoming = clients.filter(c => c.is_active && (daysUntil(c.wedding_date) ?? -1) >= 0)
  const past = clients.filter(c => c.is_active && (daysUntil(c.wedding_date) ?? 0) < 0)
  const inactive = clients.filter(c => !c.is_active)
  const displayed = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : inactive

  return (
    <>
      <Head>
        <title>{venue.name} — Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/venues')} className="text-neutral-400 hover:text-white transition-colors text-sm">
                ← Venues
              </button>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-sm">{venue.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saved' && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveStatus === 'error' && <span className="text-xs text-red-400">Save failed</span>}
              <button
                onClick={() => setEditing(!editing)}
                className={`text-xs border rounded-xl px-3 py-2 transition-all ${editing ? 'border-tascosa-orange text-tascosa-orange' : 'border-neutral-700 text-neutral-400 hover:text-white'}`}
              >
                {editing ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* Venue Header */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {venue.logo_url ? (
                  <img src={venue.logo_url} alt={venue.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-2xl font-black text-neutral-500">{venue.name[0]}</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-extrabold">{venue.name}</h1>
                <p className="text-sm text-neutral-400 mt-0.5">{venue.email}</p>
                {venue.phone && <p className="text-sm text-neutral-500">{venue.phone}</p>}
              </div>
            </div>

            {/* Edit form */}
            {editing && (
              <div className="border-t border-neutral-800 pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Venue Name</label>
                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Login Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Phone</label>
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Logo URL</label>
                    <input value={editForm.logo_url} onChange={e => setEditForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                </div>
                {editForm.logo_url && (
                  <div className="w-16 h-16 rounded-xl bg-neutral-800 overflow-hidden">
                    <img src={editForm.logo_url} alt="Preview" className="w-full h-full object-contain p-1" />
                  </div>
                )}
                <button
                  onClick={saveVenue}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-4 border-t border-neutral-800 pt-4">
              <div className="text-center">
                <p className="text-xl font-black text-tascosa-orange">{upcoming.length}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Upcoming</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-neutral-400">{past.length}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-neutral-600">{inactive.length}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Removed</p>
              </div>
            </div>
          </div>

          {/* Client tabs */}
          <div className="flex gap-2">
            {[
              { val: 'upcoming', label: `Upcoming (${upcoming.length})` },
              { val: 'past', label: `Completed (${past.length})` },
              { val: 'removed', label: `Removed (${inactive.length})` },
            ].map(tab => (
              <button key={tab.val} onClick={() => setActiveTab(tab.val)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.val ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Client list */}
          {displayed.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500 text-sm">
              No {activeTab} clients.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {displayed.map(client => {
                const days = daysUntil(client.wedding_date)
                return (
                  <div
                    key={client.id}
                    onClick={() => router.push(`/admin/client/${client.id}`)}
                    className="bg-neutral-900 border border-neutral-800 hover:border-tascosa-orange/50 rounded-2xl px-4 py-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm group-hover:text-tascosa-orange transition-colors">
                          {client.person1_first_name} {client.person1_last_name}
                          {client.person2_first_name ? ` & ${client.person2_first_name} ${client.person2_last_name}` : ''}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">{formatDate(client.wedding_date)}</p>
                        {client.person1_email && (
                          <p className="text-xs text-neutral-600 mt-0.5">{client.person1_email}</p>
                        )}
                        <div className="flex gap-1.5 flex-wrap mt-1.5">
                          {(client.user_id || client.user_id_2) ? (
                            <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Portal Active</span>
                          ) : (
                            <span className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full font-bold">No Portal</span>
                          )}
                          {client.package && (
                            <span className="text-xs bg-tascosa-orange/10 text-tascosa-orange px-2 py-0.5 rounded-full font-bold">{client.package}</span>
                          )}
                          {client.planner_completed && (
                            <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Planner</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-neutral-400">{formatDate(client.wedding_date)}</p>
                        {days !== null && (
                          <p className={`text-xs font-black mt-0.5 ${
                            days < 0 ? 'text-neutral-600' :
                            days === 0 ? 'text-red-400' :
                            days <= 7 ? 'text-orange-400' :
                            days <= 30 ? 'text-yellow-400' :
                            'text-emerald-400'
                          }`}>
                            {days < 0 ? 'Past' : days === 0 ? 'TODAY!' : `${days}d`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="h-6" />
        </main>
      </div>
    </>
  )
}

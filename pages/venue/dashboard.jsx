// FILE LOCATION: pages/venue/dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Venue Partner Dashboard — Tascosa Audio
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
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function VenueDashboard() {
  const router = useRouter()
  const [venue, setVenue] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | calendar
  const [showAddClient, setShowAddClient] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [successMsg, setSuccessMsg] = useState('')

  const [form, setForm] = useState({
    person1_first_name: '',
    person1_last_name: '',
    person1_email: '',
    person1_phone: '',
    person2_first_name: '',
    person2_last_name: '',
    person2_email: '',
    person2_phone: '',
    wedding_date: '',
    showPerson2: false,
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }

      // Find venue by email
      const { data: venueData, error } = await supabase
        .from('venues')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (error || !venueData) {
        // Not a venue user — redirect
        router.push('/portal/login')
        return
      }

      setVenue(venueData)

      // Load clients for this venue
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('venue_id', venueData.id)
        .eq('is_active', true)
        .order('wedding_date', { ascending: true })

      setClients(clientData || [])
      setLoading(false)
    })
  }, [])

  async function addClient() {
    if (!form.person1_first_name || !form.person1_last_name || !form.wedding_date) {
      alert('Please fill in at least the first person\'s name and the wedding date.')
      return
    }
    setSaving(true)

    const newClient = {
      venue_id: venue.id,
      venue: venue.name,
      person1_first_name: form.person1_first_name,
      person1_last_name: form.person1_last_name,
      person1_email: form.person1_email,
      person1_phone: form.person1_phone,
      person1_role: 'Bride',
      person2_first_name: form.showPerson2 ? form.person2_first_name : '',
      person2_last_name: form.showPerson2 ? form.person2_last_name : '',
      person2_email: form.showPerson2 ? form.person2_email : '',
      person2_phone: form.showPerson2 ? form.person2_phone : '',
      person2_role: 'Groom',
      wedding_date: form.wedding_date,
      is_active: true,
      planner_completed: false,
    }

    const { data: inserted, error } = await supabase
      .from('clients')
      .insert(newClient)
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Failed to add client. Please try again.')
      setSaving(false)
      return
    }

    // Notify Andy via API
    await fetch('/api/venue-add-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueName: venue.name,
        clientId: inserted.id,
        person1Name: `${form.person1_first_name} ${form.person1_last_name}`,
        person1Email: form.person1_email,
        person1Phone: form.person1_phone,
        person2Name: form.showPerson2 ? `${form.person2_first_name} ${form.person2_last_name}` : null,
        person2Email: form.showPerson2 ? form.person2_email : null,
        weddingDate: form.wedding_date,
      }),
    })

    setClients(prev => [...prev, inserted].sort((a, b) => new Date(a.wedding_date) - new Date(b.wedding_date)))
    setForm({
      person1_first_name: '', person1_last_name: '', person1_email: '', person1_phone: '',
      person2_first_name: '', person2_last_name: '', person2_email: '', person2_phone: '',
      wedding_date: '', showPerson2: false,
    })
    setShowAddClient(false)
    setSaving(false)
    setSuccessMsg('Client added successfully! Andy has been notified.')
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  async function removeClient(clientId, clientName) {
    if (!confirm(`Remove ${clientName} from your bookings? Andy will be notified.`)) return

    const { error } = await supabase
      .from('clients')
      .update({ is_active: false })
      .eq('id', clientId)

    if (error) { console.error(error); return }

    // Notify Andy
    await fetch('/api/venue-remove-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueName: venue.name,
        clientName,
        clientId,
      }),
    })

    setClients(prev => prev.filter(c => c.id !== clientId))
    setSuccessMsg(`${clientName} has been removed. Andy has been notified.`)
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  // Calendar helpers
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const clientsThisMonth = clients.filter(c => {
    if (!c.wedding_date) return false
    const d = new Date(c.wedding_date + 'T12:00:00')
    return d.getFullYear() === calendarYear && d.getMonth() === calendarMonth
  })

  const clientsByDate = {}
  clients.forEach(c => {
    if (!c.wedding_date) return
    const d = new Date(c.wedding_date + 'T12:00:00')
    if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
      const day = d.getDate()
      if (!clientsByDate[day]) clientsByDate[day] = []
      clientsByDate[day].push(c)
    }
  })

  const upcoming = clients.filter(c => (daysUntil(c.wedding_date) ?? -1) >= 0)
  const past = clients.filter(c => (daysUntil(c.wedding_date) ?? 0) < 0)

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
        <title>{venue.name} — Tascosa Audio Partner Portal</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100 relative overflow-x-hidden">

        {/* Faded watermark logo — fixed to left side like main site */}
        {venue.logo_url && (
          <div className="fixed left-0 top-1/2 -translate-y-1/2 translate-x-0 w-96 h-96 pointer-events-none z-0 select-none">
            <img
              src={venue.logo_url}
              alt=""
              className="w-full h-full object-contain opacity-[0.50] mix-blend-screen"
            />
          </div>
        )}

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {venue.logo_url ? (
                <img src={venue.logo_url} alt={venue.name} className="h-8 w-auto object-contain" />
              ) : (
                <div className="h-8 px-3 bg-neutral-800 rounded-lg flex items-center">
                  <span className="text-sm font-bold text-white">{venue.name}</span>
                </div>
              )}
              <span className="text-neutral-600 text-xs hidden sm:block">powered by</span>
              <img src="/TA Logo.png" alt="Tascosa Audio" className="h-6 w-auto object-contain hidden sm:block" />
            </div>
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/portal/login'))}
              className="text-xs text-neutral-500 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-xl px-3 py-2 transition-all"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5 relative z-10">

          {/* Success message */}
          {successMsg && (
            <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl px-4 py-3 text-emerald-400 text-sm font-medium">
              ✓ {successMsg}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-extrabold">{venue.name}</h1>
              <p className="text-neutral-400 text-sm mt-0.5">Partner Portal · {upcoming.length} upcoming booking{upcoming.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowAddClient(true)}
              className="bg-tascosa-orange text-black font-black text-sm rounded-xl px-4 py-2.5 hover:brightness-110 active:scale-95 transition-all"
            >
              + Add Client
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-tascosa-orange">{upcoming.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5 uppercase tracking-wide">Upcoming</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-neutral-400">{past.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5 uppercase tracking-wide">Completed</div>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-2">
            {['list', 'calendar'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${view === v ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                {v === 'list' ? '☰ List' : '📅 Calendar'}
              </button>
            ))}
          </div>

          {/* ── LIST VIEW ─────────────────────────────────────────────── */}
          {view === 'list' && (
            <div className="space-y-3">
              {clients.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center">
                  <p className="text-neutral-500 text-sm">No clients yet.</p>
                  <button onClick={() => setShowAddClient(true)} className="mt-4 text-tascosa-orange text-sm font-bold hover:underline">
                    + Add your first client
                  </button>
                </div>
              ) : (
                <>
                  {upcoming.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-1">Upcoming</p>
                      <div className="space-y-2">
                        {upcoming.map(client => {
                          const days = daysUntil(client.wedding_date)
                          return (
                            <div key={client.id} className="bg-neutral-900 border border-neutral-800 hover:border-tascosa-orange/40 rounded-2xl px-4 py-3 transition-all">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-white text-sm">
                                    {client.person1_first_name} {client.person1_last_name}
                                    {client.person2_first_name && ` & ${client.person2_first_name} ${client.person2_last_name}`}
                                  </p>
                                  <p className="text-xs text-neutral-400 mt-0.5">{formatDate(client.wedding_date)}</p>
                                  {client.person1_email && (
                                    <p className="text-xs text-neutral-500 mt-0.5">{client.person1_email}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {(client.user_id || client.user_id_2) ? (
                                      <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Portal Active</span>
                                    ) : (
                                      <span className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full font-bold">No Portal Yet</span>
                                    )}
                                    {client.package && (
                                      <span className="text-xs bg-tascosa-orange/10 text-tascosa-orange px-2 py-0.5 rounded-full font-bold">{client.package}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <span className={`text-xs font-black ${
                                    days === 0 ? 'text-red-400' :
                                    days <= 7 ? 'text-orange-400' :
                                    days <= 30 ? 'text-yellow-400' :
                                    'text-emerald-400'
                                  }`}>
                                    {days === 0 ? 'TODAY!' : days === 1 ? 'Tomorrow' : `${days}d`}
                                  </span>
                                  <button
                                    onClick={() => removeClient(client.id, `${client.person1_first_name} ${client.person1_last_name}`)}
                                    className="text-xs text-red-400 border border-red-900 px-2 py-1 rounded-lg hover:bg-red-400/10 transition-all"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {past.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-1 mt-4">Completed</p>
                      <div className="space-y-2">
                        {past.map(client => (
                          <div key={client.id} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl px-4 py-3 opacity-60">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-bold text-white text-sm">
                                  {client.person1_first_name} {client.person1_last_name}
                                  {client.person2_first_name && ` & ${client.person2_first_name} ${client.person2_last_name}`}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">{formatDate(client.wedding_date)}</p>
                              </div>
                              <span className="text-xs text-neutral-600 font-bold">Past</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── CALENDAR VIEW ─────────────────────────────────────────── */}
          {view === 'calendar' && (
            <div className="space-y-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) }
                    else setCalendarMonth(m => m - 1)
                  }}
                  className="text-neutral-400 hover:text-white border border-neutral-700 rounded-xl px-3 py-2 text-sm transition-all"
                >
                  ←
                </button>
                <h2 className="font-bold text-white">{MONTHS[calendarMonth]} {calendarYear}</h2>
                <button
                  onClick={() => {
                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) }
                    else setCalendarMonth(m => m + 1)
                  }}
                  className="text-neutral-400 hover:text-white border border-neutral-700 rounded-xl px-3 py-2 text-sm transition-all"
                >
                  →
                </button>
              </div>

              {/* Calendar grid */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-neutral-800">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-bold text-neutral-500 uppercase">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                  {/* Empty cells for first day offset */}
                  {Array.from({ length: firstDayOfMonth(calendarYear, calendarMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-b border-r border-neutral-800 p-1 min-h-[60px]" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth(calendarYear, calendarMonth) }).map((_, i) => {
                    const day = i + 1
                    const today = new Date()
                    const isToday = today.getDate() === day && today.getMonth() === calendarMonth && today.getFullYear() === calendarYear
                    const dayClients = clientsByDate[day] || []

                    return (
                      <div key={day} className={`border-b border-r border-neutral-800 p-1 min-h-[60px] ${isToday ? 'bg-tascosa-orange/5' : ''}`}>
                        <p className={`text-xs font-bold mb-1 ${isToday ? 'text-tascosa-orange' : 'text-neutral-400'}`}>{day}</p>
                        {dayClients.map(c => (
                          <div key={c.id} className="bg-tascosa-orange/20 border border-tascosa-orange/30 rounded px-1 py-0.5 mb-0.5">
                            <p className="text-xs text-tascosa-orange font-bold truncate leading-tight">
                              {c.person1_first_name}{c.person2_first_name ? ` & ${c.person2_first_name}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* This month's bookings list */}
              {clientsThisMonth.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-1">{SHORT_MONTHS[calendarMonth]} Bookings</p>
                  <div className="space-y-2">
                    {clientsThisMonth.map(client => (
                      <div key={client.id} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-white text-sm">
                            {client.person1_first_name} {client.person1_last_name}
                            {client.person2_first_name && ` & ${client.person2_first_name} ${client.person2_last_name}`}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">{formatDate(client.wedding_date)}</p>
                        </div>
                        {(client.user_id || client.user_id_2) ? (
                          <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex-shrink-0">✓ Portal</span>
                        ) : (
                          <span className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full font-bold flex-shrink-0">No Portal</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clientsThisMonth.length === 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-sm">
                  No bookings this month.
                </div>
              )}
            </div>
          )}

          <div className="h-6" />
        </main>

        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Add New Client
              </h2>
              <p className="text-xs text-neutral-500 mb-4">Andy will be notified when you add a client.</p>

              <div className="space-y-3">
                {/* Wedding date */}
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Wedding Date *</label>
                  <input
                    type="date"
                    value={form.wedding_date}
                    onChange={e => setForm(p => ({ ...p, wedding_date: e.target.value }))}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange [color-scheme:dark]"
                  />
                </div>

                {/* Person 1 */}
                <div className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800 space-y-2">
                  <p className="text-xs font-bold text-tascosa-orange uppercase tracking-wider">Primary Contact</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">First Name *</label>
                      <input value={form.person1_first_name} onChange={e => setForm(p => ({ ...p, person1_first_name: e.target.value }))} placeholder="Sarah" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Last Name *</label>
                      <input value={form.person1_last_name} onChange={e => setForm(p => ({ ...p, person1_last_name: e.target.value }))} placeholder="Smith" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Email</label>
                    <input type="email" value={form.person1_email} onChange={e => setForm(p => ({ ...p, person1_email: e.target.value }))} placeholder="sarah@email.com" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Phone</label>
                    <input type="tel" value={form.person1_phone} onChange={e => setForm(p => ({ ...p, person1_phone: e.target.value }))} placeholder="(806) 555-0000" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                  </div>
                </div>

                {/* Person 2 toggle */}
                {!form.showPerson2 ? (
                  <button
                    onClick={() => setForm(p => ({ ...p, showPerson2: true }))}
                    className="w-full py-2.5 border border-dashed border-neutral-700 rounded-xl text-neutral-400 text-sm hover:border-tascosa-orange hover:text-tascosa-orange transition-all font-bold"
                  >
                    + Add Second Person
                  </button>
                ) : (
                  <div className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Second Person</p>
                      <button onClick={() => setForm(p => ({ ...p, showPerson2: false, person2_first_name: '', person2_last_name: '', person2_email: '', person2_phone: '' }))} className="text-xs text-neutral-600 hover:text-red-400 transition-all">Remove</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">First Name</label>
                        <input value={form.person2_first_name} onChange={e => setForm(p => ({ ...p, person2_first_name: e.target.value }))} placeholder="John" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Last Name</label>
                        <input value={form.person2_last_name} onChange={e => setForm(p => ({ ...p, person2_last_name: e.target.value }))} placeholder="Smith" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Email</label>
                      <input type="email" value={form.person2_email} onChange={e => setForm(p => ({ ...p, person2_email: e.target.value }))} placeholder="john@email.com" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Phone</label>
                      <input type="tel" value={form.person2_phone} onChange={e => setForm(p => ({ ...p, person2_phone: e.target.value }))} placeholder="(806) 555-0000" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setShowAddClient(false); setForm({ person1_first_name: '', person1_last_name: '', person1_email: '', person1_phone: '', person2_first_name: '', person2_last_name: '', person2_email: '', person2_phone: '', wedding_date: '', showPerson2: false }) }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addClient}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

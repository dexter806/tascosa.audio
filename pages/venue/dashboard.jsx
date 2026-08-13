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
  const [view, setView] = useState('list')
  const [showAddClient, setShowAddClient] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [successMsg, setSuccessMsg] = useState('')
  const [venueContacts, setVenueContacts] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', title: '', phone: '', email: '' })
  const [contactSaving, setContactSaving] = useState(false)

  const [form, setForm] = useState({
    person1_first_name: '', person1_last_name: '', person1_email: '', person1_phone: '',
    person2_first_name: '', person2_last_name: '', person2_email: '', person2_phone: '',
    wedding_date: '', showPerson2: false,
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }

      const { data: venueData, error } = await supabase
        .from('venues')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (error || !venueData) { router.push('/portal/login'); return }
      setVenue(venueData)
      setProfileForm({
        contact_name: venueData.contact_name || '',
        contact_title: venueData.contact_title || '',
        contact_phone: venueData.contact_phone || '',
        contact_email: venueData.contact_email || '',
        address: venueData.address || '',
        notes: venueData.notes || '',
      })

      // Load additional contacts
      const { data: contactsData } = await supabase
        .from('venue_contacts')
        .select('*')
        .eq('venue_id', venueData.id)
        .order('created_at', { ascending: true })
      setVenueContacts(contactsData || [])

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
    const { error } = await supabase.from('clients').update({ is_active: false }).eq('id', clientId)
    if (error) { console.error(error); return }
    await fetch('/api/venue-remove-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venueName: venue.name, clientName, clientId }),
    })
    setClients(prev => prev.filter(c => c.id !== clientId))
    setSuccessMsg(`${clientName} has been removed. Andy has been notified.`)
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  async function saveProfile() {
    setProfileSaving(true)
    const { error } = await supabase
      .from('venues')
      .update({
        contact_name: profileForm.contact_name,
        contact_title: profileForm.contact_title,
        contact_phone: profileForm.contact_phone,
        contact_email: profileForm.contact_email,
        address: profileForm.address,
        notes: profileForm.notes,
      })
      .eq('id', venue.id)

    if (!error) {
      setVenue(prev => ({ ...prev, ...profileForm }))
      setEditingProfile(false)
    }
    setProfileSaving(false)
  }

  async function addContact() {
    if (!contactForm.name) { alert('Please enter a contact name.'); return }
    setContactSaving(true)
    const { data: newContact, error } = await supabase
      .from('venue_contacts')
      .insert({ ...contactForm, venue_id: venue.id })
      .select()
      .single()

    if (!error && newContact) {
      setVenueContacts(prev => [...prev, newContact])
      setContactForm({ name: '', title: '', phone: '', email: '' })
      setShowAddContact(false)
    }
    setContactSaving(false)
  }

  async function deleteContact(id) {
    if (!confirm('Remove this contact?')) return
    await supabase.from('venue_contacts').delete().eq('id', id)
    setVenueContacts(prev => prev.filter(c => c.id !== id))
  }

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

        {/* Faded watermark logo */}
        {venue.logo_url && (
          <div className="fixed left-0 top-1/2 -translate-y-1/2 -translate-x-0 w-[600px] h-[600px] pointer-events-none z-0 select-none">
            <img src={venue.logo_url} alt="" className="w-full h-full object-contain opacity-[0.50] mix-blend-screen" />
          </div>
        )}

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {venue.logo_url ? (
                <img src={venue.logo_url} alt={venue.name} className="h-12 w-auto object-contain" />
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

          {successMsg && (
            <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl px-4 py-3 text-emerald-400 text-sm font-medium">
              ✓ {successMsg}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-extrabold">{venue.name}</h1>
              <p className="text-neutral-400 text-sm mt-0.5">Partner Portal · {upcoming.length} upcoming booking{upcoming.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowAddClient(true)} className="bg-tascosa-orange text-black font-black text-sm rounded-xl px-4 py-2.5 hover:brightness-110 active:scale-95 transition-all">
              + Add Client
            </button>
          </div>

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

          {/* Two column layout — bookings left, contact card right */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <div className="flex-1 min-w-0 space-y-4">

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
                  <button onClick={() => setShowAddClient(true)} className="mt-4 text-tascosa-orange text-sm font-bold hover:underline">+ Add your first client</button>
                </div>
              ) : (
                <>
                  {upcoming.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-1">Upcoming</p>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {(() => {
                          let lastYear = null
                          const rows = []
                          upcoming.forEach(client => {
                            const year = client.wedding_date ? new Date(client.wedding_date + 'T12:00:00').getFullYear() : null
                            if (year && year !== lastYear) {
                              rows.push(
                                <div key={`divider-${year}`} className="flex items-center gap-3 py-1">
                                  <div className="flex-1 h-px bg-neutral-800"></div>
                                  <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">{year}</span>
                                  <div className="flex-1 h-px bg-neutral-800"></div>
                                </div>
                              )
                              lastYear = year
                            }
                            const days = daysUntil(client.wedding_date)
                            rows.push(
                              <div key={client.id} onClick={() => router.push(`/venue/client/${client.id}`)} className="bg-neutral-900 border border-neutral-800 hover:border-tascosa-orange/40 rounded-2xl px-4 py-3 transition-all cursor-pointer group">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm group-hover:text-tascosa-orange transition-colors">
                                      {client.person1_first_name} {client.person1_last_name}
                                      {client.person2_first_name && ` & ${client.person2_first_name} ${client.person2_last_name}`}
                                    </p>
                                    <p className="text-xs text-neutral-400 mt-0.5">{formatDate(client.wedding_date)}</p>
                                    {client.person1_email && <p className="text-xs text-neutral-500 mt-0.5">{client.person1_email}</p>}
                                    <div className="flex items-center gap-2 mt-1.5">
                                      {(client.user_id || client.user_id_2) ? (
                                        <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Portal Active</span>
                                      ) : (
                                        <span className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full font-bold">No Portal Yet</span>
                                      )}
                                      {client.package && <span className="text-xs bg-tascosa-orange/10 text-tascosa-orange px-2 py-0.5 rounded-full font-bold">{client.package}</span>}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <span className={`text-xs font-black ${days === 0 ? 'text-red-400' : days <= 7 ? 'text-orange-400' : days <= 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                      {days === 0 ? 'TODAY!' : days === 1 ? 'Tomorrow' : `${days}d`}
                                    </span>
                                    <button
                                      onClick={e => { e.stopPropagation(); removeClient(client.id, `${client.person1_first_name} ${client.person1_last_name}`) }}
                                      className="text-xs text-red-400 border border-red-900 px-2 py-1 rounded-lg hover:bg-red-400/10 transition-all"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                          return rows
                        })()}
                      </div>
                    </div>
                  )}

                  {past.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-1 mt-4">Completed</p>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {past.map(client => (
                          <div key={client.id} onClick={() => router.push(`/venue/client/${client.id}`)} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl px-4 py-3 opacity-60 cursor-pointer hover:opacity-80 transition-all">
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
              <div className="flex items-center justify-between">
                <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) } else setCalendarMonth(m => m - 1) }}
                  className="text-neutral-400 hover:text-white border border-neutral-700 rounded-xl px-3 py-2 text-sm transition-all">←</button>
                <h2 className="font-bold text-white">{MONTHS[calendarMonth]} {calendarYear}</h2>
                <button onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) } else setCalendarMonth(m => m + 1) }}
                  className="text-neutral-400 hover:text-white border border-neutral-700 rounded-xl px-3 py-2 text-sm transition-all">→</button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-7 border-b border-neutral-800">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-bold text-neutral-500 uppercase">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDayOfMonth(calendarYear, calendarMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-b border-r border-neutral-800 p-1 min-h-[60px]" />
                  ))}
                  {Array.from({ length: daysInMonth(calendarYear, calendarMonth) }).map((_, i) => {
                    const day = i + 1
                    const today = new Date()
                    const isToday = today.getDate() === day && today.getMonth() === calendarMonth && today.getFullYear() === calendarYear
                    const dayClients = clientsByDate[day] || []
                    return (
                      <div key={day} className={`border-b border-r border-neutral-800 p-1 min-h-[60px] ${isToday ? 'bg-tascosa-orange/5' : ''}`}>
                        <p className={`text-xs font-bold mb-1 ${isToday ? 'text-tascosa-orange' : 'text-neutral-400'}`}>{day}</p>
                        {dayClients.map(c => (
                          <div key={c.id} onClick={() => router.push(`/venue/client/${c.id}`)} className="bg-tascosa-orange/20 border border-tascosa-orange/30 rounded px-1 py-0.5 mb-0.5 cursor-pointer hover:bg-tascosa-orange/30 transition-all">
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

              {clientsThisMonth.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-1">{SHORT_MONTHS[calendarMonth]} Bookings</p>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {clientsThisMonth.map(client => (
                      <div key={client.id} onClick={() => router.push(`/venue/client/${client.id}`)} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:border-tascosa-orange/40 transition-all">
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
            </div>{/* end left column */}

            </div>{/* end left column */}

            {/* Right — Venue Contact Card */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                    Venue Info
                  </h3>
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className={`text-xs border rounded-xl px-3 py-1.5 transition-all ${editingProfile ? 'border-tascosa-orange text-tascosa-orange' : 'border-neutral-700 text-neutral-400 hover:text-white'}`}
                  >
                    {editingProfile ? 'Cancel' : '✏️ Edit'}
                  </button>
                </div>

                {!editingProfile ? (
                  <div className="space-y-3">
                    {venue.address && (
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">Address</p>
                        <p className="text-sm text-white">{venue.address}</p>
                      </div>
                    )}
                    {venue.contact_name && (
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">Primary Contact</p>
                        <p className="text-sm text-white font-medium">{venue.contact_name}</p>
                        {venue.contact_title && <p className="text-xs text-neutral-400">{venue.contact_title}</p>}
                        {venue.contact_phone && <p className="text-xs text-neutral-400">{venue.contact_phone}</p>}
                        {venue.contact_email && <p className="text-xs text-neutral-400">{venue.contact_email}</p>}
                      </div>
                    )}
                    {!venue.contact_name && !venue.address && (
                      <p className="text-xs text-neutral-600 italic">No contact info yet. Click Edit to add.</p>
                    )}
                    {venue.notes && (
                      <div className="pt-3 border-t border-neutral-800">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{venue.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Address</label>
                      <input value={profileForm.address} onChange={e => setProfileForm(p => ({...p, address: e.target.value}))} placeholder="123 Main St, Amarillo TX" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Contact Name</label>
                      <input value={profileForm.contact_name} onChange={e => setProfileForm(p => ({...p, contact_name: e.target.value}))} placeholder="Jane Smith" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Title</label>
                      <input value={profileForm.contact_title} onChange={e => setProfileForm(p => ({...p, contact_title: e.target.value}))} placeholder="Wedding Coordinator" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Phone</label>
                      <input type="tel" value={profileForm.contact_phone} onChange={e => setProfileForm(p => ({...p, contact_phone: e.target.value}))} placeholder="(806) 555-0000" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Email</label>
                      <input type="email" value={profileForm.contact_email} onChange={e => setProfileForm(p => ({...p, contact_email: e.target.value}))} placeholder="jane@venue.com" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Notes</label>
                      <textarea value={profileForm.notes} onChange={e => setProfileForm(p => ({...p, notes: e.target.value}))} rows={3} placeholder="Parking info, load-in details, stage location..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                    </div>
                    <button onClick={saveProfile} disabled={profileSaving} className="w-full py-2.5 rounded-xl bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all">
                      {profileSaving ? 'Saving...' : 'Save Info'}
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Contacts */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                    Additional Contacts
                  </h3>
                  <button onClick={() => setShowAddContact(!showAddContact)} className="text-xs border border-neutral-700 text-neutral-400 hover:text-white rounded-xl px-3 py-1.5 transition-all">
                    {showAddContact ? 'Cancel' : '+ Add'}
                  </button>
                </div>

                {showAddContact && (
                  <div className="space-y-2 mb-4 pb-4 border-b border-neutral-800">
                    <input value={contactForm.name} onChange={e => setContactForm(p => ({...p, name: e.target.value}))} placeholder="Contact Name *" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    <input value={contactForm.title} onChange={e => setContactForm(p => ({...p, title: e.target.value}))} placeholder="Title / Role" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    <input type="tel" value={contactForm.phone} onChange={e => setContactForm(p => ({...p, phone: e.target.value}))} placeholder="Phone" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({...p, email: e.target.value}))} placeholder="Email" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    <button onClick={addContact} disabled={contactSaving} className="w-full py-2 rounded-xl bg-tascosa-orange text-black font-black text-sm hover:brightness-110 disabled:opacity-50 transition-all">
                      {contactSaving ? 'Saving...' : 'Add Contact'}
                    </button>
                  </div>
                )}

                {venueContacts.length === 0 && !showAddContact && (
                  <p className="text-xs text-neutral-600 italic">No additional contacts yet.</p>
                )}

                <div className="space-y-3">
                  {venueContacts.map(contact => (
                    <div key={contact.id} className="border border-neutral-800 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{contact.name}</p>
                          {contact.title && <p className="text-xs text-neutral-400">{contact.title}</p>}
                          {contact.phone && <p className="text-xs text-neutral-500 mt-0.5">{contact.phone}</p>}
                          {contact.email && <p className="text-xs text-neutral-500">{contact.email}</p>}
                        </div>
                        <button onClick={() => deleteContact(contact.id)} className="text-xs text-red-400 hover:text-red-300 transition-all flex-shrink-0">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* end right column */}
          </div>{/* end two column layout */}

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
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Wedding Date *</label>
                  <input type="date" value={form.wedding_date} onChange={e => setForm(p => ({ ...p, wedding_date: e.target.value }))} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange [color-scheme:dark]" />
                </div>
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
                {!form.showPerson2 ? (
                  <button onClick={() => setForm(p => ({ ...p, showPerson2: true }))} className="w-full py-2.5 border border-dashed border-neutral-700 rounded-xl text-neutral-400 text-sm hover:border-tascosa-orange hover:text-tascosa-orange transition-all font-bold">
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
                <button onClick={() => { setShowAddClient(false); setForm({ person1_first_name: '', person1_last_name: '', person1_email: '', person1_phone: '', person2_first_name: '', person2_last_name: '', person2_email: '', person2_phone: '', wedding_date: '', showPerson2: false }) }} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-sm font-bold transition-all">Cancel</button>
                <button onClick={addClient} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all">{saving ? 'Adding...' : 'Add Client'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

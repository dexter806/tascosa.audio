// FILE LOCATION: pages/admin/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Portal Dashboard — Tascosa Audio (Mobile Optimized)
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
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZnSg-uYwHIkH6JT6xXSWgA-WBpioUwYTwag0ihGab-Q7Ig21PJrljlMTlSism63VL/exec'

async function calendarSync(payload) {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('Calendar sync error:', err)
  }
}

function djColor(assignedTo) {
  if (assignedTo === 'Andy') return '6'
  if (assignedTo === 'Austin') return '3'
  if (assignedTo === 'Joe') return '4'
  if (assignedTo === 'Danny') return '5'
  return '6'
}
const TEAM = ['Andy', 'Austin', 'Joe', 'Danny']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  const event = new Date(d)
  event.setHours(0, 0, 0, 0)
  return Math.round((event - today) / (1000 * 60 * 60 * 24))
}

const HoldRow = ({ hold, onDelete }) => {
  const days = Math.ceil((new Date(hold.event_date + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))
  const formattedDate = new Date(hold.event_date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
  return (
    <div className="border border-yellow-500/40 bg-yellow-400/5 hover:border-yellow-400/70 rounded-2xl px-4 py-3 transition-all duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">📌 Hold</span>
            <p className="font-bold text-white text-sm">{hold.client_name}</p>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">{formattedDate}{hold.notes ? ` · ${hold.notes}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-sm font-bold text-yellow-400">{days > 0 ? `${days}d` : 'Today'}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(hold.id) }}
            className="text-xs px-2 py-1 rounded-lg border border-red-900 text-red-400 hover:bg-red-400/10 transition-all"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('adminSearch') || '' : '')
  const [filter, setFilter] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('adminFilter') || 'upcoming' : 'upcoming')
  const [showReports, setShowReports] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [expandedPerson, setExpandedPerson] = useState(null)
  const [personFilter, setPersonFilter] = useState('upcoming')
  const [holds, setHolds] = useState([])
  const [showAddHold, setShowAddHold] = useState(false)
  const [holdForm, setHoldForm] = useState({ event_date: '', client_name: '', notes: '' })
  const [holdSaving, setHoldSaving] = useState(false)
  const [syncAllStatus, setSyncAllStatus] = useState('idle')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }
      if (session.user.id !== ADMIN_USER_ID) { router.push('/portal/dashboard'); return }
      await loadClients()
    })
  }, [])

  async function loadClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('wedding_date', { ascending: true })
    if (error) { console.error(error); return }
    setClients(data || [])

    const { data: holdsData } = await supabase
      .from('holds')
      .select('*')
      .order('event_date', { ascending: true })
    setHolds(holdsData || [])
    setLoading(false)
  }

  async function addHold() {
    if (!holdForm.event_date || !holdForm.client_name) {
      alert('Please enter a date and client name.')
      return
    }
    setHoldSaving(true)
    const { data: newHold, error } = await supabase
      .from('holds')
      .insert(holdForm)
      .select()
      .single()

    if (!error && newHold) {
      await calendarSync({
        action: 'create',
        date: holdForm.event_date,
        title: `📌 HOLD — ${holdForm.client_name}`,
        notes: holdForm.notes || '',
        color: '5',
      })
      setHoldForm({ event_date: '', client_name: '', notes: '' })
      setShowAddHold(false)
      await loadClients()
    }
    setHoldSaving(false)
  }

  async function deleteHold(id) {
    if (!confirm('Remove this hold?')) return
    const hold = holds.find(h => h.id === id)
    await supabase.from('holds').delete().eq('id', id)
    setHolds(prev => prev.filter(h => h.id !== id))
    if (hold) {
      await calendarSync({
        action: 'delete_by_title',
        date: hold.event_date,
        title: `📌 HOLD — ${hold.client_name}`,
      })
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/portal/login')
  }

  async function syncAllToCalendar() {
    const today = new Date()
    const upcoming = clients.filter(c => c.wedding_date && new Date(c.wedding_date + 'T12:00:00') >= today)
    if (!confirm(`Sync ${upcoming.length} upcoming clients to Google Calendar?`)) return
    setSyncAllStatus('syncing')
    setShowMenu(false)

    for (const client of upcoming) {
      const eventTitle = `${client.person1_first_name} ${client.person1_last_name} & ${client.person2_first_name} ${client.person2_last_name} — ${client.venue || 'Venue TBD'}`
      const description = `Venue: ${client.venue || 'TBD'}\nPackage: ${client.package || 'TBD'}\nAssigned To: ${client.assigned_to || 'TBD'}\n${client.person1_first_name}: ${client.person1_email} · ${client.person1_phone || ''}\n${client.person2_first_name}: ${client.person2_email || ''} · ${client.person2_phone || ''}`
      const color = djColor(client.assigned_to)

      if (client.calendar_event_id === 'synced') {
        await calendarSync({ action: 'delete_by_title', date: client.wedding_date, title: eventTitle })
        await new Promise(r => setTimeout(r, 200))
        await calendarSync({ action: 'create', date: client.wedding_date, title: eventTitle, notes: description, color })
      } else {
        await calendarSync({ action: 'create', date: client.wedding_date, title: eventTitle, notes: description, color })
        await supabase.from('clients').update({ calendar_event_id: 'synced' }).eq('id', client.id)
      }
      await new Promise(r => setTimeout(r, 300))
    }

    setSyncAllStatus('done')
    setTimeout(() => setSyncAllStatus('idle'), 5000)
  }

  // ── COMPUTED VALUES ─────────────────────────────────────────────────────────
  const upcoming = clients.filter(c => (daysUntil(c.wedding_date) ?? -1) >= 0)
  const completed = clients.filter(c => (daysUntil(c.wedding_date) ?? 0) < 0)
  const totalCollected = clients.reduce((sum, c) => sum + (c.total_paid || 0), 0)
  const totalBalanceDue = clients.reduce((sum, c) => sum + (c.balance_due || 0), 0)
  const plannersDoneUpcoming = upcoming.filter(c => c.planner_completed).length

  const next7 = clients.filter(c => {
    const days = daysUntil(c.wedding_date)
    return days !== null && days >= 0 && days <= 7
  })

  const personStats = TEAM.map(person => ({
    name: person,
    total: clients.filter(c => c.assigned_to === person).length,
    upcoming: clients.filter(c => c.assigned_to === person && (daysUntil(c.wedding_date) ?? -1) >= 0).length,
    completed: clients.filter(c => c.assigned_to === person && (daysUntil(c.wedding_date) ?? 0) < 0).length,
    upcomingEvents: clients.filter(c => c.assigned_to === person && (daysUntil(c.wedding_date) ?? -1) >= 0),
    completedEvents: clients.filter(c => c.assigned_to === person && (daysUntil(c.wedding_date) ?? 0) < 0),
    allEvents: clients.filter(c => c.assigned_to === person),
  }))

  const years = [...new Set(clients.map(c => c.wedding_date ? new Date(c.wedding_date).getFullYear() : null).filter(Boolean))].sort()
  if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear())

  const monthlyData = MONTHS.map((month, idx) => {
    const monthClients = clients.filter(c => {
      if (!c.wedding_date) return false
      const d = new Date(c.wedding_date + 'T12:00:00')
      return d.getFullYear() === selectedYear && d.getMonth() === idx
    })
    return {
      month,
      count: monthClients.length,
      collected: monthClients.reduce((sum, c) => sum + (c.total_paid || 0), 0),
      due: monthClients.reduce((sum, c) => sum + (c.balance_due || 0), 0),
    }
  })

  const holdsAsRows = holds.filter(h => {
    const d = new Date(h.event_date + 'T12:00:00')
    return d >= new Date()
  }).map(h => ({ ...h, _isHold: true }))

  const filteredUpcoming = upcoming.filter(c => {
    const name = `${c.person1_first_name} ${c.person1_last_name} ${c.person2_first_name} ${c.person2_last_name} ${c.venue}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())
    let matchFilter = true
    if (filter === 'planner_pending') matchFilter = !c.planner_completed
    else if (filter === 'unassigned') matchFilter = !c.assigned_to
    else if (filter === 'balance_due') matchFilter = (c.balance_due || 0) > 0
    else if (filter === 'all_inclusive') matchFilter = c.package === 'All-Inclusive Partner'
    else if (filter === 'full_service') matchFilter = c.package === 'Wedding Full Service'
    return matchSearch && matchFilter
  })

  const allClients = clients.filter(c => {
    const name = `${c.person1_first_name} ${c.person1_last_name} ${c.person2_first_name} ${c.person2_last_name} ${c.venue}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  const ClientRow = ({ client }) => {
    const days = daysUntil(client.wedding_date)
    const sameRole = client.person1_role === client.person2_role
    const label1 = sameRole ? `${client.person1_first_name} (${client.person1_role})` : client.person1_role
    const label2 = sameRole ? `${client.person2_first_name} (${client.person2_role})` : client.person2_role
    return (
      <div
        onClick={() => router.push(`/admin/client/${client.id}`)}
        className="border border-neutral-800 hover:border-tascosa-orange/50 rounded-2xl px-4 py-3 cursor-pointer transition-all duration-200 group bg-neutral-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm group-hover:text-tascosa-orange transition-colors flex items-center gap-1.5 flex-wrap">
              {client.person1_first_name} & {client.person2_first_name} {client.person1_last_name}
              {(client.user_id || client.user_id_2) && <span className="text-emerald-400 text-xs">✓</span>}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5 truncate">
              {client.venue || 'Venue TBD'}
              {client.assigned_to && <span className="ml-1.5 text-tascosa-orange/70">· {client.assigned_to}</span>}
            </div>
            {/* Badges on their own row for mobile */}
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {client.package && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  client.package === 'All-Inclusive Partner' ? 'bg-purple-400/10 text-purple-400' :
                  client.package === 'Wedding Full Service' ? 'bg-blue-400/10 text-blue-400' :
                  'bg-neutral-700 text-neutral-300'
                }`}>
                  {client.package === 'All-Inclusive Partner' ? '★ All-Incl.' : client.package === 'Wedding Full Service' ? 'Full Svc' : client.package}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                client.planner_completed ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'
              }`}>
                {client.planner_completed ? '✓' : '⏳'}
              </span>
              {(client.balance_due || 0) > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-tascosa-orange/10 text-tascosa-orange">
                  ${client.balance_due?.toFixed(0)} due
                </span>
              )}
            </div>
          </div>
          {/* Date + days on right */}
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-semibold text-white">{formatDate(client.wedding_date)}</div>
            {days !== null && (
              <div className={`text-xs font-bold mt-0.5 ${
                days < 0 ? 'text-neutral-500' :
                days === 0 ? 'text-red-400' :
                days <= 7 ? 'text-orange-400' :
                days <= 30 ? 'text-yellow-400' :
                'text-emerald-400'
              }`}>
                {days < 0 ? 'Past' : days === 0 ? 'TODAY!' : `${days}d`}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Admin — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav — mobile friendly */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/TA Logo.png" alt="Tascosa Audio" className="h-7 w-auto object-contain" />
              <span className="font-bold text-sm">Admin</span>
              <span className="text-xs bg-tascosa-orange/20 text-tascosa-orange px-2 py-0.5 rounded-full font-bold">ANDY</span>
            </div>
            {/* Desktop nav buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => router.push('/admin/quotes')} className="text-xs border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white rounded-xl px-3 py-2 transition-all">
                📋 Quotes
              </button>
              <button onClick={() => { setShowAddHold(true) }} className="text-xs border border-yellow-500/50 text-yellow-400 hover:bg-yellow-400/10 rounded-xl px-3 py-2 transition-all">
                📌 Hold Date
              </button>
              <button onClick={syncAllToCalendar} disabled={syncAllStatus === 'syncing'} className="text-xs border border-blue-500/50 text-blue-400 hover:bg-blue-400/10 rounded-xl px-3 py-2 transition-all disabled:opacity-50">
                {syncAllStatus === 'syncing' ? '⏳ Syncing...' : syncAllStatus === 'done' ? '✓ Synced!' : '📅 Sync Calendar'}
              </button>
              <button onClick={() => setShowReports(!showReports)} className={`text-xs border rounded-xl px-3 py-2 transition-all ${showReports ? 'border-tascosa-orange text-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'}`}>
                📊 Reports
              </button>
              <button onClick={handleSignOut} className="text-xs text-neutral-500 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-xl px-3 py-2 transition-all">
                Sign Out
              </button>
            </div>
            {/* Mobile hamburger menu */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden text-neutral-400 hover:text-white border border-neutral-700 rounded-xl px-3 py-2 text-sm transition-all"
            >
              {showMenu ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {showMenu && (
            <div className="md:hidden border-t border-neutral-800 bg-neutral-950 px-4 py-3 space-y-2">
              <button onClick={() => { router.push('/admin/quotes'); setShowMenu(false) }} className="w-full text-left text-sm border border-neutral-700 text-neutral-300 rounded-xl px-4 py-3 transition-all hover:border-neutral-500">
                📋 Quotes
              </button>
              <button onClick={() => { setShowAddHold(true); setShowMenu(false) }} className="w-full text-left text-sm border border-yellow-500/50 text-yellow-400 rounded-xl px-4 py-3 transition-all hover:bg-yellow-400/10">
                📌 Hold Date
              </button>
              <button onClick={syncAllToCalendar} disabled={syncAllStatus === 'syncing'} className="w-full text-left text-sm border border-blue-500/50 text-blue-400 rounded-xl px-4 py-3 transition-all hover:bg-blue-400/10 disabled:opacity-50">
                {syncAllStatus === 'syncing' ? '⏳ Syncing...' : syncAllStatus === 'done' ? '✓ Synced!' : '📅 Sync Calendar'}
              </button>
              <button onClick={() => { setShowReports(!showReports); setShowMenu(false) }} className={`w-full text-left text-sm border rounded-xl px-4 py-3 transition-all ${showReports ? 'border-tascosa-orange text-tascosa-orange' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'}`}>
                📊 Reports
              </button>
              <button onClick={() => { handleSignOut(); setShowMenu(false) }} className="w-full text-left text-sm border border-neutral-700 text-neutral-500 rounded-xl px-4 py-3 transition-all hover:border-neutral-500 hover:text-white">
                Sign Out
              </button>
            </div>
          )}
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* ── THIS WEEKEND ─────────────────────────────────────────────── */}
          {next7.length > 0 && (
            <div className="rounded-2xl border border-tascosa-orange/40 bg-tascosa-orange/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-tascosa-orange/20 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-tascosa-orange animate-pulse"></span>
                <h2 className="text-xs font-bold text-tascosa-orange uppercase tracking-wider">Coming Up — Next 7 Days</h2>
              </div>
              <div className="divide-y divide-tascosa-orange/10">
                {next7.map(c => {
                  const days = daysUntil(c.wedding_date)
                  return (
                    <button key={c.id} onClick={() => router.push(`/admin/client/${c.id}`)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-tascosa-orange/10 transition-all text-left">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{c.person1_first_name} & {c.person2_first_name} {c.person1_last_name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">{c.venue || 'Venue TBD'}{c.assigned_to && <span className="ml-1.5 text-tascosa-orange">· {c.assigned_to}</span>}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-xs font-semibold text-white">{formatDate(c.wedding_date)}</p>
                        <p className={`text-xs font-black mt-0.5 ${days === 0 ? 'text-red-400' : days === 1 ? 'text-orange-400' : 'text-tascosa-orange'}`}>
                          {days === 0 ? 'TODAY!' : days === 1 ? 'TOMORROW!' : `${days} days`}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── STATS BAR ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-tascosa-orange">{upcoming.length}</div>
              <div className="text-xs text-neutral-600 mt-0.5 uppercase tracking-wide">Upcoming</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{plannersDoneUpcoming}/{upcoming.length}</div>
              <div className="text-xs text-neutral-600 mt-0.5 uppercase tracking-wide">Planners Done</div>
            </div>
          </div>

          {/* ── REPORTS (collapsible) ─────────────────────────────────────── */}
          {showReports && (
            <div className="space-y-5 border border-neutral-800 rounded-2xl p-4 bg-neutral-900/30">
              <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Reports
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Clients', value: clients.length, color: 'text-white' },
                  { label: 'Completed', value: completed.length, color: 'text-neutral-400' },
                  { label: 'Collected', value: `$${totalCollected.toFixed(0)}`, color: 'text-emerald-400' },
                  { label: 'Balance Due', value: `$${totalBalanceDue.toFixed(0)}`, color: 'text-yellow-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-center">
                    <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-neutral-600 mt-0.5 uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Team */}
              <div>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Team Events</p>
                  <div className="flex gap-1.5">
                    {['upcoming', 'completed', 'all'].map(f => (
                      <button key={f} onClick={() => setPersonFilter(f)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all capitalize ${personFilter === f ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {personStats.map(person => {
                    const events = personFilter === 'upcoming' ? person.upcomingEvents : personFilter === 'completed' ? person.completedEvents : person.allEvents
                    const count = personFilter === 'upcoming' ? person.upcoming : personFilter === 'completed' ? person.completed : person.total
                    return (
                      <div key={person.name} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                        <button onClick={() => setExpandedPerson(expandedPerson === person.name ? null : person.name)}
                          className="w-full p-3 text-left hover:bg-neutral-800/50 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{person.name}</span>
                            <span className="text-xs text-neutral-600">{expandedPerson === person.name ? '▲' : '▼'}</span>
                          </div>
                          <div className="text-2xl font-black text-tascosa-orange mt-1">{count}</div>
                          <div className="text-xs text-neutral-500 capitalize">{personFilter}</div>
                        </button>
                        {expandedPerson === person.name && (
                          <div className="border-t border-neutral-800 max-h-48 overflow-y-auto">
                            {events.length === 0 ? (
                              <p className="text-xs text-neutral-600 p-3 text-center">No events</p>
                            ) : (
                              events.map(c => (
                                <button key={c.id} onClick={() => router.push(`/admin/client/${c.id}`)}
                                  className="w-full text-left px-3 py-2.5 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-all">
                                  <p className="text-xs font-medium text-white">{c.person1_first_name} & {c.person2_first_name}</p>
                                  <p className="text-xs text-neutral-500">{formatDate(c.wedding_date)}</p>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Monthly revenue */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Monthly Revenue</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {years.map(y => (
                      <button key={y} onClick={() => setSelectedYear(y)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${selectedYear === y ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {monthlyData.map((m) => (
                    <div key={m.month} className={`rounded-xl p-2 text-center border ${m.count > 0 ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-800 bg-neutral-900/30'}`}>
                      <p className="text-xs font-bold text-neutral-500">{m.month}</p>
                      <p className={`text-sm font-black mt-0.5 ${m.count > 0 ? 'text-white' : 'text-neutral-700'}`}>{m.count}</p>
                      {m.collected > 0 && <p className="text-xs text-emerald-400 font-bold">${(m.collected/1000).toFixed(1)}k</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* All clients in reports */}
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">All Clients ({allClients.length})</p>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {allClients.map(client => <ClientRow key={client.id} client={client} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── FILTER ───────────────────────────────────────────────────── */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); sessionStorage.setItem('adminSearch', e.target.value) }}
              placeholder="Search by name or venue..."
              className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all mb-3"
            />
            <div className="flex gap-2 flex-wrap">
              {[
                { val: 'upcoming', label: 'All' },
                { val: 'planner_pending', label: '⏳ Pending' },
                { val: 'unassigned', label: 'Unassigned' },
                { val: 'balance_due', label: 'Balance Due' },
                { val: 'all_inclusive', label: '★ All-Incl.' },
                { val: 'full_service', label: 'Full Svc' },
              ].map(f => (
                <button key={f.val}
                  onClick={() => { setFilter(f.val); sessionStorage.setItem('adminFilter', f.val) }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === f.val ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── CLIENT LIST ──────────────────────────────────────────────── */}
          <div>
            <h2 className="font-bold mb-3 flex items-center gap-2 text-sm">
              <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
              Upcoming Clients
              <span className="text-neutral-500 font-normal">({filteredUpcoming.length})</span>
            </h2>
            {filteredUpcoming.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500 text-sm">
                No clients found.
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const sorted = [
                    ...filteredUpcoming.map(c => ({ ...c, _isHold: false })),
                    ...holdsAsRows
                  ].sort((a, b) => new Date(a.wedding_date || a.event_date) - new Date(b.wedding_date || b.event_date))

                  let lastYear = null
                  const rows = []

                  sorted.forEach(item => {
                    const dateStr = item.wedding_date || item.event_date
                    const year = dateStr ? new Date(dateStr + 'T12:00:00').getFullYear() : null

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

                    rows.push(item._isHold
                      ? <HoldRow key={item.id} hold={item} onDelete={deleteHold} />
                      : <ClientRow key={item.id} client={item} />
                    )
                  })

                  return rows
                })()}
              </div>
            )}
          </div>

          {/* Bottom padding for mobile */}
          <div className="h-6" />

        </main>

        {/* Add Hold Modal */}
        {showAddHold && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-neutral-900 border border-yellow-500/30 rounded-2xl p-5 w-full max-w-md">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="h-4 w-1 bg-yellow-400 rounded-full"></span>
                Hold a Date
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Event Date *</label>
                  <input
                    type="date"
                    value={holdForm.event_date}
                    onChange={e => setHoldForm(p => ({ ...p, event_date: e.target.value }))}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Client Name *</label>
                  <input
                    type="text"
                    value={holdForm.client_name}
                    onChange={e => setHoldForm(p => ({ ...p, client_name: e.target.value }))}
                    placeholder="Sarah & John Smith"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Notes</label>
                  <textarea
                    value={holdForm.notes}
                    onChange={e => setHoldForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    placeholder="Venue, event type, any details..."
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowAddHold(false); setHoldForm({ event_date: '', client_name: '', notes: '' }) }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addHold}
                  disabled={holdSaving}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {holdSaving ? 'Saving...' : '📌 Hold Date'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

// FILE LOCATION: pages/admin/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Portal Dashboard — Tascosa Audio (Cleaned Up)
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

export default function AdminDashboard() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('adminSearch') || '' : '')
  const [filter, setFilter] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('adminFilter') || 'upcoming' : 'upcoming')
  const [showReports, setShowReports] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [expandedPerson, setExpandedPerson] = useState(null)
  const [personFilter, setPersonFilter] = useState('upcoming') // upcoming | completed | all

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
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/portal/login')
  }

  // ── COMPUTED VALUES ─────────────────────────────────────────────────────────
  const upcoming = clients.filter(c => (daysUntil(c.wedding_date) ?? -1) >= 0)
  const completed = clients.filter(c => (daysUntil(c.wedding_date) ?? 0) < 0)
  const totalCollected = clients.reduce((sum, c) => sum + (c.total_paid || 0), 0)
  const totalBalanceDue = clients.reduce((sum, c) => sum + (c.balance_due || 0), 0)
  const plannersDoneUpcoming = upcoming.filter(c => c.planner_completed).length

  // Next 7 days
  const next7 = clients.filter(c => {
    const days = daysUntil(c.wedding_date)
    return days !== null && days >= 0 && days <= 7
  })

  // Team stats
  const personStats = TEAM.map(person => ({
    name: person,
    total: clients.filter(c => c.assigned_to === person).length,
    upcoming: clients.filter(c => c.assigned_to === person && (daysUntil(c.wedding_date) ?? -1) >= 0).length,
    completed: clients.filter(c => c.assigned_to === person && (daysUntil(c.wedding_date) ?? 0) < 0).length,
    upcomingEvents: clients.filter(c => c.assigned_to === person && (daysUntil(c.wedding_date) ?? -1) >= 0),
    completedEvents: clients.filter(c => c.assigned_to === person && (daysUntil(c.wedding_date) ?? 0) < 0),
    allEvents: clients.filter(c => c.assigned_to === person),
  }))

  // Years for monthly report
  const years = [...new Set(clients.map(c => c.wedding_date ? new Date(c.wedding_date).getFullYear() : null).filter(Boolean))].sort()
  if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear())

  // Monthly data
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

  // Filtered upcoming client list (main dashboard)
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

  // All clients for reports
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
        className="border border-neutral-800 hover:border-tascosa-orange/50 rounded-2xl px-5 py-4 cursor-pointer transition-all duration-200 group bg-neutral-900"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white group-hover:text-tascosa-orange transition-colors">
              {client.person1_first_name} {client.person1_last_name} & {client.person2_first_name} {client.person2_last_name}
            </div>
            <div className="text-sm text-neutral-400 mt-0.5 truncate">
              {label1} & {label2} · {client.venue || 'Venue TBD'}
              {client.assigned_to && <span className="ml-2 text-tascosa-orange/70">· {client.assigned_to}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-semibold text-white">{formatDate(client.wedding_date)}</div>
            {days !== null && (
              <div className={`text-xs font-bold mt-0.5 ${
                days < 0 ? 'text-neutral-500' :
                days === 0 ? 'text-red-400' :
                days <= 7 ? 'text-orange-400' :
                days <= 30 ? 'text-yellow-400' :
                'text-emerald-400'
              }`}>
                {days < 0 ? 'Past event' : days === 0 ? 'TODAY!' : `${days} days away`}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {client.package && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                client.package === 'All-Inclusive Partner' ? 'bg-purple-400/10 text-purple-400' :
                client.package === 'Wedding Full Service' ? 'bg-blue-400/10 text-blue-400' :
                'bg-neutral-700 text-neutral-300'
              }`}>
                {client.package === 'All-Inclusive Partner' ? '★ All-Inclusive' : client.package}
              </span>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              client.planner_completed ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'
            }`}>
              {client.planner_completed ? '✓ Done' : '⏳ Pending'}
            </span>
            {(client.balance_due || 0) > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-tascosa-orange/10 text-tascosa-orange">
                ${client.balance_due?.toFixed(0)} due
              </span>
            )}
          </div>
          <div className="text-neutral-600 group-hover:text-tascosa-orange transition-colors">→</div>
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

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/TA Logo.png" alt="Tascosa Audio" className="h-8 w-auto object-contain" />
              <span className="font-bold text-sm tracking-wide">Admin</span>
              <span className="text-xs bg-tascosa-orange/20 text-tascosa-orange px-2 py-0.5 rounded-full font-bold">ANDY</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/quotes')}
                className="text-xs border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white rounded-xl px-3 py-2 transition-all"
              >
                📋 Quotes
              </button>
              <button
                onClick={() => setShowReports(!showReports)}
                className={`text-xs border rounded-xl px-3 py-2 transition-all ${
                  showReports ? 'border-tascosa-orange text-tascosa-orange bg-tascosa-orange/10' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
                }`}
              >
                📊 Reports
              </button>
              <button onClick={handleSignOut} className="text-xs text-neutral-500 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-xl px-3 py-2 transition-all">
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* ── THIS WEEKEND ─────────────────────────────────────────────── */}
          {next7.length > 0 && (
            <div className="rounded-2xl border border-tascosa-orange/40 bg-tascosa-orange/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-tascosa-orange/20 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-tascosa-orange animate-pulse"></span>
                <h2 className="text-sm font-bold text-tascosa-orange uppercase tracking-wider">Coming Up — Next 7 Days</h2>
              </div>
              <div className="divide-y divide-tascosa-orange/10">
                {next7.map(c => {
                  const days = daysUntil(c.wedding_date)
                  return (
                    <button key={c.id} onClick={() => router.push(`/admin/client/${c.id}`)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-tascosa-orange/10 transition-all text-left">
                      <div>
                        <p className="font-bold text-white">{c.person1_first_name} {c.person1_last_name} & {c.person2_first_name} {c.person2_last_name}</p>
                        <p className="text-sm text-neutral-400 mt-0.5">{c.venue || 'Venue TBD'}{c.assigned_to && <span className="ml-2 text-tascosa-orange">· {c.assigned_to}</span>}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm font-semibold text-white">{formatDate(c.wedding_date)}</p>
                        <p className={`text-xs font-black mt-0.5 ${days === 0 ? 'text-red-400' : days === 1 ? 'text-orange-400' : 'text-tascosa-orange'}`}>
                          {days === 0 ? 'TODAY!' : days === 1 ? 'TOMORROW!' : `${days} days away`}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SLIM STATS BAR ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-tascosa-orange">{upcoming.length}</div>
              <div className="text-xs text-neutral-600 mt-0.5 uppercase tracking-wide">Upcoming Events</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{plannersDoneUpcoming}/{upcoming.length}</div>
              <div className="text-xs text-neutral-600 mt-0.5 uppercase tracking-wide">Planners Done</div>
            </div>
          </div>

          {/* ── REPORTS (collapsible) ─────────────────────────────────────── */}
          {showReports && (
            <div className="space-y-5 border border-neutral-800 rounded-2xl p-5 bg-neutral-900/30">
              <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Reports
              </h2>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Clients', value: clients.length, color: 'text-white' },
                  { label: 'Completed Events', value: completed.length, color: 'text-neutral-400' },
                  { label: 'Total Collected', value: `$${totalCollected.toFixed(0)}`, color: 'text-emerald-400' },
                  { label: 'Balance Due', value: `$${totalBalanceDue.toFixed(0)}`, color: 'text-yellow-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
                    <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-neutral-600 mt-0.5 uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Team counters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Team Events</p>
                  <div className="flex gap-2">
                    {['upcoming', 'completed', 'all'].map(f => (
                      <button key={f} onClick={() => setPersonFilter(f)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${personFilter === f ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {personStats.map(person => {
                    const events = personFilter === 'upcoming' ? person.upcomingEvents : personFilter === 'completed' ? person.completedEvents : person.allEvents
                    const count = personFilter === 'upcoming' ? person.upcoming : personFilter === 'completed' ? person.completed : person.total
                    return (
                      <div key={person.name} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                        <button onClick={() => setExpandedPerson(expandedPerson === person.name ? null : person.name)}
                          className="w-full p-4 text-left hover:bg-neutral-800/50 transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{person.name}</span>
                            <span className="text-xs text-neutral-600">{expandedPerson === person.name ? '▲' : '▼'}</span>
                          </div>
                          <div className="text-2xl font-black text-tascosa-orange mt-1">{count}</div>
                          <div className="text-xs text-neutral-500 capitalize">{personFilter} events</div>
                        </button>
                        {expandedPerson === person.name && (
                          <div className="border-t border-neutral-800 max-h-48 overflow-y-auto">
                            {events.length === 0 ? (
                              <p className="text-xs text-neutral-600 p-3 text-center">No events</p>
                            ) : (
                              events.map(c => (
                                <button key={c.id} onClick={() => router.push(`/admin/client/${c.id}`)}
                                  className="w-full text-left px-4 py-2.5 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-all">
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
                  <div className="flex gap-2">
                    {years.map(y => (
                      <button key={y} onClick={() => setSelectedYear(y)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedYear === y ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {monthlyData.map((m) => (
                    <div key={m.month} className={`rounded-xl p-2.5 text-center border ${m.count > 0 ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-800 bg-neutral-900/30'}`}>
                      <p className="text-xs font-bold text-neutral-500">{m.month}</p>
                      <p className={`text-base font-black mt-0.5 ${m.count > 0 ? 'text-white' : 'text-neutral-700'}`}>{m.count}</p>
                      {m.collected > 0 && <p className="text-xs text-emerald-400 font-bold">${m.collected}</p>}
                      {m.due > 0 && <p className="text-xs text-yellow-400">${m.due}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Full client list in reports */}
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">All Clients ({allClients.length})</p>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {allClients.map(client => <ClientRow key={client.id} client={client} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── FILTER ───────────────────────────────────────────────────── */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
              <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
              Filter Clients
            </h2>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); sessionStorage.setItem('adminSearch', e.target.value) }}
              placeholder="Search by name or venue..."
              className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all mb-3"
            />
            <div className="flex gap-2 flex-wrap">
              {[
                { val: 'upcoming', label: 'All Upcoming' },
                { val: 'planner_pending', label: 'Planner Pending' },
                { val: 'unassigned', label: 'Unassigned' },
                { val: 'balance_due', label: 'Balance Due' },
                { val: 'all_inclusive', label: 'All-Inclusive' },
                { val: 'full_service', label: 'Full Service' },
              ].map(f => (
                <button key={f.val}
                  onClick={() => { setFilter(f.val); sessionStorage.setItem('adminFilter', f.val) }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === f.val ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── UPCOMING CLIENT LIST (scrollable) ────────────────────────── */}
          <div>
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
              Upcoming Clients
              <span className="text-neutral-500 font-normal text-sm">({filteredUpcoming.length})</span>
            </h2>
            {filteredUpcoming.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
                No clients found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredUpcoming.map(client => <ClientRow key={client.id} client={client} />)}
              </div>
            )}
          </div>

        </main>
      </div>
    </>
  )
}

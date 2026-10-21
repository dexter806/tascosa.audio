// FILE LOCATION: pages/admin/reports.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Reports — Tascosa Audio
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
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr + 'T12:00:00'); d.setHours(0,0,0,0)
  return Math.round((d - today) / (1000 * 60 * 60 * 24))
}

function fmt$(n) {
  if (!n) return '$0'
  if (n >= 1000) return `$${(n/1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

// ── Mini bar chart (pure CSS, no library) ────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color = 'bg-tascosa-orange', maxOverride }) {
  const max = maxOverride || Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => {
        const h = max > 0 ? Math.round(((d[valueKey] || 0) / max) * 100) : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              className={`w-full rounded-t-sm transition-all duration-300 ${color} opacity-80 group-hover:opacity-100 min-h-[2px]`}
              style={{ height: `${h}%` }}
            />
            {d[valueKey] > 0 && (
              <div className="absolute bottom-full mb-1 bg-neutral-800 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {typeof d[valueKey] === 'number' && d[valueKey] > 500 ? fmt$(d[valueKey]) : d[valueKey]}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Stat tile ────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-neutral-500 mt-0.5 uppercase tracking-wide">{label}</div>
      {sub && <div className="text-xs text-neutral-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function AdminReports() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [cancelledClients, setCancelledClients] = useState([])
  const [holds, setHolds] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState('overview') // overview | team | clients | holds | events
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('all') // all | upcoming | past | cancelled
  const [assignedFilter, setAssignedFilter] = useState('all')
  const [packageFilter, setPackageFilter] = useState('all')
  const [expandedPerson, setExpandedPerson] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }
      if (session.user.id !== ADMIN_USER_ID) { router.push('/portal/dashboard'); return }
      await loadData()
    })
  }, [])

  async function loadData() {
    const [{ data: active }, { data: cancelled }, { data: holdsData }, { data: eventsData }] = await Promise.all([
      supabase.from('clients').select('*').eq('is_active', true).order('wedding_date', { ascending: true }),
      supabase.from('clients').select('*').eq('is_active', false).order('wedding_date', { ascending: true }),
      supabase.from('holds').select('*').order('event_date', { ascending: true }),
      supabase.from('events').select('*').order('event_date', { ascending: true }),
    ])
    setClients(active || [])
    setCancelledClients(cancelled || [])
    setHolds(holdsData || [])
    setEvents(eventsData || [])
    setLoading(false)
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const allClients = [...clients, ...cancelledClients]
  const upcoming = clients.filter(c => (daysUntil(c.wedding_date) ?? -1) >= 0)
  const completed = clients.filter(c => (daysUntil(c.wedding_date) ?? 0) < 0)

  const years = [...new Set(allClients.map(c => c.wedding_date ? new Date(c.wedding_date + 'T12:00:00').getFullYear() : null).filter(Boolean))].sort()
  if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear())

  const clientsThisYear = allClients.filter(c => c.wedding_date && new Date(c.wedding_date + 'T12:00:00').getFullYear() === selectedYear)
  const totalCollected = clients.reduce((s, c) => s + (c.total_paid || 0), 0)
  const totalDue = clients.reduce((s, c) => s + (c.balance_due || 0), 0)
  const yearCollected = clientsThisYear.reduce((s, c) => s + (c.total_paid || 0), 0)
  const yearDue = clientsThisYear.reduce((s, c) => s + (c.balance_due || 0), 0)

  const monthlyData = MONTH_SHORT.map((month, idx) => {
    const mc = clientsThisYear.filter(c => {
      const d = new Date(c.wedding_date + 'T12:00:00')
      return d.getMonth() === idx
    })
    return {
      month,
      count: mc.length,
      collected: mc.reduce((s, c) => s + (c.total_paid || 0), 0),
      due: mc.reduce((s, c) => s + (c.balance_due || 0), 0),
    }
  })

  const packageCounts = {}
  clients.forEach(c => {
    const pkg = c.package || 'Unspecified'
    packageCounts[pkg] = (packageCounts[pkg] || 0) + 1
  })

  const personStats = TEAM.map(person => {
    const all = clients.filter(c => c.assigned_to === person)
    const up = all.filter(c => (daysUntil(c.wedding_date) ?? -1) >= 0)
    const done = all.filter(c => (daysUntil(c.wedding_date) ?? 0) < 0)
    const thisYr = all.filter(c => c.wedding_date && new Date(c.wedding_date + 'T12:00:00').getFullYear() === selectedYear)
    return { name: person, all, upcoming: up, completed: done, thisYear: thisYr }
  })

  // Client browser filter
  const browsedClients = (() => {
    let pool = clientFilter === 'cancelled' ? cancelledClients : clients
    if (clientFilter === 'upcoming') pool = upcoming
    else if (clientFilter === 'past') pool = completed
    else if (clientFilter === 'all') pool = [...clients, ...cancelledClients]

    if (assignedFilter !== 'all') pool = pool.filter(c => c.assigned_to === assignedFilter)
    if (packageFilter !== 'all') pool = pool.filter(c => c.package === packageFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      pool = pool.filter(c =>
        `${c.person1_first_name} ${c.person1_last_name} ${c.person2_first_name} ${c.person2_last_name} ${c.venue || ''}`.toLowerCase().includes(q)
      )
    }
    return pool
  })()

  const packages = [...new Set(allClients.map(c => c.package).filter(Boolean))]

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-neutral-400 text-sm animate-pulse">Loading...</div>
    </div>
  )

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'team', label: '👥 Team' },
    { id: 'clients', label: '📋 Clients' },
    { id: 'holds', label: '📌 Holds' },
    { id: 'events', label: '🎵 Events' },
  ]

  return (
    <>
      <Head>
        <title>Reports — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
            >
              ← Dashboard
            </button>
            <div className="w-px h-5 bg-neutral-700" />
            <h1 className="font-bold text-sm flex items-center gap-2">
              <span>📊</span> Reports
            </h1>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* Year selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-500 uppercase tracking-wider">Year</span>
            {years.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedYear === y ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                {y}
              </button>
            ))}
            <button onClick={() => setSelectedYear('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedYear === 'all' ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
              All Time
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">

              {/* Top stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Total Clients" value={clients.length} color="text-white" />
                <Stat label="Upcoming" value={upcoming.length} color="text-tascosa-orange" />
                <Stat label="Completed" value={completed.length} color="text-neutral-400" />
                <Stat label="Cancelled" value={cancelledClients.length} color="text-red-400/70" />
              </div>

              {/* Revenue */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                  {selectedYear === 'all' ? 'All-Time Revenue' : `${selectedYear} Revenue`}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat
                    label="Collected"
                    value={fmt$(selectedYear === 'all' ? totalCollected : yearCollected)}
                    color="text-emerald-400"
                  />
                  <Stat
                    label="Balance Due"
                    value={fmt$(selectedYear === 'all' ? totalDue : yearDue)}
                    color="text-yellow-400"
                  />
                  <Stat
                    label="Total Value"
                    value={fmt$(selectedYear === 'all' ? totalCollected + totalDue : yearCollected + yearDue)}
                    color="text-white"
                  />
                  <Stat
                    label="Avg per Event"
                    value={fmt$(
                      selectedYear === 'all'
                        ? clients.length ? (totalCollected + totalDue) / clients.length : 0
                        : clientsThisYear.length ? (yearCollected + yearDue) / clientsThisYear.length : 0
                    )}
                    color="text-neutral-300"
                  />
                </div>

                {selectedYear !== 'all' && (
                  <>
                    {/* Bar chart */}
                    <div>
                      <p className="text-xs text-neutral-500 mb-2">Events per month — {selectedYear}</p>
                      <BarChart data={monthlyData} valueKey="count" labelKey="month" color="bg-tascosa-orange" />
                      <div className="flex gap-1 mt-1">
                        {monthlyData.map(d => (
                          <div key={d.month} className="flex-1 text-center text-xs text-neutral-600">{d.month}</div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue bar chart */}
                    <div>
                      <p className="text-xs text-neutral-500 mb-2">Collected per month — {selectedYear}</p>
                      <BarChart data={monthlyData} valueKey="collected" labelKey="month" color="bg-emerald-500" />
                      <div className="flex gap-1 mt-1">
                        {monthlyData.map(d => (
                          <div key={d.month} className="flex-1 text-center text-xs text-neutral-600">{d.month}</div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-neutral-500 border-b border-neutral-800">
                            <th className="text-left py-2 pr-4 font-semibold uppercase tracking-wide">Month</th>
                            <th className="text-right py-2 px-2 font-semibold uppercase tracking-wide">Events</th>
                            <th className="text-right py-2 px-2 font-semibold uppercase tracking-wide">Collected</th>
                            <th className="text-right py-2 px-2 font-semibold uppercase tracking-wide">Due</th>
                            <th className="text-right py-2 pl-2 font-semibold uppercase tracking-wide">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyData.filter(m => m.count > 0).map(m => (
                            <tr key={m.month} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                              <td className="py-2.5 pr-4 font-medium text-white">{m.month}</td>
                              <td className="py-2.5 px-2 text-right text-neutral-300">{m.count}</td>
                              <td className="py-2.5 px-2 text-right text-emerald-400 font-bold">{fmt$(m.collected)}</td>
                              <td className="py-2.5 px-2 text-right text-yellow-400">{fmt$(m.due)}</td>
                              <td className="py-2.5 pl-2 text-right text-white font-bold">{fmt$(m.collected + m.due)}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-neutral-700 font-black">
                            <td className="py-2.5 pr-4 text-neutral-400">Total</td>
                            <td className="py-2.5 px-2 text-right text-white">{clientsThisYear.length}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-400">{fmt$(yearCollected)}</td>
                            <td className="py-2.5 px-2 text-right text-yellow-400">{fmt$(yearDue)}</td>
                            <td className="py-2.5 pl-2 text-right text-white">{fmt$(yearCollected + yearDue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Package breakdown */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
                  <span className="h-4 w-1 bg-purple-400 rounded-full"></span>
                  Package Mix (Active Clients)
                </h2>
                <div className="space-y-2">
                  {Object.entries(packageCounts).sort((a, b) => b[1] - a[1]).map(([pkg, count]) => {
                    const pct = clients.length ? Math.round((count / clients.length) * 100) : 0
                    const color = pkg === 'All-Inclusive Partner' ? 'bg-purple-400' : pkg === 'Wedding Full Service' ? 'bg-blue-400' : 'bg-neutral-500'
                    return (
                      <div key={pkg}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-neutral-300">{pkg}</span>
                          <span className="text-neutral-500">{count} · {pct}%</span>
                        </div>
                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ── TEAM TAB ───────────────────────────────────────────────────── */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {personStats.map(p => (
                  <div key={p.name} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedPerson(expandedPerson === p.name ? null : p.name)}
                      className="w-full p-4 text-left hover:bg-neutral-800/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-xs text-neutral-600">{expandedPerson === p.name ? '▲' : '▼'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center">
                          <div className="text-xl font-black text-tascosa-orange">{selectedYear === 'all' ? p.all.length : p.thisYear.length}</div>
                          <div className="text-xs text-neutral-600 mt-0.5">{selectedYear === 'all' ? 'All Time' : selectedYear}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-black text-emerald-400">{p.upcoming.length}</div>
                          <div className="text-xs text-neutral-600 mt-0.5">Upcoming</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-black text-neutral-500">{p.completed.length}</div>
                          <div className="text-xs text-neutral-600 mt-0.5">Done</div>
                        </div>
                      </div>
                      {p.upcoming.length > 0 && (
                        <div className="mt-3 text-xs text-neutral-500">
                          Next: {formatDate(p.upcoming[0].wedding_date)} · {p.upcoming[0].person1_first_name} & {p.upcoming[0].person2_first_name}
                        </div>
                      )}
                    </button>

                    {expandedPerson === p.name && (
                      <div className="border-t border-neutral-800">
                        {/* Upcoming */}
                        {p.upcoming.length > 0 && (
                          <div>
                            <p className="text-xs text-neutral-600 px-4 py-2 uppercase tracking-wider border-b border-neutral-800/50">Upcoming ({p.upcoming.length})</p>
                            {p.upcoming.map(c => (
                              <button key={c.id} onClick={() => router.push(`/admin/client/${c.id}`)}
                                className="w-full text-left px-4 py-3 border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/50 transition-all">
                                <p className="text-xs font-medium text-white">{c.person1_first_name} & {c.person2_first_name}</p>
                                <p className="text-xs text-neutral-500">{formatDate(c.wedding_date)} · {c.venue || 'Venue TBD'}</p>
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Completed */}
                        {p.completed.length > 0 && (
                          <div>
                            <p className="text-xs text-neutral-600 px-4 py-2 uppercase tracking-wider border-b border-neutral-800/50">Completed ({p.completed.length})</p>
                            <div className="max-h-48 overflow-y-auto">
                              {p.completed.slice().reverse().map(c => (
                                <button key={c.id} onClick={() => router.push(`/admin/client/${c.id}`)}
                                  className="w-full text-left px-4 py-3 border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/50 transition-all">
                                  <p className="text-xs font-medium text-neutral-400">{c.person1_first_name} & {c.person2_first_name}</p>
                                  <p className="text-xs text-neutral-600">{formatDate(c.wedding_date)} · {c.venue || 'Venue TBD'}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Unassigned */}
              {(() => {
                const unassigned = clients.filter(c => !c.assigned_to)
                if (unassigned.length === 0) return null
                return (
                  <div className="bg-neutral-900 border border-yellow-500/20 rounded-2xl overflow-hidden">
                    <p className="text-xs text-yellow-400/70 px-4 py-3 border-b border-neutral-800 uppercase tracking-wider font-bold">⚠ Unassigned ({unassigned.length})</p>
                    {unassigned.map(c => (
                      <button key={c.id} onClick={() => router.push(`/admin/client/${c.id}`)}
                        className="w-full text-left px-4 py-3 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-all">
                        <p className="text-xs font-medium text-white">{c.person1_first_name} & {c.person2_first_name}</p>
                        <p className="text-xs text-neutral-500">{formatDate(c.wedding_date)} · {c.venue || 'Venue TBD'}</p>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── CLIENTS TAB ────────────────────────────────────────────────── */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or venue..."
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                />
                <div className="flex gap-2 flex-wrap">
                  {[
                    { val: 'all', label: `All (${allClients.length})` },
                    { val: 'upcoming', label: `Upcoming (${upcoming.length})` },
                    { val: 'past', label: `Completed (${completed.length})` },
                    { val: 'cancelled', label: `Cancelled (${cancelledClients.length})` },
                  ].map(f => (
                    <button key={f.val} onClick={() => setClientFilter(f.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${clientFilter === f.val ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)}
                    className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-neutral-300 text-xs focus:outline-none appearance-none">
                    <option value="all">All DJs</option>
                    {TEAM.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={packageFilter} onChange={e => setPackageFilter(e.target.value)}
                    className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-neutral-300 text-xs focus:outline-none appearance-none">
                    <option value="all">All Packages</option>
                    {packages.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-xs text-neutral-500">{browsedClients.length} result{browsedClients.length !== 1 ? 's' : ''}</p>

              <div className="space-y-2">
                {browsedClients.map(client => {
                  const days = daysUntil(client.wedding_date)
                  const isCancelled = !client.is_active
                  return (
                    <button key={client.id} onClick={() => router.push(`/admin/client/${client.id}`)}
                      className={`w-full text-left border rounded-2xl px-4 py-3.5 transition-all group ${isCancelled ? 'border-neutral-800/40 bg-neutral-900/40 hover:border-neutral-700' : 'border-neutral-800/60 bg-neutral-900/80 hover:border-tascosa-orange/40'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-sm flex items-center gap-1.5 flex-wrap ${isCancelled ? 'text-neutral-500' : 'text-white group-hover:text-tascosa-orange transition-colors'}`}>
                            {client.person1_first_name} {client.person1_last_name}
                            {client.person2_first_name ? ` & ${client.person2_first_name} ${client.person2_last_name}` : ''}
                            {isCancelled && <span className="text-xs bg-red-400/10 text-red-400/70 px-2 py-0.5 rounded-full font-bold">Cancelled</span>}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>{client.venue || 'Venue TBD'}</span>
                            {client.assigned_to && <span className="text-tascosa-orange/70">· {client.assigned_to}</span>}
                            {client.package && <span className="text-neutral-600">· {client.package === 'All-Inclusive Partner' ? 'All-Incl.' : client.package === 'Wedding Full Service' ? 'Full Svc' : client.package}</span>}
                          </div>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {(client.balance_due || 0) > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-tascosa-orange/10 text-tascosa-orange font-bold">${client.balance_due?.toFixed(0)} due</span>
                            )}
                            {(client.total_paid || 0) > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">${client.total_paid?.toFixed(0)} paid</span>
                            )}
                            {!client.planner_completed && !isCancelled && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">⏳ Planner</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-semibold text-white">{formatDate(client.wedding_date)}</div>
                          {days !== null && (
                            <div className={`text-xs font-bold mt-0.5 ${isCancelled ? 'text-neutral-600' : days < 0 ? 'text-neutral-500' : days === 0 ? 'text-red-400' : days <= 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                              {days < 0 ? 'Past' : days === 0 ? 'TODAY!' : `${days}d`}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
                {browsedClients.length === 0 && (
                  <div className="text-center py-12 text-neutral-600 text-sm">No clients match those filters.</div>
                )}
              </div>
            </div>
          )}

          {/* ── HOLDS TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'holds' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Total Holds" value={holds.length} color="text-yellow-400" />
                <Stat label="Future Holds" value={holds.filter(h => daysUntil(h.event_date) >= 0).length} color="text-white" />
              </div>
              {holds.length === 0 ? (
                <div className="text-center py-12 text-neutral-600 text-sm">No holds on file.</div>
              ) : (
                <div className="space-y-2">
                  {holds.slice().sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).map(h => {
                    const days = daysUntil(h.event_date)
                    return (
                      <div key={h.id} className={`border rounded-2xl px-4 py-3 ${days !== null && days < 0 ? 'border-neutral-800/40 bg-neutral-900/30' : 'border-yellow-500/30 bg-yellow-400/5'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">📌 Hold</span>
                              <p className={`font-bold text-sm ${days !== null && days < 0 ? 'text-neutral-500' : 'text-white'}`}>{h.client_name}</p>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {new Date(h.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              {h.notes ? ` · ${h.notes}` : ''}
                            </p>
                          </div>
                          <div className={`text-sm font-bold flex-shrink-0 ${days === null ? 'text-neutral-500' : days < 0 ? 'text-neutral-600' : days === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                            {days === null ? '—' : days < 0 ? 'Past' : days === 0 ? 'Today' : `${days}d`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── EVENTS TAB ────────────────────────────────────────────────── */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Total Events" value={events.length} color="text-cyan-400" />
                <Stat label="Upcoming" value={events.filter(e => (daysUntil(e.event_date) ?? -1) >= 0).length} color="text-white" />
                <Stat label="Total Revenue" value={fmt$(events.reduce((s, e) => s + (e.amount || 0), 0))} color="text-emerald-400" />
                <Stat label="Avg Amount" value={fmt$(events.length ? events.reduce((s, e) => s + (e.amount || 0), 0) / events.length : 0)} color="text-neutral-300" />
              </div>

              {/* By type */}
              {events.length > 0 && (() => {
                const typeCounts = {}
                events.forEach(e => { typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1 })
                return (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">By Type</p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                        <span key={type} className="text-xs bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-3 py-1.5 rounded-full font-bold">
                          {type} · {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {events.length === 0 ? (
                <div className="text-center py-12 text-neutral-600 text-sm">No events on file. Add one from the dashboard.</div>
              ) : (
                <div className="space-y-2">
                  {events.slice().sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).map(e => {
                    const days = daysUntil(e.event_date)
                    const formattedTime = e.event_time
                      ? new Date(`${e.event_date}T${e.event_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                      : null
                    return (
                      <div key={e.id} className={`border rounded-2xl px-4 py-3 ${days !== null && days < 0 ? 'border-neutral-800/40 bg-neutral-900/30' : 'border-cyan-500/30 bg-cyan-400/5'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs bg-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">🎵 {e.event_type}</span>
                              <p className={`font-bold text-sm ${days !== null && days < 0 ? 'text-neutral-500' : 'text-white'}`}>{e.event_name}</p>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {new Date(e.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              {formattedTime ? ` @ ${formattedTime}` : ''}
                              {e.venue ? ` · ${e.venue}` : ''}
                              {e.contact_name ? ` · ${e.contact_name}` : ''}
                            </p>
                            {e.notes && <p className="text-xs text-neutral-600 mt-0.5 truncate">{e.notes}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {e.amount > 0 && <p className="text-sm font-black text-emerald-400">${e.amount.toFixed(0)}</p>}
                            <p className={`text-xs font-bold mt-0.5 ${days === null ? 'text-neutral-500' : days < 0 ? 'text-neutral-600' : days === 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                              {days === null ? '—' : days < 0 ? 'Past' : days === 0 ? 'Today' : `${days}d`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="h-6" />
        </main>
      </div>
    </>
  )
}

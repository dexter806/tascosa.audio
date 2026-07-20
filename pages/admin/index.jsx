// FILE LOCATION: pages/admin/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Portal Dashboard — Tascosa Audio
// Updated: Month filter, revenue summary, per-person counters, completed events
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
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(dateStr)
  event.setHours(0, 0, 0, 0)
  return Math.round((event - today) / (1000 * 60 * 60 * 24))
}

export default function AdminDashboard() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedPerson, setSelectedPerson] = useState('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState('idle')
  const [expandedPerson, setExpandedPerson] = useState(null)

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

  async function sendInvite(e) {
    e.preventDefault()
    setInviteStatus('sending')
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    })
    if (res.ok) {
      setInviteStatus('sent')
      setInviteEmail('')
      setTimeout(() => setInviteStatus('idle'), 4000)
    } else {
      setInviteStatus('error')
      setTimeout(() => setInviteStatus('idle'), 4000)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/portal/login')
  }

  // ── COMPUTED STATS ──────────────────────────────────────────────────────────
  const today = new Date()
  const upcoming = clients.filter(c => daysUntil(c.wedding_date) > 0)
  const completed = clients.filter(c => daysUntil(c.wedding_date) !== null && daysUntil(c.wedding_date) <= 0)
  const totalBalanceDue = clients.reduce((sum, c) => sum + (c.balance_due || 0), 0)
  const totalCollected = clients.reduce((sum, c) => sum + (c.total_paid || 0), 0)

  // Per-person stats
  const personStats = TEAM.map(person => ({
    name: person,
    total: clients.filter(c => c.assigned_to === person).length,
    upcoming: clients.filter(c => c.assigned_to === person && daysUntil(c.wedding_date) > 0).length,
    events: clients.filter(c => c.assigned_to === person),
  }))

  // Available years from client data
  const years = [...new Set(clients.map(c => c.wedding_date ? new Date(c.wedding_date).getFullYear() : null).filter(Boolean))].sort()
  if (!years.includes(today.getFullYear())) years.push(today.getFullYear())

  // Monthly revenue for selected year
  const monthlyData = MONTHS.map((month, idx) => {
    const monthClients = clients.filter(c => {
      if (!c.wedding_date) return false
      const d = new Date(c.wedding_date)
      return d.getFullYear() === selectedYear && d.getMonth() === idx
    })
    return {
      month,
      count: monthClients.length,
      collected: monthClients.reduce((sum, c) => sum + (c.total_paid || 0), 0),
      due: monthClients.reduce((sum, c) => sum + (c.balance_due || 0), 0),
      clients: monthClients,
    }
  })

  // ── FILTERED CLIENT LIST ────────────────────────────────────────────────────
  const filtered = clients.filter(c => {
    const name = `${c.person1_first_name} ${c.person1_last_name} ${c.person2_first_name} ${c.person2_last_name} ${c.venue}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())
    const days = daysUntil(c.wedding_date)

    // Month filter
    let matchMonth = true
    if (selectedMonth !== 'all' && c.wedding_date) {
      const d = new Date(c.wedding_date)
      matchMonth = d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === selectedYear
    }

    // Person filter
    const matchPerson = selectedPerson === 'all' || c.assigned_to === selectedPerson

    // Status filter
    let matchFilter = true
    if (filter === 'upcoming') matchFilter = days > 0
    else if (filter === 'planner_pending') matchFilter = !c.planner_completed
    else if (filter === 'completed') matchFilter = days !== null && days <= 0
    else if (filter === 'unassigned') matchFilter = !c.assigned_to

    return matchSearch && matchMonth && matchPerson && matchFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading admin dashboard...</div>
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
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/TA Logo.png" alt="Tascosa Audio" className="h-8 w-auto object-contain" />
              <span className="font-bold text-sm tracking-wide">Admin Portal</span>
              <span className="text-xs bg-tascosa-orange/20 text-tascosa-orange px-2 py-0.5 rounded-full font-bold">ANDY</span>
            </div>
            <button onClick={handleSignOut} className="text-xs text-neutral-500 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-xl px-3 py-2 transition-all">
              Sign Out
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">

          {/* ── TOP STATS ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Clients', value: clients.length, color: 'text-white' },
              { label: 'Upcoming', value: upcoming.length, color: 'text-tascosa-orange' },
              { label: 'Completed', value: completed.length, color: 'text-neutral-400' },
              { label: 'Total Collected', value: `$${totalCollected.toFixed(2)}`, color: 'text-emerald-400' },
              { label: 'Balance Due', value: `$${totalBalanceDue.toFixed(2)}`, color: 'text-yellow-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── TEAM COUNTERS ──────────────────────────────────────────────── */}
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-500 mb-3">Team Events</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {personStats.map(person => (
                <div key={person.name} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedPerson(expandedPerson === person.name ? null : person.name)}
                    className="w-full p-5 text-left hover:bg-neutral-800/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{person.name}</span>
                      <span className="text-xs text-neutral-500">{expandedPerson === person.name ? '▲' : '▼'}</span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <div className="text-2xl font-black text-tascosa-orange">{person.total}</div>
                        <div className="text-xs text-neutral-500">Total</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-emerald-400">{person.upcoming}</div>
                        <div className="text-xs text-neutral-500">Upcoming</div>
                      </div>
                    </div>
                  </button>
                  {/* Expandable event list */}
                  {expandedPerson === person.name && (
                    <div className="border-t border-neutral-800 bg-neutral-950/50">
                      {person.events.length === 0 ? (
                        <p className="text-xs text-neutral-600 p-4 text-center">No events assigned</p>
                      ) : (
                        person.events.map(c => (
                          <button
                            key={c.id}
                            onClick={() => router.push(`/admin/client/${c.id}`)}
                            className="w-full text-left px-4 py-3 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-all"
                          >
                            <p className="text-sm font-medium text-white">{c.person1_first_name} & {c.person2_first_name}</p>
                            <p className="text-xs text-neutral-500">{formatDate(c.wedding_date)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── MONTHLY REVENUE ────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-500">Monthly Summary</h2>
              <div className="flex gap-2">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedYear === y ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyData.map((m, idx) => (
                <button
                  key={m.month}
                  onClick={() => setSelectedMonth(selectedMonth === String(idx) ? 'all' : String(idx))}
                  className={`rounded-xl p-3 text-center transition-all border ${
                    selectedMonth === String(idx)
                      ? 'border-tascosa-orange bg-tascosa-orange/10'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <p className="text-xs font-bold text-neutral-400">{m.month}</p>
                  <p className={`text-lg font-black mt-1 ${m.count > 0 ? 'text-white' : 'text-neutral-700'}`}>{m.count}</p>
                  {m.collected > 0 && <p className="text-xs text-emerald-400 font-bold">${m.collected}</p>}
                  {m.due > 0 && <p className="text-xs text-yellow-400 font-bold">${m.due} due</p>}
                </button>
              ))}
            </div>
            {selectedMonth !== 'all' && (
              <p className="text-xs text-neutral-500 mt-2">
                Showing {MONTHS[parseInt(selectedMonth)]} {selectedYear} — {filtered.length} event{filtered.length !== 1 ? 's' : ''}
                <button onClick={() => setSelectedMonth('all')} className="ml-2 text-tascosa-orange hover:underline">Clear</button>
              </p>
            )}
          </div>

          {/* ── INVITE + SEARCH ────────────────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Invite New Client
              </h2>
              <form onSubmit={sendInvite} className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  placeholder="client@email.com"
                  className="flex-1 rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
                />
                <button
                  type="submit"
                  disabled={inviteStatus === 'sending' || inviteStatus === 'sent'}
                  className="rounded-xl px-5 py-3 bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {inviteStatus === 'sending' ? '...' : inviteStatus === 'sent' ? '✓ Sent!' : 'Send Invite'}
                </button>
              </form>
              {inviteStatus === 'error' && <p className="text-red-400 text-xs mt-2">Failed to send. Try again.</p>}
              {inviteStatus === 'sent' && <p className="text-emerald-400 text-xs mt-2">✓ Invite sent!</p>}
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                Search & Filter
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or venue..."
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
                />
                <div className="flex gap-2 flex-wrap">
                  {[
                    { val: 'all', label: 'All' },
                    { val: 'upcoming', label: 'Upcoming' },
                    { val: 'planner_pending', label: 'Planner Pending' },
                    { val: 'completed', label: 'Past Events' },
                    { val: 'unassigned', label: 'Unassigned' },
                  ].map(f => (
                    <button
                      key={f.val}
                      onClick={() => setFilter(f.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        filter === f.val ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {/* Person filter */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedPerson('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedPerson === 'all' ? 'bg-neutral-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    All Staff
                  </button>
                  {TEAM.map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedPerson(selectedPerson === p ? 'all' : p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedPerson === p ? 'bg-neutral-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── CLIENT LIST ────────────────────────────────────────────────── */}
          <div>
            <h2 className="font-bold text-lg mb-4">
              Clients <span className="text-neutral-500 font-normal text-sm">({filtered.length})</span>
            </h2>
            {filtered.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
                No clients found.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(client => {
                  const days = daysUntil(client.wedding_date)
                  const sameRole = client.person1_role === client.person2_role
                  const label1 = sameRole ? `${client.person1_first_name} (${client.person1_role})` : client.person1_role
                  const label2 = sameRole ? `${client.person2_first_name} (${client.person2_role})` : client.person2_role

                  return (
                    <div
                      key={client.id}
                      onClick={() => router.push(`/admin/client/${client.id}`)}
                      className="bg-neutral-900 border border-neutral-800 hover:border-tascosa-orange/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white group-hover:text-tascosa-orange transition-colors">
                            {client.person1_first_name} {client.person1_last_name} & {client.person2_first_name} {client.person2_last_name}
                          </div>
                          <div className="text-sm text-neutral-400 mt-0.5 truncate">
                            {label1} & {label2} · {client.venue || 'Venue TBD'}
                          </div>
                          {client.assigned_to && (
                            <div className="text-xs text-neutral-500 mt-1">
                              Assigned to <span className="text-tascosa-orange font-semibold">{client.assigned_to}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center flex-shrink-0">
                          <div className="text-sm font-semibold text-white">{formatDate(client.wedding_date)}</div>
                          {days !== null && (
                            <div className={`text-xs font-bold mt-0.5 ${
                              days < 0 ? 'text-neutral-500' :
                              days <= 14 ? 'text-red-400' :
                              days <= 30 ? 'text-yellow-400' :
                              'text-emerald-400'
                            }`}>
                              {days < 0 ? 'Past event' : days === 0 ? 'TODAY!' : `${days} days away`}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0 flex-wrap">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            client.planner_completed ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'
                          }`}>
                            {client.planner_completed ? '✓ Planner Done' : '⏳ Planner Pending'}
                          </span>
                          {(client.balance_due || 0) > 0 && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-tascosa-orange/10 text-tascosa-orange">
                              ${client.balance_due?.toFixed(2)} due
                            </span>
                          )}
                        </div>
                        <div className="text-neutral-600 group-hover:text-tascosa-orange transition-colors flex-shrink-0">→</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </>
  )
}

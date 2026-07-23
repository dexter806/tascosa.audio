// FILE LOCATION: pages/admin/quotes.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Quotes Dashboard — Tascosa Audio Admin
// Shows all sent quotes with status: Sent, Signed, or Booked
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
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function getStatus(quote) {
  if (quote.signed_by && quote.signed_at) return 'signed'
  return 'sent'
}

function getStatusBadge(status) {
  switch (status) {
    case 'signed': return { label: '✓ Signed', color: 'bg-emerald-400/10 text-emerald-400' }
    default: return { label: '⏳ Awaiting Signature', color: 'bg-yellow-400/10 text-yellow-400' }
  }
}

export default function QuotesDashboard() {
  const router = useRouter()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_USER_ID) {
        router.push('/portal/login')
        return
      }
      await loadQuotes()
    })
  }, [])

  async function loadQuotes() {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) { console.error(error); return }
    setQuotes(data || [])
    setLoading(false)
  }

  async function deleteQuote(id) {
    if (!confirm('Delete this quote? This cannot be undone.')) return
    await supabase.from('quotes').delete().eq('id', id)
    setQuotes(prev => prev.filter(q => q.id !== id))
  }

  const filtered = quotes.filter(q => {
    const status = getStatus(q)
    const matchFilter =
      filter === 'all' ||
      (filter === 'sent' && status === 'sent') ||
      (filter === 'signed' && status === 'signed')

    const matchSearch = search === '' ||
      q.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.client_email?.toLowerCase().includes(search.toLowerCase()) ||
      q.venue?.toLowerCase().includes(search.toLowerCase())

    return matchFilter && matchSearch
  })

  const sentCount = quotes.filter(q => getStatus(q) === 'sent').length
  const signedCount = quotes.filter(q => getStatus(q) === 'signed').length

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-neutral-400 text-sm animate-pulse">Loading quotes...</div>
    </div>
  )

  return (
    <>
      <Head>
        <title>Quotes — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="text-neutral-400 hover:text-white transition-colors text-sm">
                ← Admin
              </button>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-sm">Quotes</span>
            </div>
            <button
              onClick={() => router.push('/admin/quote')}
              className="text-xs bg-tascosa-orange text-black font-black px-3 py-2 rounded-xl hover:brightness-110 transition-all"
            >
              + New Quote
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Quotes', value: quotes.length, color: 'text-white' },
              { label: 'Awaiting Signature', value: sentCount, color: 'text-yellow-400' },
              { label: 'Signed', value: signedCount, color: 'text-emerald-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-neutral-600 mt-1 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter & Search */}
          <div className="flex gap-3 flex-wrap items-center">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or venue..."
              className="flex-1 min-w-48 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
            />
            <div className="flex gap-2">
              {[
                { val: 'all', label: 'All' },
                { val: 'sent', label: '⏳ Awaiting' },
                { val: 'signed', label: '✓ Signed' },
              ].map(f => (
                <button
                  key={f.val}
                  onClick={() => setFilter(f.val)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.val ? 'bg-tascosa-orange text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quotes list */}
          {filtered.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
              {quotes.length === 0 ? 'No quotes sent yet. Create your first quote!' : 'No quotes match your filter.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(quote => {
                const status = getStatus(quote)
                const badge = getStatusBadge(status)
                const isExpanded = expandedId === quote.id
                const daysSinceSent = Math.floor((Date.now() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24))
                const needsFollowUp = status === 'sent' && daysSinceSent >= 2

                return (
                  <div key={quote.id} className={`bg-neutral-900 border rounded-2xl overflow-hidden transition-all ${needsFollowUp ? 'border-yellow-400/30' : 'border-neutral-800'}`}>
                    {/* Main row */}
                    <div
                      className="px-5 py-4 cursor-pointer hover:bg-neutral-800/30 transition-all"
                      onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-white">{quote.client_name || 'Unknown'}</p>
                            {needsFollowUp && (
                              <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                                Follow Up
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-400 mt-0.5">
                            {quote.client_email}
                            {quote.venue && <span className="ml-2">· {quote.venue}</span>}
                            {quote.event_date && <span className="ml-2">· {formatDate(quote.event_date)}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                          <div className="text-right">
                            <p className="font-black text-white">${(quote.signed_grand_total || quote.total || 0).toFixed(0)}</p>
                            <p className="text-xs text-neutral-500">{timeAgo(quote.created_at)}</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-neutral-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-neutral-800 px-5 py-4 bg-neutral-950/30 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Package</p>
                            <p className="text-white font-medium">{quote.package_name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Quote Total</p>
                            <p className="text-white font-medium">${(quote.total || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Deposit</p>
                            <p className="text-tascosa-orange font-bold">${(quote.deposit || 200).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Sent</p>
                            <p className="text-white font-medium">{formatDate(quote.created_at)}</p>
                          </div>
                        </div>

                        {/* Signature info */}
                        {quote.signed_by && (
                          <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-3">
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Signed By</p>
                            <p className="text-emerald-400 font-semibold italic" style={{ fontFamily: 'Georgia, serif' }}>{quote.signed_by}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">{formatDate(quote.signed_at)} · Grand Total: ${(quote.signed_grand_total || 0).toFixed(2)}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 flex-wrap pt-1">
                          <a
                            href={`/pay?quote=${quote.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-2 rounded-xl border border-neutral-700 text-neutral-300 hover:border-tascosa-orange hover:text-tascosa-orange transition-all"
                          >
                            👁 View Quote Page
                          </a>
                          <button
                            onClick={() => router.push('/admin/quote')}
                            className="text-xs px-3 py-2 rounded-xl border border-neutral-700 text-neutral-300 hover:border-tascosa-orange hover:text-tascosa-orange transition-all"
                          >
                            📋 Send New Quote
                          </button>
                          <button
                            onClick={() => deleteQuote(quote.id)}
                            className="text-xs px-3 py-2 rounded-xl border border-red-900 text-red-400 hover:bg-red-400/10 transition-all ml-auto"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </main>
      </div>
    </>
  )
}

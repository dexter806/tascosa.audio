// FILE LOCATION: pages/admin/quotes.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Quotes Dashboard — Tascosa Audio Admin
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
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
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
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_USER_ID) {
        router.push('/portal/login')
        return
      }
      loadQuotes()
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
    const res = await fetch('/api/delete-quote', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setQuotes(prev => prev.filter(q => q.id !== id))
    } else {
      alert('Failed to delete quote. Please try again.')
    }
  }

  const sentCount = quotes.filter(q => getStatus(q) === 'sent').length
  const signedCount = quotes.filter(q => getStatus(q) === 'signed').length

  const filtered = quotes.filter(q => {
    const status = getStatus(q)
    if (filter === 'sent') return status === 'sent'
    if (filter === 'signed') return status === 'signed'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading quotes...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Quotes — Tascosa Audio Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin')}
                className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-1"
              >
                ← All Clients
              </button>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-sm">Quotes</span>
            </div>
            <button
              onClick={() => router.push('/admin/quote')}
              className="text-xs bg-tascosa-orange text-black font-black px-4 py-2 rounded-xl hover:brightness-110 active:scale-95 transition-all"
            >
              + New Quote
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Quotes', value: quotes.length, color: 'text-white' },
              { label: 'Awaiting Signature', value: sentCount, color: 'text-yellow-400' },
              { label: 'Signed', value: signedCount, color: 'text-emerald-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-neutral-600 mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-0">
            {[
              { key: 'all', label: 'All' },
              { key: 'sent', label: 'Awaiting Signature' },
              { key: 'signed', label: 'Signed' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  filter === tab.key
                    ? 'border-tascosa-orange text-tascosa-orange'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quote list */}
          {filtered.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
              No quotes found.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(quote => {
                const status = getStatus(quote)
                const badge = getStatusBadge(status)
                const isExpanded = expandedId === quote.id
                const daysSinceSent = daysSince(quote.created_at)
                const needsFollowUp = status === 'sent' && daysSinceSent >= 2

                return (
                  <div
                    key={quote.id}
                    className={`bg-neutral-900 border rounded-2xl overflow-hidden transition-all ${
                      needsFollowUp ? 'border-orange-500/40' : 'border-neutral-800'
                    }`}
                  >
                    {/* Header row */}
                    <div
                      className="px-5 py-4 cursor-pointer flex items-center justify-between gap-4"
                      onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                          {needsFollowUp && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-tascosa-orange/10 text-tascosa-orange">
                              Follow Up
                            </span>
                          )}
                          {quote.deposit_sent_at && (
                            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-400/10 text-blue-400">
                              Deposit Claimed
                            </span>
                          )}
                          <span className="text-neutral-600 text-sm">▼</span>
                        </div>
                        <p className="font-bold text-white mt-1">{quote.client_name}</p>
                        <p className="text-sm text-neutral-400 truncate">
                          {quote.client_email} · {quote.venue} · {formatDate(quote.event_date)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-tascosa-orange text-lg">${(quote.total || 0).toFixed(2)}</p>
                        <p className="text-xs text-neutral-500">{daysSinceSent === 0 ? 'Today' : `${daysSinceSent}d ago`}</p>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-neutral-800 px-5 py-4 space-y-4">

                        {/* Quote breakdown */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div className="flex justify-between py-1.5 border-b border-neutral-800">
                            <span className="text-neutral-400">Package</span>
                            <span className="text-white font-medium">{quote.package_name || '—'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-neutral-800">
                            <span className="text-neutral-400">Event Date</span>
                            <span className="text-white font-medium">{formatDate(quote.event_date)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-neutral-800">
                            <span className="text-neutral-400">Base Price</span>
                            <span className="text-white font-medium">${(quote.base_price || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-neutral-800">
                            <span className="text-neutral-400">Deposit</span>
                            <span className="text-white font-medium">${(quote.deposit || 200).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-neutral-800">
                            <span className="text-neutral-400">Total</span>
                            <span className="text-tascosa-orange font-black">${(quote.total || 0).toFixed(2)}</span>
                          </div>
                          {quote.signed_grand_total > 0 && (
                            <div className="flex justify-between py-1.5 border-b border-neutral-800">
                              <span className="text-neutral-400">Signed Total</span>
                              <span className="text-emerald-400 font-black">${(quote.signed_grand_total || 0).toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        {/* Deposit claimed info */}
                        {quote.deposit_sent_at && (
                          <div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-3">
                            <p className="text-xs text-blue-400 font-bold">Deposit Claimed</p>
                            <p className="text-xs text-neutral-400 mt-0.5">Client indicated they sent their deposit on {formatDate(quote.deposit_sent_at)}</p>
                          </div>
                        )}

                        {/* Signature */}
                        {quote.signed_by && (
                          <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-3">
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
                            View Quote Page
                          </a>
                          <button
                            onClick={() => router.push('/admin/quote')}
                            className="text-xs px-3 py-2 rounded-xl border border-neutral-700 text-neutral-300 hover:border-tascosa-orange hover:text-tascosa-orange transition-all"
                          >
                            Send New Quote
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

// FILE LOCATION: pages/portal/wedding-planner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Wedding Planning Tools — optional resource for Tascosa Audio clients
// Completely separate from the music planner (/portal/planner)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Default checklist ────────────────────────────────────────────────────────
const DEFAULT_CHECKLIST = [
  // 12+ months out
  { id: uid(), category: '12+ Months Out', text: 'Set your wedding date', checked: false },
  { id: uid(), category: '12+ Months Out', text: 'Establish your overall budget', checked: false },
  { id: uid(), category: '12+ Months Out', text: 'Create your guest list (rough count)', checked: false },
  { id: uid(), category: '12+ Months Out', text: 'Book your venue', checked: false },
  { id: uid(), category: '12+ Months Out', text: 'Book your photographer', checked: false },
  { id: uid(), category: '12+ Months Out', text: 'Book your videographer', checked: false },
  { id: uid(), category: '12+ Months Out', text: 'Book your DJ / entertainment', checked: false },
  { id: uid(), category: '12+ Months Out', text: 'Book your officiant', checked: false },
  { id: uid(), category: '12+ Months Out', text: 'Start looking at wedding dresses', checked: false },
  // 9–12 months
  { id: uid(), category: '9–12 Months Out', text: 'Send save-the-dates', checked: false },
  { id: uid(), category: '9–12 Months Out', text: 'Book your caterer', checked: false },
  { id: uid(), category: '9–12 Months Out', text: 'Book your florist', checked: false },
  { id: uid(), category: '9–12 Months Out', text: 'Book hair & makeup artist', checked: false },
  { id: uid(), category: '9–12 Months Out', text: 'Start honeymoon planning', checked: false },
  { id: uid(), category: '9–12 Months Out', text: 'Register for gifts', checked: false },
  // 6–9 months
  { id: uid(), category: '6–9 Months Out', text: 'Order wedding dress', checked: false },
  { id: uid(), category: '6–9 Months Out', text: 'Book rehearsal dinner venue', checked: false },
  { id: uid(), category: '6–9 Months Out', text: 'Choose wedding party attire', checked: false },
  { id: uid(), category: '6–9 Months Out', text: 'Order wedding cake / desserts', checked: false },
  { id: uid(), category: '6–9 Months Out', text: 'Book hotel room block for guests', checked: false },
  // 4–6 months
  { id: uid(), category: '4–6 Months Out', text: 'Send formal invitations', checked: false },
  { id: uid(), category: '4–6 Months Out', text: 'Create wedding website', checked: false },
  { id: uid(), category: '4–6 Months Out', text: 'Schedule dress fittings', checked: false },
  { id: uid(), category: '4–6 Months Out', text: 'Plan ceremony details with officiant', checked: false },
  { id: uid(), category: '4–6 Months Out', text: 'Book transportation (limo, shuttle, etc.)', checked: false },
  // 2–4 months
  { id: uid(), category: '2–4 Months Out', text: 'Finalize guest list & RSVPs', checked: false },
  { id: uid(), category: '2–4 Months Out', text: 'Finalize catering menu & headcount', checked: false },
  { id: uid(), category: '2–4 Months Out', text: 'Create seating chart', checked: false },
  { id: uid(), category: '2–4 Months Out', text: 'Purchase wedding rings', checked: false },
  { id: uid(), category: '2–4 Months Out', text: 'Get marriage license', checked: false },
  { id: uid(), category: '2–4 Months Out', text: 'Write your vows', checked: false },
  // 1 month
  { id: uid(), category: '1 Month Out', text: 'Final dress fitting', checked: false },
  { id: uid(), category: '1 Month Out', text: 'Confirm all vendors', checked: false },
  { id: uid(), category: '1 Month Out', text: 'Send final headcount to caterer', checked: false },
  { id: uid(), category: '1 Month Out', text: 'Prepare vendor payments / tips', checked: false },
  { id: uid(), category: '1 Month Out', text: 'Create wedding day emergency kit', checked: false },
  // Week of
  { id: uid(), category: 'Week Of', text: 'Attend rehearsal & rehearsal dinner', checked: false },
  { id: uid(), category: 'Week Of', text: 'Deliver items to venue', checked: false },
  { id: uid(), category: 'Week Of', text: 'Pick up wedding dress', checked: false },
  { id: uid(), category: 'Week Of', text: 'Confirm transportation details', checked: false },
  { id: uid(), category: 'Week Of', text: 'Get a good night\'s sleep — you\'ve got this! 🎉', checked: false },
]

const VENDOR_CATEGORIES = [
  'Venue', 'Caterer', 'Photographer', 'Videographer', 'Florist',
  'Hair & Makeup', 'Wedding Cake', 'Transportation', 'Officiant',
  'Wedding Planner/Coordinator', 'Lighting', 'Photo Booth',
  'Invitation Designer', 'Other'
]

const RSVP_OPTIONS = ['Pending', 'Yes', 'No']

const TABS = [
  { id: 'checklist', label: '✓ Checklist', short: 'Checklist' },
  { id: 'vendors', label: '📋 Vendors', short: 'Vendors' },
  { id: 'guests', label: '👥 Guests', short: 'Guests' },
  { id: 'budget', label: '💰 Budget', short: 'Budget' },
  { id: 'timeline', label: '🕐 Day-of', short: 'Day-of' },
  { id: 'notes', label: '📝 Notes', short: 'Notes' },
]

export default function WeddingPlanner() {
  const router = useRouter()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [activeTab, setActiveTab] = useState('checklist')
  const [plannerId, setPlannerId] = useState(null)

  // Data state
  const [checklist, setChecklist] = useState([])
  const [vendors, setVendors] = useState([])
  const [guests, setGuests] = useState([])
  const [budget, setBudget] = useState({ total: 0, items: [] })
  const [timeline, setTimeline] = useState([])
  const [notes, setNotes] = useState('')

  // UI state
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [newChecklistCategory, setNewChecklistCategory] = useState('Custom')
  const [vendorForm, setVendorForm] = useState(null) // null = closed, {} = new, {id} = editing
  const [guestForm, setGuestForm] = useState(null)
  const [budgetItemForm, setBudgetItemForm] = useState(null)
  const [timelineForm, setTimelineForm] = useState(null)
  const [guestSearch, setGuestSearch] = useState('')

  // Export state
  const [showExport, setShowExport] = useState(false)
  const [exportAction, setExportAction] = useState('both') // 'download' | 'email' | 'both'
  const [exporting, setExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState(null) // null | 'success' | 'error'
  const [exportMessage, setExportMessage] = useState('')

  const saveTimerRef = useRef(null)

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }

      let clientData = null
      const { data: d1 } = await supabase.from('clients').select('*').eq('user_id', session.user.id).single()
      if (d1) clientData = d1
      else {
        const { data: d2 } = await supabase.from('clients').select('*').eq('user_id_2', session.user.id).single()
        clientData = d2
      }

      if (!clientData) { router.push('/portal/login'); return }
      setClient(clientData)

      // Load or create planner row
      const { data: existing } = await supabase
        .from('wedding_planner_data')
        .select('*')
        .eq('client_id', clientData.id)
        .single()

      if (existing) {
        setPlannerId(existing.id)
        setChecklist(existing.checklist?.length ? existing.checklist : DEFAULT_CHECKLIST)
        setVendors(existing.vendors || [])
        setGuests(existing.guests || [])
        setBudget(existing.budget || { total: 0, items: [] })
        setTimeline(existing.timeline || [])
        setNotes(existing.notes || '')
      } else {
        // Create fresh row
        const { data: created } = await supabase
          .from('wedding_planner_data')
          .insert({ client_id: clientData.id, checklist: DEFAULT_CHECKLIST })
          .select()
          .single()
        if (created) {
          setPlannerId(created.id)
          setChecklist(DEFAULT_CHECKLIST)
        }
      }

      setLoading(false)
    })
  }, [])

  // ── Auto-save (debounced 1.5s) ───────────────────────────────────────────
  const save = useCallback(async (data) => {
    if (!plannerId) return
    setSaving(true)
    await supabase
      .from('wedding_planner_data')
      .update(data)
      .eq('id', plannerId)
    setSaving(false)
    setSavedAt(new Date())
  }, [plannerId])

  function scheduleChecklistSave(val) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save({ checklist: val }), 1500)
  }
  function scheduleVendorSave(val) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save({ vendors: val }), 1500)
  }
  function scheduleGuestSave(val) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save({ guests: val }), 1500)
  }
  function scheduleBudgetSave(val) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save({ budget: val }), 1500)
  }
  function scheduleTimelineSave(val) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save({ timeline: val }), 1500)
  }
  function scheduleNotesSave(val) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save({ notes: val }), 1500)
  }

  // ── Export / PDF ─────────────────────────────────────────────────────────
  async function handleExport() {
    if (!client) return
    setExporting(true)
    setExportStatus(null)
    setExportMessage('')

    try {
      const res = await fetch('/api/send-wedding-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, action: exportAction }),
      })

      if (exportAction === 'download' || exportAction === 'both') {
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${client.person1_first_name || ''}_${client.person2_first_name || ''}_Wedding_Planner.pdf`.replace(/\s+/g, '_').replace(/^_|_$/g, '') || 'Wedding_Planner.pdf'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setExportStatus('success')
          setExportMessage(exportAction === 'both' ? 'PDF downloaded & emailed!' : 'PDF downloaded!')
        } else {
          const err = await res.json().catch(() => ({}))
          console.error('Export error:', res.status, err)
          setExportStatus('error')
          setExportMessage(err.error || `Error ${res.status}. Please try again.`)
        }
      } else {
        // email only
        const data = await res.json()
        if (res.ok && data.success) {
          setExportStatus('success')
          setExportMessage(`Sent to ${(data.sentTo || []).join(' & ')}`)
        } else {
          console.error('Export email error:', res.status, data)
          setExportStatus('error')
          setExportMessage(data.error || `Error ${res.status}. Please try again.`)
        }
      }
    } catch (err) {
      console.error('Export fetch error:', err)
      setExportStatus('error')
      setExportMessage(err.message || 'Something went wrong. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // ── Checklist helpers ────────────────────────────────────────────────────
  function toggleCheck(id) {
    const updated = checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    setChecklist(updated)
    scheduleChecklistSave(updated)
  }
  function addChecklistItem() {
    if (!newChecklistItem.trim()) return
    const updated = [...checklist, { id: uid(), category: newChecklistCategory, text: newChecklistItem.trim(), checked: false }]
    setChecklist(updated)
    setNewChecklistItem('')
    scheduleChecklistSave(updated)
  }
  function deleteChecklistItem(id) {
    const updated = checklist.filter(i => i.id !== id)
    setChecklist(updated)
    scheduleChecklistSave(updated)
  }

  // ── Vendor helpers ───────────────────────────────────────────────────────
  function saveVendor(form) {
    let updated
    if (form.id && vendors.find(v => v.id === form.id)) {
      updated = vendors.map(v => v.id === form.id ? form : v)
    } else {
      updated = [...vendors, { ...form, id: uid() }]
    }
    setVendors(updated)
    setVendorForm(null)
    scheduleVendorSave(updated)
  }
  function deleteVendor(id) {
    const updated = vendors.filter(v => v.id !== id)
    setVendors(updated)
    scheduleVendorSave(updated)
  }

  // ── Guest helpers ────────────────────────────────────────────────────────
  function saveGuest(form) {
    let updated
    if (form.id && guests.find(g => g.id === form.id)) {
      updated = guests.map(g => g.id === form.id ? form : g)
    } else {
      updated = [...guests, { ...form, id: uid() }]
    }
    setGuests(updated)
    setGuestForm(null)
    scheduleGuestSave(updated)
  }
  function deleteGuest(id) {
    const updated = guests.filter(g => g.id !== id)
    setGuests(updated)
    scheduleGuestSave(updated)
  }
  function toggleRsvp(id) {
    const g = guests.find(g => g.id === id)
    if (!g) return
    const next = { 'Pending': 'Yes', 'Yes': 'No', 'No': 'Pending' }[g.rsvp || 'Pending']
    const updated = guests.map(g => g.id === id ? { ...g, rsvp: next } : g)
    setGuests(updated)
    scheduleGuestSave(updated)
  }

  // ── Budget helpers ───────────────────────────────────────────────────────
  function saveBudgetItem(form) {
    let newItems
    if (form.id && budget.items.find(i => i.id === form.id)) {
      newItems = budget.items.map(i => i.id === form.id ? form : i)
    } else {
      newItems = [...budget.items, { ...form, id: uid() }]
    }
    const updated = { ...budget, items: newItems }
    setBudget(updated)
    setBudgetItemForm(null)
    scheduleBudgetSave(updated)
  }
  function deleteBudgetItem(id) {
    const updated = { ...budget, items: budget.items.filter(i => i.id !== id) }
    setBudget(updated)
    scheduleBudgetSave(updated)
  }
  function updateBudgetTotal(val) {
    const updated = { ...budget, total: parseFloat(val) || 0 }
    setBudget(updated)
    scheduleBudgetSave(updated)
  }

  // ── Timeline helpers ─────────────────────────────────────────────────────
  function saveTimelineItem(form) {
    let updated
    if (form.id && timeline.find(t => t.id === form.id)) {
      updated = timeline.map(t => t.id === form.id ? form : t)
    } else {
      updated = [...timeline, { ...form, id: uid() }]
    }
    updated.sort((a, b) => a.time.localeCompare(b.time))
    setTimeline(updated)
    setTimelineForm(null)
    scheduleTimelineSave(updated)
  }
  function deleteTimelineItem(id) {
    const updated = timeline.filter(t => t.id !== id)
    setTimeline(updated)
    scheduleTimelineSave(updated)
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-neutral-400 text-sm animate-pulse">Loading your planner...</div>
    </div>
  )

  // ── Stats for header ─────────────────────────────────────────────────────
  const checklistDone = checklist.filter(i => i.checked).length
  const checklistTotal = checklist.length
  const checklistPct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0
  const guestsYes = guests.filter(g => g.rsvp === 'Yes').length
  const totalEstimated = budget.items.reduce((s, i) => s + (parseFloat(i.estimated) || 0), 0)
  const totalActual = budget.items.reduce((s, i) => s + (parseFloat(i.actual) || 0), 0)

  const checklistCategories = [...new Set(checklist.map(i => i.category))]
  const filteredGuests = guests.filter(g =>
    !guestSearch || g.name?.toLowerCase().includes(guestSearch.toLowerCase())
  )

  return (
    <>
      <Head>
        <title>Wedding Planning Tools — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => router.push('/portal/dashboard')} className="text-neutral-400 hover:text-white transition-colors text-sm flex-shrink-0">
                ← Dashboard
              </button>
              <div className="w-px h-5 bg-neutral-700 flex-shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-bold truncate">💍 Wedding Planning Tools</span>
                <span className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full flex-shrink-0">Your Personal Tool</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-neutral-600">
                {saving ? <span className="animate-pulse">Saving...</span> : savedAt ? <span>Saved ✓</span> : null}
              </span>
              <button
                onClick={() => { setShowExport(true); setExportStatus(null); setExportMessage('') }}
                className="text-xs rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1.5 font-bold hover:bg-pink-500/30 transition-all flex items-center gap-1.5"
              >
                📄 Export PDF
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">

          {/* Quick stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-white">{checklistPct}%</div>
              <div className="text-xs text-neutral-500 mt-0.5">{checklistDone}/{checklistTotal} Done</div>
              <div className="mt-2 h-1.5 rounded-full bg-neutral-800">
                <div className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${checklistPct}%` }} />
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-white">{vendors.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{vendors.filter(v => v.booked).length} Booked</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-white">{guests.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{guestsYes} Confirmed</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-white">
                {budget.total > 0 ? `$${(budget.total / 1000).toFixed(0)}k` : '—'}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {totalEstimated > 0 ? `$${(totalEstimated / 1000).toFixed(1)}k est.` : 'Budget'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── CHECKLIST TAB ──────────────────────────────────────────────── */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-neutral-500">{checklistDone} of {checklistTotal} items complete</p>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${checklistPct === 100 ? 'bg-emerald-400/20 text-emerald-400' : checklistPct > 50 ? 'bg-yellow-400/20 text-yellow-400' : 'bg-neutral-800 text-neutral-500'}`}>
                  {checklistPct === 100 ? '🎉 All Done!' : `${checklistPct}% complete`}
                </span>
              </div>

              {checklistCategories.map(category => {
                const items = checklist.filter(i => i.category === category)
                const catDone = items.filter(i => i.checked).length
                return (
                  <div key={category} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{category}</span>
                      <span className="text-xs text-neutral-600">{catDone}/{items.length}</span>
                    </div>
                    <div className="divide-y divide-neutral-800/50">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 group">
                          <button
                            onClick={() => toggleCheck(item.id)}
                            className={`flex-shrink-0 h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${item.checked ? 'bg-emerald-400 border-emerald-400' : 'border-neutral-600 hover:border-emerald-400'}`}
                          >
                            {item.checked && <span className="text-black text-xs font-black">✓</span>}
                          </button>
                          <span className={`flex-1 text-sm transition-colors ${item.checked ? 'line-through text-neutral-600' : 'text-neutral-200'}`}>
                            {item.text}
                          </span>
                          <button
                            onClick={() => deleteChecklistItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-red-400 transition-all text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Add custom item */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider">Add Custom Item</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={e => setNewChecklistItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                    placeholder="Add a task..."
                    className="flex-1 rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <input
                    type="text"
                    value={newChecklistCategory}
                    onChange={e => setNewChecklistCategory(e.target.value)}
                    placeholder="Category"
                    className="sm:w-36 rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 px-4 py-2.5 text-sm font-bold hover:bg-pink-500/30 transition-all"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── VENDORS TAB ───────────────────────────────────────────────── */}
          {activeTab === 'vendors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} · {vendors.filter(v => v.booked).length} booked</p>
                <button
                  onClick={() => setVendorForm({ name: '', category: 'Venue', phone: '', email: '', website: '', notes: '', booked: false })}
                  className="text-xs rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 px-4 py-2 font-bold hover:bg-pink-500/30 transition-all"
                >
                  + Add Vendor
                </button>
              </div>

              {vendors.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-600 text-sm">
                  No vendors yet. Add your first one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {VENDOR_CATEGORIES.filter(cat => vendors.some(v => v.category === cat)).map(cat => (
                    <div key={cat}>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 px-1">{cat}</p>
                      {vendors.filter(v => v.category === cat).map(vendor => (
                        <div key={vendor.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3.5 mb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-sm">{vendor.name || 'Unnamed Vendor'}</span>
                                {vendor.booked && <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Booked</span>}
                              </div>
                              <div className="text-xs text-neutral-500 mt-1 space-y-0.5">
                                {vendor.phone && <div>📞 {vendor.phone}</div>}
                                {vendor.email && <div>✉️ {vendor.email}</div>}
                                {vendor.website && <div>🌐 <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">{vendor.website}</a></div>}
                                {vendor.notes && <div className="text-neutral-600 mt-1">{vendor.notes}</div>}
                              </div>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => setVendorForm({ ...vendor })} className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-all">Edit</button>
                              <button onClick={() => deleteVendor(vendor.id)} className="text-xs px-2.5 py-1.5 rounded-lg border border-red-900/50 text-red-500/70 hover:text-red-400 hover:border-red-700 transition-all">✕</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* Vendors with no recognized category */}
                  {vendors.filter(v => !VENDOR_CATEGORIES.includes(v.category)).map(vendor => (
                    <div key={vendor.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{vendor.name}</span>
                            <span className="text-xs text-neutral-600">{vendor.category}</span>
                            {vendor.booked && <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ Booked</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => setVendorForm({ ...vendor })} className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white transition-all">Edit</button>
                          <button onClick={() => deleteVendor(vendor.id)} className="text-xs px-2.5 py-1.5 rounded-lg border border-red-900/50 text-red-500/70 hover:text-red-400 transition-all">✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vendor form modal */}
              {vendorForm && (
                <VendorModal
                  form={vendorForm}
                  onChange={setVendorForm}
                  onSave={() => saveVendor(vendorForm)}
                  onClose={() => setVendorForm(null)}
                />
              )}
            </div>
          )}

          {/* ── GUESTS TAB ────────────────────────────────────────────────── */}
          {activeTab === 'guests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2 text-xs flex-wrap">
                  <span className="bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-full font-bold">{guests.length} Total</span>
                  <span className="bg-emerald-400/10 text-emerald-400 px-3 py-1.5 rounded-full font-bold">{guests.filter(g => g.rsvp === 'Yes').length} Yes</span>
                  <span className="bg-red-400/10 text-red-400 px-3 py-1.5 rounded-full font-bold">{guests.filter(g => g.rsvp === 'No').length} No</span>
                  <span className="bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-full font-bold">{guests.filter(g => !g.rsvp || g.rsvp === 'Pending').length} Pending</span>
                </div>
                <button
                  onClick={() => setGuestForm({ name: '', rsvp: 'Pending', plusOne: false, notes: '' })}
                  className="text-xs rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 px-4 py-2 font-bold hover:bg-pink-500/30 transition-all"
                >
                  + Add Guest
                </button>
              </div>

              <input
                type="text"
                value={guestSearch}
                onChange={e => setGuestSearch(e.target.value)}
                placeholder="Search guests..."
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />

              {guests.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-600 text-sm">
                  No guests yet. Add your first one!
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] text-xs text-neutral-600 uppercase tracking-wider px-4 py-2.5 border-b border-neutral-800 gap-3">
                    <span>Name</span>
                    <span>+1</span>
                    <span>RSVP</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-neutral-800/50">
                    {filteredGuests.map(guest => (
                      <div key={guest.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-3 gap-3 hover:bg-neutral-800/30 transition-colors">
                        <div>
                          <p className="text-sm text-white font-medium">{guest.name}</p>
                          {guest.notes && <p className="text-xs text-neutral-600 mt-0.5">{guest.notes}</p>}
                        </div>
                        <span className={`text-xs ${guest.plusOne ? 'text-emerald-400' : 'text-neutral-700'}`}>{guest.plusOne ? '✓' : '—'}</span>
                        <button
                          onClick={() => toggleRsvp(guest.id)}
                          className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                            guest.rsvp === 'Yes' ? 'bg-emerald-400/20 text-emerald-400' :
                            guest.rsvp === 'No' ? 'bg-red-400/20 text-red-400' :
                            'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {guest.rsvp || 'Pending'}
                        </button>
                        <div className="flex gap-1">
                          <button onClick={() => setGuestForm({ ...guest })} className="text-xs text-neutral-600 hover:text-white transition-colors">✏</button>
                          <button onClick={() => deleteGuest(guest.id)} className="text-xs text-neutral-700 hover:text-red-400 transition-colors ml-1">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {guestForm && (
                <GuestModal
                  form={guestForm}
                  onChange={setGuestForm}
                  onSave={() => saveGuest(guestForm)}
                  onClose={() => setGuestForm(null)}
                />
              )}
            </div>
          )}

          {/* ── BUDGET TAB ────────────────────────────────────────────────── */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              {/* Total budget */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Overall Budget</p>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500 text-lg font-bold">$</span>
                  <input
                    type="number"
                    value={budget.total || ''}
                    onChange={e => updateBudgetTotal(e.target.value)}
                    placeholder="0"
                    className="flex-1 text-3xl font-black bg-transparent text-white focus:outline-none"
                  />
                </div>
                {budget.total > 0 && totalEstimated > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                      <span>Estimated spend: ${totalEstimated.toFixed(0)}</span>
                      <span className={totalEstimated > budget.total ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {totalEstimated > budget.total ? `$${(totalEstimated - budget.total).toFixed(0)} over` : `$${(budget.total - totalEstimated).toFixed(0)} remaining`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-800">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${totalEstimated > budget.total ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min((totalEstimated / budget.total) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Line items */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Line Items (Optional)</p>
                <button
                  onClick={() => setBudgetItemForm({ label: '', estimated: '', actual: '', paid: false })}
                  className="text-xs rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 px-4 py-2 font-bold hover:bg-pink-500/30 transition-all"
                >
                  + Add Item
                </button>
              </div>

              {budget.items.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-xs text-neutral-600 uppercase tracking-wider px-4 py-2.5 border-b border-neutral-800 gap-3">
                    <span>Item</span>
                    <span>Estimated</span>
                    <span>Actual</span>
                    <span>Paid</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-neutral-800/50">
                    {budget.items.map(item => (
                      <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-3 gap-3">
                        <span className="text-sm text-white">{item.label}</span>
                        <span className="text-sm text-neutral-400">${parseFloat(item.estimated || 0).toFixed(0)}</span>
                        <span className="text-sm text-neutral-400">{item.actual ? `$${parseFloat(item.actual).toFixed(0)}` : '—'}</span>
                        <span className={`text-xs font-bold ${item.paid ? 'text-emerald-400' : 'text-neutral-600'}`}>{item.paid ? '✓' : '—'}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setBudgetItemForm({ ...item })} className="text-xs text-neutral-600 hover:text-white transition-colors">✏</button>
                          <button onClick={() => deleteBudgetItem(item.id)} className="text-xs text-neutral-700 hover:text-red-400 transition-colors ml-1">✕</button>
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-3 gap-3 bg-neutral-800/30">
                      <span className="text-xs font-bold text-neutral-400 uppercase">Total</span>
                      <span className="text-sm font-bold text-white">${totalEstimated.toFixed(0)}</span>
                      <span className="text-sm font-bold text-white">{totalActual > 0 ? `$${totalActual.toFixed(0)}` : '—'}</span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              {budgetItemForm && (
                <BudgetItemModal
                  form={budgetItemForm}
                  onChange={setBudgetItemForm}
                  onSave={() => saveBudgetItem(budgetItemForm)}
                  onClose={() => setBudgetItemForm(null)}
                />
              )}
            </div>
          )}

          {/* ── DAY-OF TIMELINE TAB ───────────────────────────────────────── */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">{timeline.length} event{timeline.length !== 1 ? 's' : ''} scheduled</p>
                <button
                  onClick={() => setTimelineForm({ time: '', label: '', notes: '' })}
                  className="text-xs rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 px-4 py-2 font-bold hover:bg-pink-500/30 transition-all"
                >
                  + Add Event
                </button>
              </div>

              {timeline.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-600 text-sm">
                  Build your day-of schedule here — ceremony start, cocktail hour, first dance, cake cutting, etc.
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[72px] top-0 bottom-0 w-px bg-neutral-800" />
                  <div className="space-y-2">
                    {timeline.map(item => {
                      const formattedTime = item.time
                        ? new Date(`2000-01-01T${item.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                        : item.time
                      return (
                        <div key={item.id} className="flex items-start gap-4 group">
                          <div className="flex-shrink-0 w-16 text-right">
                            <span className="text-xs font-bold text-neutral-400">{formattedTime}</span>
                          </div>
                          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-pink-500/60 ring-2 ring-neutral-950 mt-0.5 z-10" />
                          <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-white">{item.label}</p>
                                {item.notes && <p className="text-xs text-neutral-500 mt-0.5">{item.notes}</p>}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                <button onClick={() => setTimelineForm({ ...item })} className="text-xs text-neutral-600 hover:text-white transition-colors">✏</button>
                                <button onClick={() => deleteTimelineItem(item.id)} className="text-xs text-neutral-700 hover:text-red-400 transition-colors ml-1">✕</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {timelineForm && (
                <TimelineModal
                  form={timelineForm}
                  onChange={setTimelineForm}
                  onSave={() => saveTimelineItem(timelineForm)}
                  onClose={() => setTimelineForm(null)}
                />
              )}
            </div>
          )}

          {/* ── NOTES TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">Use this space for anything — ideas, reminders, to-do lists, vendor notes. It's all yours.</p>
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); scheduleNotesSave(e.target.value) }}
                placeholder="Start typing..."
                rows={16}
                className="w-full rounded-2xl bg-neutral-900 border border-neutral-800 px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 resize-none leading-relaxed"
              />
            </div>
          )}

          <div className="h-6" />
        </main>
      </div>

      {/* ── Export Modal ──────────────────────────────────────────────────── */}
      {showExport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-bold text-base mb-1 flex items-center gap-2">
              <span className="h-4 w-1 bg-pink-400 rounded-full"></span>
              Export Your Planner
            </h3>
            <p className="text-xs text-neutral-500 mb-5">We'll generate a PDF of everything in your planner.</p>

            <div className="space-y-2 mb-5">
              {[
                { value: 'download', label: '⬇️  Download PDF', desc: 'Save it directly to your device' },
                { value: 'email',    label: '✉️  Email to me',   desc: 'Send to the email(s) on your account' },
                { value: 'both',     label: '✨  Download & Email', desc: 'Do both at once' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setExportAction(opt.value)}
                  className={`w-full text-left rounded-xl px-4 py-3 border transition-all ${
                    exportAction === opt.value
                      ? 'border-pink-500/50 bg-pink-500/10'
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="text-sm font-bold text-white">{opt.label}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {exportStatus && (
              <div className={`text-sm font-medium flex items-center gap-2 mb-4 ${exportStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                <span className={`h-2 w-2 rounded-full flex-none ${exportStatus === 'error' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                {exportMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowExport(false); setExportStatus(null) }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-sm font-bold transition-all"
              >
                {exportStatus === 'success' ? 'Done' : 'Cancel'}
              </button>
              {exportStatus !== 'success' && (
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex-1 py-2.5 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold text-sm hover:bg-pink-500/30 transition-all disabled:opacity-50"
                >
                  {exporting ? 'Working...' : 'Export →'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  )
}

// ── Modals ───────────────────────────────────────────────────────────────────

function ModalWrapper({ title, onSave, onClose, saveLabel = 'Save', children }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className="h-4 w-1 bg-pink-400 rounded-full"></span>
          {title}
        </h3>
        <div className="space-y-3">{children}</div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white text-sm font-bold transition-all">Cancel</button>
          <button onClick={onSave} className="flex-1 py-2.5 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold text-sm hover:bg-pink-500/30 transition-all">{saveLabel}</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40"

function VendorModal({ form, onChange, onSave, onClose }) {
  return (
    <ModalWrapper title={form.id ? 'Edit Vendor' : 'Add Vendor'} onSave={onSave} onClose={onClose}>
      <Field label="Vendor Name">
        <input type="text" value={form.name || ''} onChange={e => onChange(p => ({ ...p, name: e.target.value }))} placeholder="Iron Rose Events" className={inputCls} />
      </Field>
      <Field label="Category">
        <select value={form.category || 'Venue'} onChange={e => onChange(p => ({ ...p, category: e.target.value }))} className={inputCls + ' appearance-none'}>
          {VENDOR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input type="tel" value={form.phone || ''} onChange={e => onChange(p => ({ ...p, phone: e.target.value }))} placeholder="806-555-0000" className={inputCls} />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email || ''} onChange={e => onChange(p => ({ ...p, email: e.target.value }))} placeholder="hello@vendor.com" className={inputCls} />
        </Field>
      </div>
      <Field label="Website">
        <input type="url" value={form.website || ''} onChange={e => onChange(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className={inputCls} />
      </Field>
      <Field label="Notes">
        <textarea value={form.notes || ''} onChange={e => onChange(p => ({ ...p, notes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} placeholder="Contract signed, deposit paid, etc." />
      </Field>
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => onChange(p => ({ ...p, booked: !p.booked }))}
          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${form.booked ? 'bg-emerald-400 border-emerald-400' : 'border-neutral-600'}`}
        >
          {form.booked && <span className="text-black text-xs font-black">✓</span>}
        </div>
        <span className="text-sm text-neutral-300">Booked / Confirmed</span>
      </label>
    </ModalWrapper>
  )
}

function GuestModal({ form, onChange, onSave, onClose }) {
  return (
    <ModalWrapper title={form.id ? 'Edit Guest' : 'Add Guest'} onSave={onSave} onClose={onClose}>
      <Field label="Name">
        <input type="text" value={form.name || ''} onChange={e => onChange(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" className={inputCls} />
      </Field>
      <Field label="RSVP">
        <div className="flex gap-2">
          {RSVP_OPTIONS.map(opt => (
            <button key={opt} onClick={() => onChange(p => ({ ...p, rsvp: opt }))}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.rsvp === opt
                ? opt === 'Yes' ? 'bg-emerald-400/20 text-emerald-400 border-emerald-400/40'
                  : opt === 'No' ? 'bg-red-400/20 text-red-400 border-red-400/40'
                  : 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40'
                : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
              {opt}
            </button>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => onChange(p => ({ ...p, plusOne: !p.plusOne }))}
          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${form.plusOne ? 'bg-pink-400 border-pink-400' : 'border-neutral-600'}`}
        >
          {form.plusOne && <span className="text-black text-xs font-black">✓</span>}
        </div>
        <span className="text-sm text-neutral-300">Has a +1</span>
      </label>
      <Field label="Notes">
        <input type="text" value={form.notes || ''} onChange={e => onChange(p => ({ ...p, notes: e.target.value }))} placeholder="Dietary restrictions, table #, etc." className={inputCls} />
      </Field>
    </ModalWrapper>
  )
}

function BudgetItemModal({ form, onChange, onSave, onClose }) {
  return (
    <ModalWrapper title={form.id ? 'Edit Item' : 'Add Budget Item'} onSave={onSave} onClose={onClose}>
      <Field label="Description">
        <input type="text" value={form.label || ''} onChange={e => onChange(p => ({ ...p, label: e.target.value }))} placeholder="Florist" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimated ($)">
          <input type="number" value={form.estimated || ''} onChange={e => onChange(p => ({ ...p, estimated: e.target.value }))} placeholder="1500" className={inputCls} />
        </Field>
        <Field label="Actual ($)">
          <input type="number" value={form.actual || ''} onChange={e => onChange(p => ({ ...p, actual: e.target.value }))} placeholder="1420" className={inputCls} />
        </Field>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => onChange(p => ({ ...p, paid: !p.paid }))}
          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${form.paid ? 'bg-emerald-400 border-emerald-400' : 'border-neutral-600'}`}
        >
          {form.paid && <span className="text-black text-xs font-black">✓</span>}
        </div>
        <span className="text-sm text-neutral-300">Paid</span>
      </label>
    </ModalWrapper>
  )
}

function TimelineModal({ form, onChange, onSave, onClose }) {
  return (
    <ModalWrapper title={form.id ? 'Edit Event' : 'Add Timeline Event'} onSave={onSave} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Time">
          <input type="time" value={form.time || ''} onChange={e => onChange(p => ({ ...p, time: e.target.value }))} className={inputCls + ' [color-scheme:dark]'} />
        </Field>
        <Field label="Event">
          <input type="text" value={form.label || ''} onChange={e => onChange(p => ({ ...p, label: e.target.value }))} placeholder="Ceremony Begins" className={inputCls} />
        </Field>
      </div>
      <Field label="Notes">
        <input type="text" value={form.notes || ''} onChange={e => onChange(p => ({ ...p, notes: e.target.value }))} placeholder="Location, who's involved, etc." className={inputCls} />
      </Field>
    </ModalWrapper>
  )
}

// FILE LOCATION: pages/admin/client/[id].jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Client Detail Page
// Shows full client info, wedding planner responses, and lets Andy
// update package, balance, notes, and total contract
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
const PACKAGES = ['Private Party', 'Wedding Reception', 'Wedding Full Service', 'All-Inclusive Partner']
const TEAM = ['Andy', 'Austin', 'Joe', 'Danny']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${m} ${period}`
}

const SectionCard = ({ title, children }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
    <h3 className="font-bold mb-4 flex items-center gap-2">
      <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
      {title}
    </h3>
    {children}
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 py-2.5 border-b border-neutral-800 last:border-0">
    <span className="text-sm text-neutral-400 flex-shrink-0">{label}</span>
    <span className="text-sm text-white font-medium text-right">{value || '—'}</span>
  </div>
)

const SongRow = ({ label, title, artist }) => {
  if (!title && !artist) return (
    <div className="flex justify-between items-center py-2.5 border-b border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className="text-xs text-neutral-600 italic">Not provided</span>
    </div>
  )
  return (
    <div className="py-2.5 border-b border-neutral-800 last:border-0">
      <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">{label}</span>
      <div className="mt-1 text-sm text-white">{title || '—'} {artist ? <span className="text-neutral-400">· {artist}</span> : ''}</div>
    </div>
  )
}

export default function AdminClientDetail() {
  const router = useRouter()
  const { id } = router.query
  const [client, setClient] = useState(null)
  const [planner, setPlanner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [sendStatus, setSendStatus] = useState('idle') // idle | sending | sent | error
  const [activeTab, setActiveTab] = useState('overview')
  const [plannerForm, setPlannerForm] = useState(null)
  const [plannerSaveStatus, setPlannerSaveStatus] = useState('idle')

  const [adminForm, setAdminForm] = useState({
    package: '',
    total_contract: '',
    total_paid: '',
    balance_due: '',
    assigned_to: '',
    notes: '',
  })

  useEffect(() => {
    if (!id) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_USER_ID) {
        router.push('/portal/login')
        return
      }

      // Load client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (!clientData) { router.push('/admin'); return }
      setClient(clientData)
      setAdminForm({
        package: clientData.package || '',
        total_contract: clientData.total_contract || '',
        total_paid: clientData.total_paid || '',
        balance_due: clientData.balance_due || '',
        assigned_to: clientData.assigned_to || '',
        notes: clientData.notes || '',
      })

      // Load planner
      const { data: plannerData } = await supabase
        .from('wedding_planner')
        .select('*')
        .eq('client_id', id)
        .single()

      setPlanner(plannerData)
      // Initialize planner edit form with existing data or empty
      setPlannerForm({
        ceremony_start_time: plannerData?.ceremony_start_time || '',
        reception_end_time: plannerData?.reception_end_time || '',
        event_notes: plannerData?.event_notes || '',
        song_parent_procession_title: plannerData?.song_parent_procession_title || '',
        song_groom_procession_title: plannerData?.song_groom_procession_title || '',
        song_groomsmen_title: plannerData?.song_groomsmen_title || '',
        song_bridesmaids_title: plannerData?.song_bridesmaids_title || '',
        song_bride_procession_title: plannerData?.song_bride_procession_title || '',
        song_interlude_title: plannerData?.song_interlude_title || '',
        song_recessional_title: plannerData?.song_recessional_title || '',
        ceremony_notes: plannerData?.ceremony_notes || '',
        intro_party_first: plannerData?.intro_party_first || false,
        intro_party_style: plannerData?.intro_party_style || '',
        intro_party_order: plannerData?.intro_party_order || '',
        intro_couple_style: plannerData?.intro_couple_style || '',
        intro_notes: plannerData?.intro_notes || '',
        song_party_entrance_title: plannerData?.song_party_entrance_title || '',
        song_couple_entrance_title: plannerData?.song_couple_entrance_title || '',
        song_first_dance_title: plannerData?.song_first_dance_title || '',
        song_person1_parent_dance_title: plannerData?.song_person1_parent_dance_title || '',
        song_person1_parent_relation: plannerData?.song_person1_parent_relation || 'Mom',
        song_person2_parent_dance_title: plannerData?.song_person2_parent_dance_title || '',
        song_person2_parent_relation: plannerData?.song_person2_parent_relation || 'Mom',
        song_cake_cutting_title: plannerData?.song_cake_cutting_title || '',
        song_bouquet_toss_title: plannerData?.song_bouquet_toss_title || '',
        song_garter_toss_title: plannerData?.song_garter_toss_title || '',
        song_last_dance_guests_title: plannerData?.song_last_dance_guests_title || '',
        song_last_dance_private_title: plannerData?.song_last_dance_private_title || '',
        reception_notes: plannerData?.reception_notes || '',
        music_requests: plannerData?.music_requests || '',
        music_do_not_play: plannerData?.music_do_not_play || '',
        music_playlist_links: plannerData?.music_playlist_links || '',
        music_notes: plannerData?.music_notes || '',
      })
      setLoading(false)
    })
  }, [id])

  async function saveAdminFields() {
    setSaveStatus('saving')
    const contract = parseFloat(adminForm.total_contract) || 0
    const paid = parseFloat(adminForm.total_paid) || 0
    const balance = Math.max(0, contract - paid)
    // Auto-calculate balance due
    setAdminForm(p => ({ ...p, balance_due: balance.toFixed(2) }))
    const { error } = await supabase
      .from('clients')
      .update({
        package: adminForm.package,
        total_contract: contract,
        total_paid: paid,
        balance_due: balance,
        assigned_to: adminForm.assigned_to,
        notes: adminForm.notes,
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  async function sendPlanner() {
    if (!adminForm.assigned_to) {
      alert('Please assign this event to a team member first.')
      return
    }
    setSendStatus('sending')
    const res = await fetch('/api/send-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, assignedTo: adminForm.assigned_to }),
    })
    const data = await res.json()
    if (res.ok) {
      setSendStatus('sent')
      setTimeout(() => setSendStatus('idle'), 5000)
    } else {
      alert(data.error || 'Failed to send planner.')
      setSendStatus('idle')
    }
  }

  async function savePlanner() {
    setPlannerSaveStatus('saving')
    
    if (planner) {
      // Update existing planner
      const { error } = await supabase
        .from('wedding_planner')
        .update(plannerForm)
        .eq('client_id', id)
      if (error) { console.error(error); setPlannerSaveStatus('error'); return }
    } else {
      // Insert new planner
      const { error } = await supabase
        .from('wedding_planner')
        .insert({ ...plannerForm, client_id: id })
      if (error) { console.error(error); setPlannerSaveStatus('error'); return }
    }

    // Mark planner as complete
    await supabase
      .from('clients')
      .update({ planner_completed: true })
      .eq('id', id)

    setPlannerSaveStatus('saved')
    setTimeout(() => setPlannerSaveStatus('idle'), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading client...</div>
      </div>
    )
  }

  const sameRole = client.person1_role === client.person2_role
  const label1 = sameRole ? `${client.person1_first_name} (${client.person1_role})` : client.person1_role
  const label2 = sameRole ? `${client.person2_first_name} (${client.person2_role})` : client.person2_role

  const TABS = ['overview', 'ceremony', 'reception', 'music', 'edit planner', 'client view']

  return (
    <>
      <Head>
        <title>{client.person1_first_name} & {client.person2_first_name} — Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                ← All Clients
              </button>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-sm">{client.person1_first_name} & {client.person2_first_name}</span>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && <span className="text-xs text-neutral-500 animate-pulse">Saving...</span>}
              {saveStatus === 'saved' && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveStatus === 'error' && <span className="text-xs text-red-400">Save failed</span>}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-extrabold">
                  {client.person1_first_name} {client.person1_last_name} & {client.person2_first_name} {client.person2_last_name}
                </h1>
                <p className="text-neutral-400 mt-1">{label1} & {label2} · {client.venue}</p>
                <p className="text-tascosa-orange font-semibold mt-1">{formatDate(client.wedding_date)}</p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                  client.planner_completed ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'
                }`}>
                  {client.planner_completed ? '✓ Planner Complete' : '⏳ Planner Pending'}
                </span>
                {client.package && (
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-tascosa-orange/10 text-tascosa-orange">
                    {client.package}
                  </span>
                )}
                {!client.user_id && (
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-neutral-800 text-neutral-400">
                    No Portal Account
                  </span>
                )}
                {client.user_id && (
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-emerald-400/10 text-emerald-400">
                    ✓ Portal Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-0">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-tascosa-orange text-tascosa-orange'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">

              {/* Contact info */}
              <SectionCard title="Contact Information">
                <InfoRow label={label1} value={`${client.person1_first_name} ${client.person1_last_name}`} />
                <InfoRow label={`${label1} Email`} value={client.person1_email} />
                <InfoRow label={`${label1} Phone`} value={client.person1_phone} />
                <div className="my-3 border-t border-neutral-800" />
                <InfoRow label={label2} value={`${client.person2_first_name} ${client.person2_last_name}`} />
                <InfoRow label={`${label2} Email`} value={client.person2_email} />
                <InfoRow label={`${label2} Phone`} value={client.person2_phone} />
              {/* Portal status */}
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Portal Status</p>
                  {client.user_id ? (
                    <p className="text-xs text-emerald-400">✓ {client.person1_first_name} has an active portal account</p>
                  ) : (
                    <p className="text-xs text-neutral-500">No portal account yet</p>
                  )}
                </div>
              </SectionCard>

              {/* Event info */}
              <SectionCard title="Event Details">
                <InfoRow label="Wedding Date" value={formatDate(client.wedding_date)} />
                <InfoRow label="Venue" value={client.venue} />
                <InfoRow label="Ceremony Start" value={formatTime(planner?.ceremony_start_time)} />
                <InfoRow label="Reception End" value={formatTime(planner?.reception_end_time)} />
                {planner?.event_notes && (
                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Event Notes</p>
                    <p className="text-sm text-neutral-300 leading-relaxed">{planner.event_notes}</p>
                  </div>
                )}

                {/* Assigned To + Send Planner */}
                <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 ml-1 uppercase tracking-wider">Assigned To</label>
                    <select
                      value={adminForm.assigned_to}
                      onChange={e => setAdminForm(p => ({ ...p, assigned_to: e.target.value }))}
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all appearance-none"
                    >
                      <option value="">Select team member...</option>
                      {TEAM.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={sendPlanner}
                    disabled={sendStatus === 'sending' || sendStatus === 'sent' || !client?.planner_completed}
                    className="w-full rounded-xl py-3 border border-neutral-700 hover:border-tascosa-orange text-neutral-300 hover:text-tascosa-orange font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sendStatus === 'sending' ? 'Sending...' :
                     sendStatus === 'sent' ? '✓ Planner Sent!' :
                     !client?.planner_completed ? '📋 Planner Not Yet Complete' :
                     '📋 Send Planner to Assigned DJ'}
                  </button>
                  {sendStatus === 'sent' && (
                    <p className="text-emerald-400 text-xs mt-1 text-center">Planner sent to {adminForm.assigned_to}</p>
                  )}
                  {!client?.planner_completed && (
                    <p className="text-neutral-600 text-xs mt-1 text-center">Client must complete their planner first</p>
                  )}
                </div>
              </SectionCard>

              {/* Admin fields — editable */}
              <SectionCard title="Package & Billing">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 ml-1 uppercase tracking-wider">Package</label>
                    <select
                      value={adminForm.package}
                      onChange={e => setAdminForm(p => ({ ...p, package: e.target.value }))}
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all appearance-none"
                    >
                      <option value="">Select package...</option>
                      {PACKAGES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Contract', key: 'total_contract' },
                      { label: 'Total Paid', key: 'total_paid' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs text-neutral-500 mb-1.5 ml-1 uppercase tracking-wider">{field.label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                          <input
                            type="number"
                            value={adminForm[field.key]}
                            onChange={e => setAdminForm(p => ({ ...p, [field.key]: e.target.value }))}
                            className="w-full rounded-xl bg-neutral-950 border border-neutral-700 pl-7 pr-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-neutral-950/60 rounded-xl border border-neutral-700 px-4 py-3 flex justify-between items-center">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Balance Due (auto-calculated)</span>
                    <span className="text-lg font-black text-tascosa-orange">
                      ${Math.max(0, (parseFloat(adminForm.total_contract) || 0) - (parseFloat(adminForm.total_paid) || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 ml-1 uppercase tracking-wider">Internal Notes</label>
                    <textarea
                      value={adminForm.notes}
                      onChange={e => setAdminForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      placeholder="Private notes about this client or event..."
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={saveAdminFields}
                    disabled={saveStatus === 'saving'}
                    className="w-full rounded-xl py-3 bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                  </button>


                </div>
              </SectionCard>

              {/* Intro notes */}
              {planner && (
                <SectionCard title="Introduction Details">
                  <InfoRow label="Party Introduced First?" value={planner.intro_party_first ? 'Yes' : 'No'} />
                  {planner.intro_party_first && (
                    <>
                      <InfoRow label="Introduction Style" value={planner.intro_party_style} />
                      {planner.intro_party_style === 'As Couples' && planner.intro_couples && (
                        <div className="mt-3 pt-3 border-t border-neutral-800">
                          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Couples Walk-in Order</p>
                          {planner.intro_couples.map((couple, i) => (
                            <p key={i} className="text-sm text-neutral-300 py-1">
                              {i + 1}. {couple.a} & {couple.b}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {planner.intro_couple_style && (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Couple Introduction</p>
                      <p className="text-sm text-neutral-300">{planner.intro_couple_style}</p>
                    </div>
                  )}
                  {planner.intro_notes && (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-neutral-300">{planner.intro_notes}</p>
                    </div>
                  )}
                </SectionCard>
              )}

            </div>
          )}

          {/* ── CEREMONY TAB ──────────────────────────────────────────────── */}
          {activeTab === 'ceremony' && (
            <div className="max-w-2xl">
              {!planner ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
                  Wedding planner not submitted yet.
                </div>
              ) : (
                <SectionCard title="Ceremony Songs">
                  <SongRow label="Parent / Grandparent Procession" title={planner.song_parent_procession_title} artist={planner.song_parent_procession_artist} />
                  <SongRow label="Groom Procession" title={planner.song_groom_procession_title} artist={planner.song_groom_procession_artist} />
                  <SongRow label="Wedding Party / Groomsmen" title={planner.song_groomsmen_title} artist={planner.song_groomsmen_artist} />
                  <SongRow label="Wedding Party / Bridesmaids" title={planner.song_bridesmaids_title} artist={planner.song_bridesmaids_artist} />
                  <SongRow label="Bride Procession" title={planner.song_bride_procession_title} artist={planner.song_bride_procession_artist} />
                  <SongRow label="Interlude" title={planner.song_interlude_title} artist={planner.song_interlude_artist} />
                  <SongRow label="Recessional" title={planner.song_recessional_title} artist={planner.song_recessional_artist} />
                  {planner.ceremony_notes && (
                    <div className="mt-4 pt-4 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Ceremony Notes</p>
                      <p className="text-sm text-neutral-300 leading-relaxed">{planner.ceremony_notes}</p>
                    </div>
                  )}
                </SectionCard>
              )}
            </div>
          )}

          {/* ── RECEPTION TAB ─────────────────────────────────────────────── */}
          {activeTab === 'reception' && (
            <div className="max-w-2xl">
              {!planner ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
                  Wedding planner not submitted yet.
                </div>
              ) : (
                <SectionCard title="Reception Songs">
                  <SongRow label="Wedding Party Entrance" title={planner.song_party_entrance_title} artist={planner.song_party_entrance_artist} />
                  <SongRow label={`${label1} & ${label2} Entrance`} title={planner.song_couple_entrance_title} artist={planner.song_couple_entrance_artist} />
                  <SongRow label="First Dance" title={planner.song_first_dance_title} artist={planner.song_first_dance_artist} />
                  <SongRow label={`${label1} & ${planner.song_person1_parent_relation || 'Parent'} Dance`} title={planner.song_person1_parent_dance_title} artist={planner.song_person1_parent_dance_artist} />
                  <SongRow label={`${label2} & ${planner.song_person2_parent_relation || 'Parent'} Dance`} title={planner.song_person2_parent_dance_title} artist={planner.song_person2_parent_dance_artist} />
                  <SongRow label="Cake Cutting" title={planner.song_cake_cutting_title} artist={planner.song_cake_cutting_artist} />
                  <SongRow label="Bouquet Toss" title={planner.song_bouquet_toss_title} artist={planner.song_bouquet_toss_artist} />
                  <SongRow label="Garter Toss" title={planner.song_garter_toss_title} artist={planner.song_garter_toss_artist} />
                  <SongRow label="Last Dance with Guests" title={planner.song_last_dance_guests_title} artist={planner.song_last_dance_guests_artist} />
                  <SongRow label="Last Dance — Private" title={planner.song_last_dance_private_title} artist={planner.song_last_dance_private_artist} />
                  {planner.reception_notes && (
                    <div className="mt-4 pt-4 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Reception Notes</p>
                      <p className="text-sm text-neutral-300 leading-relaxed">{planner.reception_notes}</p>
                    </div>
                  )}
                </SectionCard>
              )}
            </div>
          )}

          {/* ── MUSIC TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'music' && (
            <div className="max-w-2xl space-y-6">
              {!planner ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
                  Wedding planner not submitted yet.
                </div>
              ) : (
                <>
                  <SectionCard title="Music Requests">
                    {planner.music_requests ? (
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{planner.music_requests}</p>
                    ) : (
                      <p className="text-sm text-neutral-600 italic">None provided</p>
                    )}
                  </SectionCard>
                  <SectionCard title="Do Not Play">
                    {planner.music_do_not_play ? (
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{planner.music_do_not_play}</p>
                    ) : (
                      <p className="text-sm text-neutral-600 italic">None provided</p>
                    )}
                  </SectionCard>
                  {planner.music_playlist_links && (
                    <SectionCard title="Playlist Links">
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{planner.music_playlist_links}</p>
                    </SectionCard>
                  )}
                  {planner.music_notes && (
                    <SectionCard title="Music Notes">
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{planner.music_notes}</p>
                    </SectionCard>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── EDIT PLANNER TAB ──────────────────────────────────── */}
          {activeTab === 'edit planner' && plannerForm && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-tascosa-orange/5 border border-tascosa-orange/20 rounded-2xl p-4 text-sm text-neutral-400">
                ✏️ Fill out or update the wedding planner on behalf of this client. Saves directly to the database.
              </div>

              <SectionCard title="Event Timeline">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Ceremony Start</label>
                    <input type="time" value={plannerForm.ceremony_start_time} onChange={e => setPlannerForm(p => ({...p, ceremony_start_time: e.target.value}))} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Reception End</label>
                    <input type="time" value={plannerForm.reception_end_time} onChange={e => setPlannerForm(p => ({...p, reception_end_time: e.target.value}))} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange [color-scheme:dark]" />
                  </div>
                </div>
                <textarea value={plannerForm.event_notes} onChange={e => setPlannerForm(p => ({...p, event_notes: e.target.value}))} rows={3} placeholder="Event notes..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
              </SectionCard>

              <SectionCard title="Ceremony Songs">
                <div className="space-y-3">
                  {[
                    { label: 'Parent/Grandparent Procession', key: 'song_parent_procession_title' },
                    { label: 'Groom Procession', key: 'song_groom_procession_title' },
                    { label: 'Wedding Party / Groomsmen', key: 'song_groomsmen_title' },
                    { label: 'Wedding Party / Bridesmaids', key: 'song_bridesmaids_title' },
                    { label: 'Bride Procession', key: 'song_bride_procession_title' },
                    { label: 'Interlude', key: 'song_interlude_title' },
                    { label: 'Recessional', key: 'song_recessional_title' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">{field.label}</label>
                      <input value={plannerForm[field.key]} onChange={e => setPlannerForm(p => ({...p, [field.key]: e.target.value}))} placeholder="Song title — Artist" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Ceremony Notes</label>
                    <textarea value={plannerForm.ceremony_notes} onChange={e => setPlannerForm(p => ({...p, ceremony_notes: e.target.value}))} rows={2} placeholder="Notes..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Wedding Party Introductions">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Party Introduced First?</p>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} type="button"
                          onClick={() => setPlannerForm(p => ({...p, intro_party_first: opt === 'Yes'}))}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            (opt === 'Yes' && plannerForm.intro_party_first) || (opt === 'No' && !plannerForm.intro_party_first)
                              ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {plannerForm.intro_party_first && (
                    <>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Introduction Style</label>
                        <input value={plannerForm.intro_party_style} onChange={e => setPlannerForm(p => ({...p, intro_party_style: e.target.value}))} placeholder="As one group / As couples..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Party Walk-in Order</label>
                        <textarea value={plannerForm.intro_party_order} onChange={e => setPlannerForm(p => ({...p, intro_party_order: e.target.value}))} rows={4} placeholder="List couples in order..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Couple Introduction</label>
                    <textarea value={plannerForm.intro_couple_style} onChange={e => setPlannerForm(p => ({...p, intro_couple_style: e.target.value}))} rows={2} placeholder="How would you like to be introduced..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Intro Notes</label>
                    <textarea value={plannerForm.intro_notes} onChange={e => setPlannerForm(p => ({...p, intro_notes: e.target.value}))} rows={2} placeholder="Notes..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Reception Songs">
                <div className="space-y-3">
                  {[
                    { label: 'Wedding Party Entrance', key: 'song_party_entrance_title' },
                    { label: `${label1} & ${label2} Entrance`, key: 'song_couple_entrance_title' },
                    { label: 'First Dance', key: 'song_first_dance_title' },
                    { label: 'Cake Cutting', key: 'song_cake_cutting_title' },
                    { label: 'Bouquet Toss', key: 'song_bouquet_toss_title' },
                    { label: 'Garter Toss', key: 'song_garter_toss_title' },
                    { label: 'Last Dance with Guests', key: 'song_last_dance_guests_title' },
                    { label: 'Last Dance — Private', key: 'song_last_dance_private_title' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">{field.label}</label>
                      <input value={plannerForm[field.key]} onChange={e => setPlannerForm(p => ({...p, [field.key]: e.target.value}))} placeholder="Song title — Artist" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                  ))}
                  {[
                    { label: `${label1} & Parent Dance`, titleKey: 'song_person1_parent_dance_title', relationKey: 'song_person1_parent_relation' },
                    { label: `${label2} & Parent Dance`, titleKey: 'song_person2_parent_dance_title', relationKey: 'song_person2_parent_relation' },
                  ].map(field => (
                    <div key={field.titleKey} className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800">
                      <p className="text-xs text-neutral-400 font-semibold mb-2">{field.label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={plannerForm[field.relationKey]} onChange={e => setPlannerForm(p => ({...p, [field.relationKey]: e.target.value}))} className="rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none appearance-none">
                          {['Mom','Dad','Stepmom','Stepdad','Brother','Sister','Grandparent','Other'].map(r => <option key={r}>{r}</option>)}
                        </select>
                        <input value={plannerForm[field.titleKey]} onChange={e => setPlannerForm(p => ({...p, [field.titleKey]: e.target.value}))} placeholder="Song — Artist" className="rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Reception Notes</label>
                    <textarea value={plannerForm.reception_notes} onChange={e => setPlannerForm(p => ({...p, reception_notes: e.target.value}))} rows={2} placeholder="Notes..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Music Preferences">
                <div className="space-y-4">
                  {[
                    { label: 'Songs / Artists / Genres to PLAY', key: 'music_requests' },
                    { label: 'DO NOT PLAY', key: 'music_do_not_play' },
                    { label: 'Playlist Links', key: 'music_playlist_links' },
                    { label: 'Music Notes', key: 'music_notes' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">{field.label}</label>
                      <textarea value={plannerForm[field.key]} onChange={e => setPlannerForm(p => ({...p, [field.key]: e.target.value}))} rows={3} placeholder="..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="sticky bottom-4">
                <button
                  onClick={savePlanner}
                  disabled={plannerSaveStatus === 'saving'}
                  className="w-full rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-tascosa-orange/20"
                >
                  {plannerSaveStatus === 'saving' ? 'Saving...' :
                   plannerSaveStatus === 'saved' ? '✓ Planner Saved!' :
                   plannerSaveStatus === 'error' ? 'Save Failed — Try Again' :
                   'Save Wedding Planner'}
                </button>
              </div>

            </div>
          )}

          {/* ── CLIENT VIEW TAB ───────────────────────────────────────── */}
          {activeTab === 'client view' && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-tascosa-orange/5 border border-tascosa-orange/20 rounded-2xl p-4 text-sm text-neutral-400">
                👁 This is how the client sees their portal dashboard.
              </div>

              {/* Countdown */}
              {client.wedding_date && (() => {
                const eventDate = new Date(client.wedding_date + 'T12:00:00')
                const today = new Date()
                const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))
                return (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
                    {daysUntil > 0 ? (
                      <>
                        <p className="text-neutral-400 text-sm mb-1">Days Until Your Event</p>
                        <p className="text-6xl font-black text-tascosa-orange">{daysUntil}</p>
                        <p className="text-neutral-400 text-sm mt-1">{formatDate(client.wedding_date)}</p>
                      </>
                    ) : daysUntil === 0 ? (
                      <>
                        <p className="text-2xl font-black text-tascosa-orange">🎉 Today is the Day!</p>
                        <p className="text-neutral-400 text-sm mt-1">{formatDate(client.wedding_date)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-neutral-400 text-sm mb-1">Event Completed</p>
                        <p className="text-2xl font-black text-emerald-400">✓ {formatDate(client.wedding_date)}</p>
                      </>
                    )}
                  </div>
                )
              })()}

              {/* Event Details */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                  Event Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Venue</span>
                    <span className="text-white font-medium">{client.venue || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Ceremony Start</span>
                    <span className="text-white font-medium">{planner?.ceremony_start_time ? formatTime(planner.ceremony_start_time) : '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Reception End</span>
                    <span className="text-white font-medium">{planner?.reception_end_time ? formatTime(planner.reception_end_time) : '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-400">Package</span>
                    <span className="text-white font-medium">{client.package || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                  Balance Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Total Contract</span>
                    <span className="text-white font-medium">${(client.total_contract || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Total Paid</span>
                    <span className="text-emerald-400 font-medium">${(client.total_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-400">Balance Due</span>
                    <span className={`font-black text-lg ${client.balance_due > 0 ? 'text-tascosa-orange' : 'text-emerald-400'}`}>
                      ${(client.balance_due || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wedding Planner Status */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                  Wedding Planner
                </h3>
                {client.planner_completed ? (
                  <div className="flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4">
                    <span className="text-emerald-400 text-xl">✓</span>
                    <div>
                      <p className="text-emerald-400 font-bold">Planner Complete</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Your wedding planner has been submitted.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
                    <span className="text-yellow-400 text-xl">⏳</span>
                    <div>
                      <p className="text-yellow-400 font-bold">Planner Pending</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Complete your wedding planner so we can prepare for your big day!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Portal Status */}
              <div className={`rounded-2xl p-4 text-center text-sm ${client.user_id ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-400' : 'bg-neutral-900 border border-neutral-800 text-neutral-500'}`}>
                {client.user_id ? '✓ Client has an active portal account' : 'No portal account yet'}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  )
}                {/* Portal status */}
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Portal Status</p>
                  {client.user_id ? (
                    <p className="text-xs text-emerald-400">✓ {client.person1_first_name} has an active portal account</p>
                  ) : (
                    <p className="text-xs text-neutral-500">No portal account yet</p>
                  )}
                </div>
// Admin Client Detail Page
// Shows full client info, wedding planner responses, and lets Andy
// update package, balance, notes, and total contract
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
const PACKAGES = ['Private Party', 'Wedding Reception', 'Wedding Full Service', 'All-Inclusive Partner']
const TEAM = ['Andy', 'Austin', 'Joe', 'Danny']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${m} ${period}`
}

const SectionCard = ({ title, children }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
    <h3 className="font-bold mb-4 flex items-center gap-2">
      <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
      {title}
    </h3>
    {children}
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 py-2.5 border-b border-neutral-800 last:border-0">
    <span className="text-sm text-neutral-400 flex-shrink-0">{label}</span>
    <span className="text-sm text-white font-medium text-right">{value || '—'}</span>
  </div>
)

const SongRow = ({ label, title, artist }) => {
  if (!title && !artist) return (
    <div className="flex justify-between items-center py-2.5 border-b border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className="text-xs text-neutral-600 italic">Not provided</span>
    </div>
  )
  return (
    <div className="py-2.5 border-b border-neutral-800 last:border-0">
      <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">{label}</span>
      <div className="mt-1 text-sm text-white">{title || '—'} {artist ? <span className="text-neutral-400">· {artist}</span> : ''}</div>
    </div>
  )
}

export default function AdminClientDetail() {
  const router = useRouter()
  const { id } = router.query
  const [client, setClient] = useState(null)
  const [planner, setPlanner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [sendStatus, setSendStatus] = useState('idle') // idle | sending | sent | error
  const [activeTab, setActiveTab] = useState('overview')
  const [plannerForm, setPlannerForm] = useState(null)
  const [plannerSaveStatus, setPlannerSaveStatus] = useState('idle')

  const [adminForm, setAdminForm] = useState({
    package: '',
    total_contract: '',
    total_paid: '',
    balance_due: '',
    assigned_to: '',
    notes: '',
  })

  useEffect(() => {
    if (!id) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_USER_ID) {
        router.push('/portal/login')
        return
      }

      // Load client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (!clientData) { router.push('/admin'); return }
      setClient(clientData)
      setAdminForm({
        package: clientData.package || '',
        total_contract: clientData.total_contract || '',
        total_paid: clientData.total_paid || '',
        balance_due: clientData.balance_due || '',
        assigned_to: clientData.assigned_to || '',
        notes: clientData.notes || '',
      })

      // Load planner
      const { data: plannerData } = await supabase
        .from('wedding_planner')
        .select('*')
        .eq('client_id', id)
        .single()

      setPlanner(plannerData)
      // Initialize planner edit form with existing data or empty
      setPlannerForm({
        ceremony_start_time: plannerData?.ceremony_start_time || '',
        reception_end_time: plannerData?.reception_end_time || '',
        event_notes: plannerData?.event_notes || '',
        song_parent_procession_title: plannerData?.song_parent_procession_title || '',
        song_groom_procession_title: plannerData?.song_groom_procession_title || '',
        song_groomsmen_title: plannerData?.song_groomsmen_title || '',
        song_bridesmaids_title: plannerData?.song_bridesmaids_title || '',
        song_bride_procession_title: plannerData?.song_bride_procession_title || '',
        song_interlude_title: plannerData?.song_interlude_title || '',
        song_recessional_title: plannerData?.song_recessional_title || '',
        ceremony_notes: plannerData?.ceremony_notes || '',
        intro_party_first: plannerData?.intro_party_first || false,
        intro_party_style: plannerData?.intro_party_style || '',
        intro_party_order: plannerData?.intro_party_order || '',
        intro_couple_style: plannerData?.intro_couple_style || '',
        intro_notes: plannerData?.intro_notes || '',
        song_party_entrance_title: plannerData?.song_party_entrance_title || '',
        song_couple_entrance_title: plannerData?.song_couple_entrance_title || '',
        song_first_dance_title: plannerData?.song_first_dance_title || '',
        song_person1_parent_dance_title: plannerData?.song_person1_parent_dance_title || '',
        song_person1_parent_relation: plannerData?.song_person1_parent_relation || 'Mom',
        song_person2_parent_dance_title: plannerData?.song_person2_parent_dance_title || '',
        song_person2_parent_relation: plannerData?.song_person2_parent_relation || 'Mom',
        song_cake_cutting_title: plannerData?.song_cake_cutting_title || '',
        song_bouquet_toss_title: plannerData?.song_bouquet_toss_title || '',
        song_garter_toss_title: plannerData?.song_garter_toss_title || '',
        song_last_dance_guests_title: plannerData?.song_last_dance_guests_title || '',
        song_last_dance_private_title: plannerData?.song_last_dance_private_title || '',
        reception_notes: plannerData?.reception_notes || '',
        music_requests: plannerData?.music_requests || '',
        music_do_not_play: plannerData?.music_do_not_play || '',
        music_playlist_links: plannerData?.music_playlist_links || '',
        music_notes: plannerData?.music_notes || '',
      })
      setLoading(false)
    })
  }, [id])

  async function saveAdminFields() {
    setSaveStatus('saving')
    const contract = parseFloat(adminForm.total_contract) || 0
    const paid = parseFloat(adminForm.total_paid) || 0
    const balance = Math.max(0, contract - paid)
    // Auto-calculate balance due
    setAdminForm(p => ({ ...p, balance_due: balance.toFixed(2) }))
    const { error } = await supabase
      .from('clients')
      .update({
        package: adminForm.package,
        total_contract: contract,
        total_paid: paid,
        balance_due: balance,
        assigned_to: adminForm.assigned_to,
        notes: adminForm.notes,
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  async function sendPlanner() {
    if (!adminForm.assigned_to) {
      alert('Please assign this event to a team member first.')
      return
    }
    setSendStatus('sending')
    const res = await fetch('/api/send-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, assignedTo: adminForm.assigned_to }),
    })
    const data = await res.json()
    if (res.ok) {
      setSendStatus('sent')
      setTimeout(() => setSendStatus('idle'), 5000)
    } else {
      alert(data.error || 'Failed to send planner.')
      setSendStatus('idle')
    }
  }

  async function savePlanner() {
    setPlannerSaveStatus('saving')
    
    if (planner) {
      // Update existing planner
      const { error } = await supabase
        .from('wedding_planner')
        .update(plannerForm)
        .eq('client_id', id)
      if (error) { console.error(error); setPlannerSaveStatus('error'); return }
    } else {
      // Insert new planner
      const { error } = await supabase
        .from('wedding_planner')
        .insert({ ...plannerForm, client_id: id })
      if (error) { console.error(error); setPlannerSaveStatus('error'); return }
    }

    // Mark planner as complete
    await supabase
      .from('clients')
      .update({ planner_completed: true })
      .eq('id', id)

    setPlannerSaveStatus('saved')
    setTimeout(() => setPlannerSaveStatus('idle'), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading client...</div>
      </div>
    )
  }

  const sameRole = client.person1_role === client.person2_role
  const label1 = sameRole ? `${client.person1_first_name} (${client.person1_role})` : client.person1_role
  const label2 = sameRole ? `${client.person2_first_name} (${client.person2_role})` : client.person2_role

  const TABS = ['overview', 'ceremony', 'reception', 'music', 'edit planner', 'client view']

  return (
    <>
      <Head>
        <title>{client.person1_first_name} & {client.person2_first_name} — Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                ← All Clients
              </button>
              <span className="text-neutral-600">/</span>
              <span className="font-bold text-sm">{client.person1_first_name} & {client.person2_first_name}</span>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && <span className="text-xs text-neutral-500 animate-pulse">Saving...</span>}
              {saveStatus === 'saved' && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveStatus === 'error' && <span className="text-xs text-red-400">Save failed</span>}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-extrabold">
                  {client.person1_first_name} {client.person1_last_name} & {client.person2_first_name} {client.person2_last_name}
                </h1>
                <p className="text-neutral-400 mt-1">{label1} & {label2} · {client.venue}</p>
                <p className="text-tascosa-orange font-semibold mt-1">{formatDate(client.wedding_date)}</p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                  client.planner_completed ? 'bg-emerald-400/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-400'
                }`}>
                  {client.planner_completed ? '✓ Planner Complete' : '⏳ Planner Pending'}
                </span>
                {client.package && (
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-tascosa-orange/10 text-tascosa-orange">
                    {client.package}
                  </span>
                )}
                {!client.user_id && (
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-neutral-800 text-neutral-400">
                    No Portal Account
                  </span>
                )}
                {client.user_id && (
                  <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-emerald-400/10 text-emerald-400">
                    ✓ Portal Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-0">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-tascosa-orange text-tascosa-orange'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">

              {/* Contact info */}
              <SectionCard title="Contact Information">
                <InfoRow label={label1} value={`${client.person1_first_name} ${client.person1_last_name}`} />
                <InfoRow label={`${label1} Email`} value={client.person1_email} />
                <InfoRow label={`${label1} Phone`} value={client.person1_phone} />
                <div className="my-3 border-t border-neutral-800" />
                <InfoRow label={label2} value={`${client.person2_first_name} ${client.person2_last_name}`} />
                <InfoRow label={`${label2} Email`} value={client.person2_email} />
                <InfoRow label={`${label2} Phone`} value={client.person2_phone} />
              {/* Portal status */}
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Portal Status</p>
                  {client.user_id ? (
                    <p className="text-xs text-emerald-400">✓ {client.person1_first_name} has an active portal account</p>
                  ) : (
                    <p className="text-xs text-neutral-500">No portal account yet</p>
                  )}
                </div>
              </SectionCard>

              {/* Event info */}
              <SectionCard title="Event Details">
                <InfoRow label="Wedding Date" value={formatDate(client.wedding_date)} />
                <InfoRow label="Venue" value={client.venue} />
                <InfoRow label="Ceremony Start" value={formatTime(planner?.ceremony_start_time)} />
                <InfoRow label="Reception End" value={formatTime(planner?.reception_end_time)} />
                {planner?.event_notes && (
                  <div className="mt-3 pt-3 border-t border-neutral-800">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Event Notes</p>
                    <p className="text-sm text-neutral-300 leading-relaxed">{planner.event_notes}</p>
                  </div>
                )}

                {/* Assigned To + Send Planner */}
                <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 ml-1 uppercase tracking-wider">Assigned To</label>
                    <select
                      value={adminForm.assigned_to}
                      onChange={e => setAdminForm(p => ({ ...p, assigned_to: e.target.value }))}
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all appearance-none"
                    >
                      <option value="">Select team member...</option>
                      {TEAM.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={sendPlanner}
                    disabled={sendStatus === 'sending' || sendStatus === 'sent' || !client?.planner_completed}
                    className="w-full rounded-xl py-3 border border-neutral-700 hover:border-tascosa-orange text-neutral-300 hover:text-tascosa-orange font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sendStatus === 'sending' ? 'Sending...' :
                     sendStatus === 'sent' ? '✓ Planner Sent!' :
                     !client?.planner_completed ? '📋 Planner Not Yet Complete' :
                     '📋 Send Planner to Assigned DJ'}
                  </button>
                  {sendStatus === 'sent' && (
                    <p className="text-emerald-400 text-xs mt-1 text-center">Planner sent to {adminForm.assigned_to}</p>
                  )}
                  {!client?.planner_completed && (
                    <p className="text-neutral-600 text-xs mt-1 text-center">Client must complete their planner first</p>
                  )}
                </div>
              </SectionCard>

              {/* Admin fields — editable */}
              <SectionCard title="Package & Billing">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 ml-1 uppercase tracking-wider">Package</label>
                    <select
                      value={adminForm.package}
                      onChange={e => setAdminForm(p => ({ ...p, package: e.target.value }))}
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all appearance-none"
                    >
                      <option value="">Select package...</option>
                      {PACKAGES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Contract', key: 'total_contract' },
                      { label: 'Total Paid', key: 'total_paid' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs text-neutral-500 mb-1.5 ml-1 uppercase tracking-wider">{field.label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                          <input
                            type="number"
                            value={adminForm[field.key]}
                            onChange={e => setAdminForm(p => ({ ...p, [field.key]: e.target.value }))}
                            className="w-full rounded-xl bg-neutral-950 border border-neutral-700 pl-7 pr-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-neutral-950/60 rounded-xl border border-neutral-700 px-4 py-3 flex justify-between items-center">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Balance Due (auto-calculated)</span>
                    <span className="text-lg font-black text-tascosa-orange">
                      ${Math.max(0, (parseFloat(adminForm.total_contract) || 0) - (parseFloat(adminForm.total_paid) || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 ml-1 uppercase tracking-wider">Internal Notes</label>
                    <textarea
                      value={adminForm.notes}
                      onChange={e => setAdminForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      placeholder="Private notes about this client or event..."
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={saveAdminFields}
                    disabled={saveStatus === 'saving'}
                    className="w-full rounded-xl py-3 bg-tascosa-orange text-black font-black text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                  </button>


                </div>
              </SectionCard>

              {/* Intro notes */}
              {planner && (
                <SectionCard title="Introduction Details">
                  <InfoRow label="Party Introduced First?" value={planner.intro_party_first ? 'Yes' : 'No'} />
                  {planner.intro_party_first && (
                    <>
                      <InfoRow label="Introduction Style" value={planner.intro_party_style} />
                      {planner.intro_party_style === 'As Couples' && planner.intro_couples && (
                        <div className="mt-3 pt-3 border-t border-neutral-800">
                          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Couples Walk-in Order</p>
                          {planner.intro_couples.map((couple, i) => (
                            <p key={i} className="text-sm text-neutral-300 py-1">
                              {i + 1}. {couple.a} & {couple.b}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {planner.intro_couple_style && (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Couple Introduction</p>
                      <p className="text-sm text-neutral-300">{planner.intro_couple_style}</p>
                    </div>
                  )}
                  {planner.intro_notes && (
                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-neutral-300">{planner.intro_notes}</p>
                    </div>
                  )}
                </SectionCard>
              )}

            </div>
          )}

          {/* ── CEREMONY TAB ──────────────────────────────────────────────── */}
          {activeTab === 'ceremony' && (
            <div className="max-w-2xl">
              {!planner ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
                  Wedding planner not submitted yet.
                </div>
              ) : (
                <SectionCard title="Ceremony Songs">
                  <SongRow label="Parent / Grandparent Procession" title={planner.song_parent_procession_title} artist={planner.song_parent_procession_artist} />
                  <SongRow label="Groom Procession" title={planner.song_groom_procession_title} artist={planner.song_groom_procession_artist} />
                  <SongRow label="Wedding Party / Groomsmen" title={planner.song_groomsmen_title} artist={planner.song_groomsmen_artist} />
                  <SongRow label="Wedding Party / Bridesmaids" title={planner.song_bridesmaids_title} artist={planner.song_bridesmaids_artist} />
                  <SongRow label="Bride Procession" title={planner.song_bride_procession_title} artist={planner.song_bride_procession_artist} />
                  <SongRow label="Interlude" title={planner.song_interlude_title} artist={planner.song_interlude_artist} />
                  <SongRow label="Recessional" title={planner.song_recessional_title} artist={planner.song_recessional_artist} />
                  {planner.ceremony_notes && (
                    <div className="mt-4 pt-4 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Ceremony Notes</p>
                      <p className="text-sm text-neutral-300 leading-relaxed">{planner.ceremony_notes}</p>
                    </div>
                  )}
                </SectionCard>
              )}
            </div>
          )}

          {/* ── RECEPTION TAB ─────────────────────────────────────────────── */}
          {activeTab === 'reception' && (
            <div className="max-w-2xl">
              {!planner ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
                  Wedding planner not submitted yet.
                </div>
              ) : (
                <SectionCard title="Reception Songs">
                  <SongRow label="Wedding Party Entrance" title={planner.song_party_entrance_title} artist={planner.song_party_entrance_artist} />
                  <SongRow label={`${label1} & ${label2} Entrance`} title={planner.song_couple_entrance_title} artist={planner.song_couple_entrance_artist} />
                  <SongRow label="First Dance" title={planner.song_first_dance_title} artist={planner.song_first_dance_artist} />
                  <SongRow label={`${label1} & ${planner.song_person1_parent_relation || 'Parent'} Dance`} title={planner.song_person1_parent_dance_title} artist={planner.song_person1_parent_dance_artist} />
                  <SongRow label={`${label2} & ${planner.song_person2_parent_relation || 'Parent'} Dance`} title={planner.song_person2_parent_dance_title} artist={planner.song_person2_parent_dance_artist} />
                  <SongRow label="Cake Cutting" title={planner.song_cake_cutting_title} artist={planner.song_cake_cutting_artist} />
                  <SongRow label="Bouquet Toss" title={planner.song_bouquet_toss_title} artist={planner.song_bouquet_toss_artist} />
                  <SongRow label="Garter Toss" title={planner.song_garter_toss_title} artist={planner.song_garter_toss_artist} />
                  <SongRow label="Last Dance with Guests" title={planner.song_last_dance_guests_title} artist={planner.song_last_dance_guests_artist} />
                  <SongRow label="Last Dance — Private" title={planner.song_last_dance_private_title} artist={planner.song_last_dance_private_artist} />
                  {planner.reception_notes && (
                    <div className="mt-4 pt-4 border-t border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Reception Notes</p>
                      <p className="text-sm text-neutral-300 leading-relaxed">{planner.reception_notes}</p>
                    </div>
                  )}
                </SectionCard>
              )}
            </div>
          )}

          {/* ── MUSIC TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'music' && (
            <div className="max-w-2xl space-y-6">
              {!planner ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500">
                  Wedding planner not submitted yet.
                </div>
              ) : (
                <>
                  <SectionCard title="Music Requests">
                    {planner.music_requests ? (
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{planner.music_requests}</p>
                    ) : (
                      <p className="text-sm text-neutral-600 italic">None provided</p>
                    )}
                  </SectionCard>
                  <SectionCard title="Do Not Play">
                    {planner.music_do_not_play ? (
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{planner.music_do_not_play}</p>
                    ) : (
                      <p className="text-sm text-neutral-600 italic">None provided</p>
                    )}
                  </SectionCard>
                  {planner.music_playlist_links && (
                    <SectionCard title="Playlist Links">
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{planner.music_playlist_links}</p>
                    </SectionCard>
                  )}
                  {planner.music_notes && (
                    <SectionCard title="Music Notes">
                      <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{planner.music_notes}</p>
                    </SectionCard>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── EDIT PLANNER TAB ──────────────────────────────────── */}
          {activeTab === 'edit planner' && plannerForm && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-tascosa-orange/5 border border-tascosa-orange/20 rounded-2xl p-4 text-sm text-neutral-400">
                ✏️ Fill out or update the wedding planner on behalf of this client. Saves directly to the database.
              </div>

              <SectionCard title="Event Timeline">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Ceremony Start</label>
                    <input type="time" value={plannerForm.ceremony_start_time} onChange={e => setPlannerForm(p => ({...p, ceremony_start_time: e.target.value}))} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Reception End</label>
                    <input type="time" value={plannerForm.reception_end_time} onChange={e => setPlannerForm(p => ({...p, reception_end_time: e.target.value}))} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange [color-scheme:dark]" />
                  </div>
                </div>
                <textarea value={plannerForm.event_notes} onChange={e => setPlannerForm(p => ({...p, event_notes: e.target.value}))} rows={3} placeholder="Event notes..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
              </SectionCard>

              <SectionCard title="Ceremony Songs">
                <div className="space-y-3">
                  {[
                    { label: 'Parent/Grandparent Procession', key: 'song_parent_procession_title' },
                    { label: 'Groom Procession', key: 'song_groom_procession_title' },
                    { label: 'Wedding Party / Groomsmen', key: 'song_groomsmen_title' },
                    { label: 'Wedding Party / Bridesmaids', key: 'song_bridesmaids_title' },
                    { label: 'Bride Procession', key: 'song_bride_procession_title' },
                    { label: 'Interlude', key: 'song_interlude_title' },
                    { label: 'Recessional', key: 'song_recessional_title' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">{field.label}</label>
                      <input value={plannerForm[field.key]} onChange={e => setPlannerForm(p => ({...p, [field.key]: e.target.value}))} placeholder="Song title — Artist" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Ceremony Notes</label>
                    <textarea value={plannerForm.ceremony_notes} onChange={e => setPlannerForm(p => ({...p, ceremony_notes: e.target.value}))} rows={2} placeholder="Notes..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Wedding Party Introductions">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Party Introduced First?</p>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} type="button"
                          onClick={() => setPlannerForm(p => ({...p, intro_party_first: opt === 'Yes'}))}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            (opt === 'Yes' && plannerForm.intro_party_first) || (opt === 'No' && !plannerForm.intro_party_first)
                              ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {plannerForm.intro_party_first && (
                    <>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Introduction Style</label>
                        <input value={plannerForm.intro_party_style} onChange={e => setPlannerForm(p => ({...p, intro_party_style: e.target.value}))} placeholder="As one group / As couples..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Party Walk-in Order</label>
                        <textarea value={plannerForm.intro_party_order} onChange={e => setPlannerForm(p => ({...p, intro_party_order: e.target.value}))} rows={4} placeholder="List couples in order..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Couple Introduction</label>
                    <textarea value={plannerForm.intro_couple_style} onChange={e => setPlannerForm(p => ({...p, intro_couple_style: e.target.value}))} rows={2} placeholder="How would you like to be introduced..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Intro Notes</label>
                    <textarea value={plannerForm.intro_notes} onChange={e => setPlannerForm(p => ({...p, intro_notes: e.target.value}))} rows={2} placeholder="Notes..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Reception Songs">
                <div className="space-y-3">
                  {[
                    { label: 'Wedding Party Entrance', key: 'song_party_entrance_title' },
                    { label: `${label1} & ${label2} Entrance`, key: 'song_couple_entrance_title' },
                    { label: 'First Dance', key: 'song_first_dance_title' },
                    { label: 'Cake Cutting', key: 'song_cake_cutting_title' },
                    { label: 'Bouquet Toss', key: 'song_bouquet_toss_title' },
                    { label: 'Garter Toss', key: 'song_garter_toss_title' },
                    { label: 'Last Dance with Guests', key: 'song_last_dance_guests_title' },
                    { label: 'Last Dance — Private', key: 'song_last_dance_private_title' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">{field.label}</label>
                      <input value={plannerForm[field.key]} onChange={e => setPlannerForm(p => ({...p, [field.key]: e.target.value}))} placeholder="Song title — Artist" className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                    </div>
                  ))}
                  {[
                    { label: `${label1} & Parent Dance`, titleKey: 'song_person1_parent_dance_title', relationKey: 'song_person1_parent_relation' },
                    { label: `${label2} & Parent Dance`, titleKey: 'song_person2_parent_dance_title', relationKey: 'song_person2_parent_relation' },
                  ].map(field => (
                    <div key={field.titleKey} className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800">
                      <p className="text-xs text-neutral-400 font-semibold mb-2">{field.label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={plannerForm[field.relationKey]} onChange={e => setPlannerForm(p => ({...p, [field.relationKey]: e.target.value}))} className="rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none appearance-none">
                          {['Mom','Dad','Stepmom','Stepdad','Brother','Sister','Grandparent','Other'].map(r => <option key={r}>{r}</option>)}
                        </select>
                        <input value={plannerForm[field.titleKey]} onChange={e => setPlannerForm(p => ({...p, [field.titleKey]: e.target.value}))} placeholder="Song — Artist" className="rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange" />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">Reception Notes</label>
                    <textarea value={plannerForm.reception_notes} onChange={e => setPlannerForm(p => ({...p, reception_notes: e.target.value}))} rows={2} placeholder="Notes..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Music Preferences">
                <div className="space-y-4">
                  {[
                    { label: 'Songs / Artists / Genres to PLAY', key: 'music_requests' },
                    { label: 'DO NOT PLAY', key: 'music_do_not_play' },
                    { label: 'Playlist Links', key: 'music_playlist_links' },
                    { label: 'Music Notes', key: 'music_notes' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs text-neutral-500 mb-1 uppercase tracking-wider">{field.label}</label>
                      <textarea value={plannerForm[field.key]} onChange={e => setPlannerForm(p => ({...p, [field.key]: e.target.value}))} rows={3} placeholder="..." className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-tascosa-orange resize-none" />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="sticky bottom-4">
                <button
                  onClick={savePlanner}
                  disabled={plannerSaveStatus === 'saving'}
                  className="w-full rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-tascosa-orange/20"
                >
                  {plannerSaveStatus === 'saving' ? 'Saving...' :
                   plannerSaveStatus === 'saved' ? '✓ Planner Saved!' :
                   plannerSaveStatus === 'error' ? 'Save Failed — Try Again' :
                   'Save Wedding Planner'}
                </button>
              </div>

            </div>
          )}

          {/* ── CLIENT VIEW TAB ───────────────────────────────────────── */}
          {activeTab === 'client view' && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-tascosa-orange/5 border border-tascosa-orange/20 rounded-2xl p-4 text-sm text-neutral-400">
                👁 This is how the client sees their portal dashboard.
              </div>

              {/* Countdown */}
              {client.wedding_date && (() => {
                const eventDate = new Date(client.wedding_date + 'T12:00:00')
                const today = new Date()
                const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))
                return (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
                    {daysUntil > 0 ? (
                      <>
                        <p className="text-neutral-400 text-sm mb-1">Days Until Your Event</p>
                        <p className="text-6xl font-black text-tascosa-orange">{daysUntil}</p>
                        <p className="text-neutral-400 text-sm mt-1">{formatDate(client.wedding_date)}</p>
                      </>
                    ) : daysUntil === 0 ? (
                      <>
                        <p className="text-2xl font-black text-tascosa-orange">🎉 Today is the Day!</p>
                        <p className="text-neutral-400 text-sm mt-1">{formatDate(client.wedding_date)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-neutral-400 text-sm mb-1">Event Completed</p>
                        <p className="text-2xl font-black text-emerald-400">✓ {formatDate(client.wedding_date)}</p>
                      </>
                    )}
                  </div>
                )
              })()}

              {/* Event Details */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                  Event Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Venue</span>
                    <span className="text-white font-medium">{client.venue || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Ceremony Start</span>
                    <span className="text-white font-medium">{planner?.ceremony_start_time ? formatTime(planner.ceremony_start_time) : '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Reception End</span>
                    <span className="text-white font-medium">{planner?.reception_end_time ? formatTime(planner.reception_end_time) : '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-400">Package</span>
                    <span className="text-white font-medium">{client.package || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                  Balance Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Total Contract</span>
                    <span className="text-white font-medium">${(client.total_contract || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Total Paid</span>
                    <span className="text-emerald-400 font-medium">${(client.total_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-400">Balance Due</span>
                    <span className={`font-black text-lg ${client.balance_due > 0 ? 'text-tascosa-orange' : 'text-emerald-400'}`}>
                      ${(client.balance_due || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wedding Planner Status */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
                  Wedding Planner
                </h3>
                {client.planner_completed ? (
                  <div className="flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4">
                    <span className="text-emerald-400 text-xl">✓</span>
                    <div>
                      <p className="text-emerald-400 font-bold">Planner Complete</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Your wedding planner has been submitted.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
                    <span className="text-yellow-400 text-xl">⏳</span>
                    <div>
                      <p className="text-yellow-400 font-bold">Planner Pending</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Complete your wedding planner so we can prepare for your big day!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Portal Status */}
              <div className={`rounded-2xl p-4 text-center text-sm ${client.user_id ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-400' : 'bg-neutral-900 border border-neutral-800 text-neutral-500'}`}>
                {client.user_id ? '✓ Client has an active portal account' : 'No portal account yet'}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  )
}

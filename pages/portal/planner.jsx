// FILE LOCATION: pages/portal/planner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Wedding Planner — full multi-step form
// 5 pages matching the original Tally form, rebuilt natively
// Auto-saves to Supabase on every page completion
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const PARENT_RELATIONS = ['Mom', 'Dad', 'Stepmom', 'Stepdad', 'Brother', 'Sister', 'Grandparent', 'Other']
const TOTAL_STEPS = 5

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────

const InputClass = "w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all placeholder:text-neutral-500"
const LabelClass = "block text-sm font-medium text-neutral-300 mb-1.5 ml-1"
const SelectClass = "w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all appearance-none cursor-pointer"
const TextareaClass = "w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all resize-none placeholder:text-neutral-500"

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-1">
      <span className="h-4 w-1 bg-tascosa-orange rounded-full flex-none"></span>
      <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>
    {subtitle && <p className="text-neutral-500 text-sm ml-4">{subtitle}</p>}
  </div>
)

const SongField = ({ label, titleName, artistName, titleValue, artistValue, onChange }) => (
  <div className="bg-neutral-950/50 rounded-2xl p-4 border border-neutral-800">
    <p className="text-sm font-semibold text-neutral-300 mb-3">{label}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-neutral-500 mb-1 ml-1">Song Title</label>
        <input name={titleName} value={titleValue} onChange={onChange} placeholder="Song title" className={InputClass} />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1 ml-1">Artist</label>
        <input name={artistName} value={artistValue} onChange={onChange} placeholder="Artist name" className={InputClass} />
      </div>
    </div>
  </div>
)

// ─── TIME SELECT COMPONENT ───────────────────────────────────────────────────
const TimeSelect = ({ name, value, onChange }) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = ['00', '15', '30', '45']
  const periods = ['AM', 'PM']

  // Parse existing value (stored as "HH:MM" 24hr) or default
  const parseValue = (val) => {
    if (!val) return { hour: '12', minute: '00', period: 'PM' }
    const [h, m] = val.split(':')
    const hour24 = parseInt(h)
    const period = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    return { hour: String(hour12), minute: m || '00', period }
  }

  const { hour, minute, period } = parseValue(value)

  const handlePartChange = (part, val) => {
    let h = part === 'hour' ? val : hour
    let m = part === 'minute' ? val : minute
    let p = part === 'period' ? val : period
    // Convert to 24hr for storage
    let h24 = parseInt(h)
    if (p === 'PM' && h24 !== 12) h24 += 12
    if (p === 'AM' && h24 === 12) h24 = 0
    const timeStr = `${String(h24).padStart(2, '0')}:${m}`
    onChange({ target: { name, value: timeStr } })
  }

  return (
    <div className="flex gap-2">
      <select
        value={hour}
        onChange={e => handlePartChange('hour', e.target.value)}
        className={SelectClass + ' flex-1'}
      >
        {hours.map(h => <option key={h} value={String(h)}>{h}</option>)}
      </select>
      <select
        value={minute}
        onChange={e => handlePartChange('minute', e.target.value)}
        className={SelectClass + ' flex-1'}
      >
        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select
        value={period}
        onChange={e => handlePartChange('period', e.target.value)}
        className={SelectClass + ' flex-1'}
      >
        {periods.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  )
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
const ProgressBar = ({ step, total }) => (
  <div className="mb-8">
    <div className="flex justify-between text-xs text-neutral-500 mb-2">
      <span>Step {step} of {total}</span>
      <span>{Math.round((step / total) * 100)}% complete</span>
    </div>
    <div className="h-2 rounded-full bg-neutral-800">
      <div
        className="h-2 rounded-full bg-tascosa-orange transition-all duration-500"
        style={{ width: `${(step / total) * 100}%` }}
      ></div>
    </div>
  </div>
)

// ─── STEP LABELS ──────────────────────────────────────────────────────────────
const STEP_LABELS = [
  'Event Info',
  'Ceremony Music',
  'Wedding Party',
  'Reception Songs',
  'Music Preferences',
]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Planner() {
  const router = useRouter()
  const [client, setClient] = useState(null)
  const [plannerId, setPlannerId] = useState(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    // Page 1 — Event Info
    ceremony_start_time: '',
    reception_end_time: '',
    event_notes: '',

    // Page 2 — Ceremony Music
    song_parent_procession_title: '',
    song_parent_procession_artist: '',
    song_groom_procession_title: '',
    song_groom_procession_artist: '',
    song_groomsmen_title: '',
    song_groomsmen_artist: '',
    song_bridesmaids_title: '',
    song_bridesmaids_artist: '',
    song_bride_procession_title: '',
    song_bride_procession_artist: '',
    song_interlude_title: '',
    song_interlude_artist: '',
    song_recessional_title: '',
    song_recessional_artist: '',
    ceremony_notes: '',

    // Page 3 — Introductions
    intro_party_first: false,
    intro_party_style: '',
    intro_party_order: '',
    intro_couples: [{ a: '', b: '' }],
    intro_couple_style: '',
    intro_notes: '',

    // Page 4 — Reception Songs
    song_party_entrance_title: '',
    song_party_entrance_artist: '',
    song_couple_entrance_title: '',
    song_couple_entrance_artist: '',
    song_first_dance_title: '',
    song_first_dance_artist: '',
    song_person1_parent_dance_title: '',
    song_person1_parent_dance_artist: '',
    song_person1_parent_relation: 'Mom',
    song_person2_parent_dance_title: '',
    song_person2_parent_dance_artist: '',
    song_person2_parent_relation: 'Mom',
    song_cake_cutting_title: '',
    song_cake_cutting_artist: '',
    song_bouquet_toss_title: '',
    song_bouquet_toss_artist: '',
    song_garter_toss_title: '',
    song_garter_toss_artist: '',
    song_last_dance_guests_title: '',
    song_last_dance_guests_artist: '',
    song_last_dance_private_title: '',
    song_last_dance_private_artist: '',
    reception_notes: '',

    // Page 5 — Music Preferences
    music_requests: '',
    music_do_not_play: '',
    music_playlist_links: '',
    music_notes: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (!clientData?.person1_first_name) { router.push('/portal/onboarding'); return }
      setClient(clientData)

      // Load existing planner data if it exists
      const { data: plannerData } = await supabase
        .from('wedding_planner')
        .select('*')
        .eq('client_id', clientData.id)
        .single()

      if (plannerData) {
        setPlannerId(plannerData.id)
        // Merge existing data into form
        setForm(prev => ({ ...prev, ...plannerData }))
      }

      setLoading(false)
    })
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function saveProgress(isComplete = false) {
    setSaveStatus('saving')

    const payload = { ...form, client_id: client.id }
    if (isComplete) payload.planner_completed = true

    let error

    if (plannerId) {
      const { error: updateError } = await supabase
        .from('wedding_planner')
        .update(payload)
        .eq('id', plannerId)
      error = updateError
    } else {
      const { data, error: insertError } = await supabase
        .from('wedding_planner')
        .insert(payload)
        .select()
        .single()
      if (data) setPlannerId(data.id)
      error = insertError
    }

    // Update planner_completed flag on clients table if done
    if (isComplete && !error) {
      await supabase
        .from('clients')
        .update({ planner_completed: true })
        .eq('id', client.id)
    }

    if (error) {
      console.error(error)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }

    return !error
  }

  async function handleNext() {
    const success = await saveProgress(false)
    if (success) setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleFinish() {
    const success = await saveProgress(true)
    if (success) router.push('/portal/dashboard')
  }

  function handleBack() {
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-neutral-400 text-sm animate-pulse">Loading your wedding planner...</div>
      </div>
    )
  }

  const person1Role = client?.person1_role || 'Person 1'
  const person2Role = client?.person2_role || 'Person 2'
  const person1Name = client?.person1_first_name || 'Person 1'
  const person2Name = client?.person2_first_name || 'Person 2'
  const sameRole = person1Role === person2Role
  const label1 = sameRole ? `${person1Name} (${person1Role})` : person1Role
  const label2 = sameRole ? `${person2Name} (${person2Role})` : person2Role

  return (
    <>
      <Head>
        <title>Wedding Planner — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100">

        {/* Nav */}
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/TA Logo.png" alt="Tascosa Audio" className="h-8 w-auto object-contain" />
              <span className="font-bold text-sm tracking-wide hidden sm:block">Wedding Planner</span>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus === 'saving' && <span className="text-xs text-neutral-500 animate-pulse">Saving...</span>}
              {saveStatus === 'saved' && <span className="text-xs text-emerald-400">✓ Saved</span>}
              {saveStatus === 'error' && <span className="text-xs text-red-400">Save failed</span>}
              <button
                onClick={() => router.push('/portal/dashboard')}
                className="text-xs text-neutral-500 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-xl px-3 py-2 transition-all"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-10">

          {/* Step indicator */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold mb-1">{STEP_LABELS[step - 1]}</h1>
            <p className="text-neutral-500 text-sm">
              {person1Name} & {person2Name} · {client?.venue}
            </p>
          </div>

          <ProgressBar step={step} total={TOTAL_STEPS} />

          {/* ── STEP 1: EVENT INFO ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <SectionHeading
                title="Event Timeline"
                subtitle="Help us plan the timing of your ceremony and reception."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={LabelClass}>Ceremony Start Time</label>
                  <TimeSelect name="ceremony_start_time" value={form.ceremony_start_time} onChange={handleChange} />
                </div>
                <div>
                  <label className={LabelClass}>Reception End Time</label>
                  <TimeSelect name="reception_end_time" value={form.reception_end_time} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label className={LabelClass}>Notes / Special Requests / Announcements</label>
                <textarea name="event_notes" value={form.event_notes} onChange={handleChange} rows={4} placeholder="Anything we should know about the overall timeline or event..." className={TextareaClass} />
              </div>
            </div>
          )}

          {/* ── STEP 2: CEREMONY MUSIC ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <SectionHeading
                title="Ceremony Music"
                subtitle="Below are the typical events during the ceremony that have songs attached. You do not have to have a song listed for all of the events. If there is a different event not listed, please add it in the notes section."
              />
              <SongField label="Parent / Grandparent Procession" titleName="song_parent_procession_title" artistName="song_parent_procession_artist" titleValue={form.song_parent_procession_title} artistValue={form.song_parent_procession_artist} onChange={handleChange} />
              <SongField label="Groom Procession" titleName="song_groom_procession_title" artistName="song_groom_procession_artist" titleValue={form.song_groom_procession_title} artistValue={form.song_groom_procession_artist} onChange={handleChange} />
              <SongField label="Wedding Party / Groomsmen" titleName="song_groomsmen_title" artistName="song_groomsmen_artist" titleValue={form.song_groomsmen_title} artistValue={form.song_groomsmen_artist} onChange={handleChange} />
              <SongField label="Wedding Party / Bridesmaids" titleName="song_bridesmaids_title" artistName="song_bridesmaids_artist" titleValue={form.song_bridesmaids_title} artistValue={form.song_bridesmaids_artist} onChange={handleChange} />
              <SongField label="Bride Procession" titleName="song_bride_procession_title" artistName="song_bride_procession_artist" titleValue={form.song_bride_procession_title} artistValue={form.song_bride_procession_artist} onChange={handleChange} />
              <SongField label="Interlude (e.g. Unity Candle / Knot Tying)" titleName="song_interlude_title" artistName="song_interlude_artist" titleValue={form.song_interlude_title} artistValue={form.song_interlude_artist} onChange={handleChange} />
              <SongField label="Recessional" titleName="song_recessional_title" artistName="song_recessional_artist" titleValue={form.song_recessional_title} artistValue={form.song_recessional_artist} onChange={handleChange} />
              <div>
                <label className={LabelClass}>Notes / Special Requests / Announcements</label>
                <textarea name="ceremony_notes" value={form.ceremony_notes} onChange={handleChange} rows={3} placeholder="Any special ceremony notes..." className={TextareaClass} />
              </div>
            </div>
          )}

          {/* ── STEP 3: WEDDING PARTY INTRODUCTIONS ───────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <SectionHeading
                title="Wedding Party Introductions"
                subtitle="Tell us how you'd like your wedding party and yourselves introduced."
              />

              {/* Yes/No toggle */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <p className="text-sm font-semibold text-neutral-300 mb-4">
                  Would you like the Wedding Party introduced before {label1} & {label2}?
                </p>
                <div className="flex gap-3">
                  {['Yes', 'No'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, intro_party_first: opt === 'Yes' }))}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                        (opt === 'Yes' && form.intro_party_first) || (opt === 'No' && !form.intro_party_first)
                          ? 'bg-tascosa-orange text-black'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional fields if Yes */}
              {form.intro_party_first && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                    <p className="text-sm font-semibold text-neutral-300 mb-4">How would you like the Wedding Party introduced?</p>
                    <div className="flex gap-3">
                      {['As One Large Group', 'As Couples'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, intro_party_style: opt, intro_party_order: opt === 'As One Large Group' ? '' : prev.intro_party_order }))}
                          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                            form.intro_party_style === opt
                              ? 'bg-tascosa-orange text-black'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* As Couples — dynamic pair list */}
                  {form.intro_party_style === 'As Couples' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <p className="text-sm font-semibold text-neutral-300 ml-1">List each couple in walk-in order:</p>
                      {(form.intro_couples || [{ a: '', b: '' }]).map((couple, idx) => (
                        <div key={idx} className="bg-neutral-950/50 border border-neutral-800 rounded-2xl p-4">
                          <p className="text-xs text-neutral-500 mb-3 font-medium">Couple {idx + 1}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1 ml-1">Person A</label>
                              <input
                                value={couple.a}
                                onChange={e => {
                                  const updated = [...(form.intro_couples || [])]
                                  updated[idx] = { ...updated[idx], a: e.target.value }
                                  setForm(prev => ({ ...prev, intro_couples: updated }))
                                }}
                                placeholder="Name & role"
                                className={InputClass}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1 ml-1">Person B</label>
                              <input
                                value={couple.b}
                                onChange={e => {
                                  const updated = [...(form.intro_couples || [])]
                                  updated[idx] = { ...updated[idx], b: e.target.value }
                                  setForm(prev => ({ ...prev, intro_couples: updated }))
                                }}
                                placeholder="Name & role"
                                className={InputClass}
                              />
                            </div>
                          </div>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (form.intro_couples || []).filter((_, i) => i !== idx)
                                setForm(prev => ({ ...prev, intro_couples: updated }))
                              }}
                              className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                              Remove couple
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, intro_couples: [...(prev.intro_couples || [{ a: '', b: '' }]), { a: '', b: '' }] }))}
                        className="w-full rounded-2xl py-3 border border-dashed border-neutral-700 hover:border-tascosa-orange text-neutral-400 hover:text-tascosa-orange font-semibold text-sm transition-all"
                      >
                        + Add Another Couple
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className={LabelClass}>How would you like to be introduced into the reception?</label>
                <textarea name="intro_couple_style" value={form.intro_couple_style} onChange={handleChange} rows={3} placeholder={`e.g. "For the first time as husband and wife, please welcome ${person1Name} and ${person2Name}!"`} className={TextareaClass} />
              </div>

              <div>
                <label className={LabelClass}>Notes / Special Requests / Announcements</label>
                <textarea name="intro_notes" value={form.intro_notes} onChange={handleChange} rows={3} placeholder="Anything else about introductions..." className={TextareaClass} />
              </div>
            </div>
          )}

          {/* ── STEP 4: RECEPTION SONGS ────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <SectionHeading
                title="Reception Songs"
                subtitle="Below are the typical events during the reception that have songs attached. You do not have to have a song listed for all of the events. If there is a different event not listed, please add it in the notes section."
              />
              <SongField label="Wedding Party Entrance" titleName="song_party_entrance_title" artistName="song_party_entrance_artist" titleValue={form.song_party_entrance_title} artistValue={form.song_party_entrance_artist} onChange={handleChange} />
              <SongField label={`${label1} & ${label2} Entrance`} titleName="song_couple_entrance_title" artistName="song_couple_entrance_artist" titleValue={form.song_couple_entrance_title} artistValue={form.song_couple_entrance_artist} onChange={handleChange} />
              <SongField label={`${label1} & ${label2} First Dance`} titleName="song_first_dance_title" artistName="song_first_dance_artist" titleValue={form.song_first_dance_title} artistValue={form.song_first_dance_artist} onChange={handleChange} />

              {/* Person 1 Parent Dance */}
              <div className="bg-neutral-950/50 rounded-2xl p-4 border border-neutral-800">
                <p className="text-sm font-semibold text-neutral-300 mb-3">{label1} & Parent Dance</p>
                <div className="mb-3">
                  <label className="block text-xs text-neutral-500 mb-1 ml-1">Parent / Family Member</label>
                  <select name="song_person1_parent_relation" value={form.song_person1_parent_relation} onChange={handleChange} className={SelectClass}>
                    {PARENT_RELATIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 ml-1">Song Title</label>
                    <input name="song_person1_parent_dance_title" value={form.song_person1_parent_dance_title} onChange={handleChange} placeholder="Song title" className={InputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 ml-1">Artist</label>
                    <input name="song_person1_parent_dance_artist" value={form.song_person1_parent_dance_artist} onChange={handleChange} placeholder="Artist name" className={InputClass} />
                  </div>
                </div>
              </div>

              {/* Person 2 Parent Dance */}
              <div className="bg-neutral-950/50 rounded-2xl p-4 border border-neutral-800">
                <p className="text-sm font-semibold text-neutral-300 mb-3">{label2} & Parent Dance</p>
                <div className="mb-3">
                  <label className="block text-xs text-neutral-500 mb-1 ml-1">Parent / Family Member</label>
                  <select name="song_person2_parent_relation" value={form.song_person2_parent_relation} onChange={handleChange} className={SelectClass}>
                    {PARENT_RELATIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 ml-1">Song Title</label>
                    <input name="song_person2_parent_dance_title" value={form.song_person2_parent_dance_title} onChange={handleChange} placeholder="Song title" className={InputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1 ml-1">Artist</label>
                    <input name="song_person2_parent_dance_artist" value={form.song_person2_parent_dance_artist} onChange={handleChange} placeholder="Artist name" className={InputClass} />
                  </div>
                </div>
              </div>

              <SongField label="Cake Cutting" titleName="song_cake_cutting_title" artistName="song_cake_cutting_artist" titleValue={form.song_cake_cutting_title} artistValue={form.song_cake_cutting_artist} onChange={handleChange} />
              <SongField label="Bouquet Toss" titleName="song_bouquet_toss_title" artistName="song_bouquet_toss_artist" titleValue={form.song_bouquet_toss_title} artistValue={form.song_bouquet_toss_artist} onChange={handleChange} />
              <SongField label="Garter Toss" titleName="song_garter_toss_title" artistName="song_garter_toss_artist" titleValue={form.song_garter_toss_title} artistValue={form.song_garter_toss_artist} onChange={handleChange} />
              <SongField label="Last Dance with Guests" titleName="song_last_dance_guests_title" artistName="song_last_dance_guests_artist" titleValue={form.song_last_dance_guests_title} artistValue={form.song_last_dance_guests_artist} onChange={handleChange} />
              <SongField label="Last Dance — Private" titleName="song_last_dance_private_title" artistName="song_last_dance_private_artist" titleValue={form.song_last_dance_private_title} artistValue={form.song_last_dance_private_artist} onChange={handleChange} />

              <div>
                <label className={LabelClass}>Notes / Special Requests / Announcements</label>
                <textarea name="reception_notes" value={form.reception_notes} onChange={handleChange} rows={3} placeholder="Any special reception notes..." className={TextareaClass} />
              </div>
            </div>
          )}

          {/* ── STEP 5: MUSIC PREFERENCES ──────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <SectionHeading
                title="Music Preferences"
                subtitle="Help us keep the dance floor exactly how you want it all night long. Feel free to share a Spotify, Apple Music, or Tidal playlist — just paste the link below and we'll make sure your vibe is on point all night. Your guests will also be able to make song requests during the event!"
              />
              <div>
                <label className={LabelClass}>Songs, Artists, or Genres you WANT played</label>
                <textarea name="music_requests" value={form.music_requests} onChange={handleChange} rows={5} placeholder="e.g. 90s country, Garth Brooks, Friends in Low Places, anything by Post Malone..." className={TextareaClass} />
              </div>
              <div>
                <label className={LabelClass}>Songs, Artists, or Genres you DO NOT WANT played</label>
                <textarea name="music_do_not_play" value={form.music_do_not_play} onChange={handleChange} rows={5} placeholder="e.g. No heavy metal, no explicit lyrics, please don't play YMCA..." className={TextareaClass} />
              </div>
              <div>
                <label className={LabelClass}>Playlist Links (Spotify, Apple Music, YouTube, etc.)</label>
                <textarea name="music_playlist_links" value={form.music_playlist_links} onChange={handleChange} rows={3} placeholder="Paste any playlist links here..." className={TextareaClass} />
              </div>
              <div>
                <label className={LabelClass}>Notes / Special Requests / Announcements</label>
                <textarea name="music_notes" value={form.music_notes} onChange={handleChange} rows={3} placeholder="Anything else about music preferences..." className={TextareaClass} />
              </div>

              {/* Completion message */}
              <div className="bg-tascosa-orange/5 border border-tascosa-orange/30 rounded-2xl p-5 text-center">
                <p className="text-tascosa-orange font-bold text-lg mb-1">🎉 Almost done!</p>
                <p className="text-neutral-400 text-sm">
                  Click "Submit Wedding Planner" below to save everything and let Andy know you're all set.
                  You can always come back and make changes before your event.
                </p>
              </div>
            </div>
          )}

          {/* ── NAVIGATION BUTTONS ─────────────────────────────────────────── */}
          <div className="flex gap-4 mt-10">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-2xl py-4 border border-neutral-700 text-neutral-300 font-bold hover:border-neutral-500 transition-all"
              >
                ← Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={saveStatus === 'saving'}
                className="flex-1 rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save & Continue →'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saveStatus === 'saving'}
                className="flex-1 rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-tascosa-orange/20"
              >
                {saveStatus === 'saving' ? 'Submitting...' : '✓ Submit Wedding Planner'}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-neutral-600 mt-6">
            Your progress is saved automatically as you go.
            Questions? <a href="tel:8066707913" className="text-tascosa-orange hover:underline">Call or text Andy at 806-670-7913</a>
          </p>

        </main>
      </div>
    </>
  )
}

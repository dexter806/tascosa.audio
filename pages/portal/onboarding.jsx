// FILE LOCATION: pages/portal/onboarding.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Required onboarding page — clients must complete this before dashboard access
// Collects: names, roles, contact info, venue, wedding date
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ROLES = ['Bride', 'Groom', 'Partner', 'Spouse', 'Celebrant', 'Other']

const VENUES = [
  'Knotting Hill Wedding and Event Center',
  'Iron Rose Weddings and Events',
  'River Falls Venue + Lodges',
  'Cornerstone Ranch Event Center',
  'Legacy Wedding & Event Center',
  'Panhandle Charm Weddings & Events',
  'The Resplendent Garden',
  'The Barn on Willow Creek',
  'Homestyle Country Weddings',
  'Rustic Meadows',
  'Mission Ranch',
  'Yellow',
  'Mack Dick Pavilion — Palo Duro Canyon',
  'Chateau Event Center',
  'Sad Monkey',
  'High Wind of Amarillo',
  "Destiny's Garden",
  'Garden Of Dreams',
  'The Bliss',
  'Sunrise Event Center',
  'Other',
]

export default function Onboarding() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('idle')
  const [venueOther, setVenueOther] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('idle')

  const [form, setForm] = useState({
    person1_first_name: '',
    person1_last_name: '',
    person1_role: 'Bride',
    person1_email: '',
    person1_phone: '',
    person2_first_name: '',
    person2_last_name: '',
    person2_role: 'Groom',
    person2_email: '',
    person2_phone: '',
    wedding_date: '',
    venue: '',
    venue_other: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/portal/login'); return }
      setUser(session.user)

      // Check if user arrived via magic link / invite token
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const hashParams = new URLSearchParams(hash.replace('#', '?'))
      const linkType = hashParams.get('type')
      if (linkType === 'invite' || linkType === 'signup' || linkType === 'magiclink') {
        setNeedsPassword(true)
      }

      // Load existing data and pre-fill form for editing
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (data?.person1_first_name) {
        const isOtherVenue = data.venue && !VENUES.slice(0, -1).includes(data.venue)
        setForm({
          person1_first_name: data.person1_first_name || '',
          person1_last_name: data.person1_last_name || '',
          person1_role: data.person1_role || 'Bride',
          person1_email: data.person1_email || '',
          person1_phone: data.person1_phone || '',
          person2_first_name: data.person2_first_name || '',
          person2_last_name: data.person2_last_name || '',
          person2_role: data.person2_role || 'Groom',
          person2_email: data.person2_email || '',
          person2_phone: data.person2_phone || '',
          wedding_date: data.wedding_date || '',
          venue: isOtherVenue ? 'Other' : data.venue || '',
          venue_other: isOtherVenue ? data.venue : '',
        })
        if (isOtherVenue) setVenueOther(true)
      }
    })
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'venue') setVenueOther(value === 'Other')
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please try again.')
      return
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters.')
      return
    }
    setPasswordStatus('loading')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      console.error(error)
      setPasswordStatus('error')
    } else {
      setPasswordStatus('success')
      setNeedsPassword(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')

    const venueValue = form.venue === 'Other' ? form.venue_other : form.venue
    // Fix timezone shift — use noon UTC so date doesn't roll back a day
    const weddingDate = form.wedding_date ? `${form.wedding_date}T12:00:00` : null

    // Check if a client row already exists for this user
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let error

    if (existing) {
      // Update existing row
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          person1_first_name: form.person1_first_name,
          person1_last_name: form.person1_last_name,
          person1_role: form.person1_role,
          person1_email: form.person1_email,
          person1_phone: form.person1_phone,
          person2_first_name: form.person2_first_name,
          person2_last_name: form.person2_last_name,
          person2_role: form.person2_role,
          person2_email: form.person2_email,
          person2_phone: form.person2_phone,
          wedding_date: weddingDate,
          venue: venueValue,
        })
        .eq('user_id', user.id)
      error = updateError
    } else {
      // Insert new row
      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          person1_first_name: form.person1_first_name,
          person1_last_name: form.person1_last_name,
          person1_role: form.person1_role,
          person1_email: form.person1_email,
          person1_phone: form.person1_phone,
          person2_first_name: form.person2_first_name,
          person2_last_name: form.person2_last_name,
          person2_role: form.person2_role,
          person2_email: form.person2_email,
          person2_phone: form.person2_phone,
          wedding_date: weddingDate,
          venue: venueValue,
        })
      error = insertError
    }

    if (error) {
      console.error(error)
      setStatus('error')
      return
    }

    setStatus('success')
    router.push('/portal/dashboard')
  }

  const InputClass = "w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
  const LabelClass = "block text-sm font-medium text-neutral-300 mb-1.5 ml-1"

  return (
    <>
      <Head>
        <title>Welcome — Tascosa Audio Client Portal</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-12">
        <div className="max-w-2xl mx-auto">

          {/* Password creation screen */}
          {needsPassword && (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="text-center mb-8">
                  <img src="/TA Logo.png" alt="Tascosa Audio" className="h-14 w-auto mx-auto object-contain mb-5" />
                  <h1 className="text-2xl font-extrabold">Create Your Password</h1>
                  <p className="text-neutral-400 mt-3 leading-relaxed text-sm">
                    Set a password so you can log back into your portal anytime.
                  </p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
                  <form onSubmit={handleSetPassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="At least 8 characters"
                        className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter your password"
                        className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
                      />
                    </div>
                    {passwordStatus === 'error' && (
                      <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
                    )}
                    <button
                      type="submit"
                      disabled={passwordStatus === 'loading'}
                      className="w-full rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-wider text-sm"
                    >
                      {passwordStatus === 'loading' ? 'Setting password...' : 'Set Password & Continue →'}
                    </button>
                  </form>
                </div>
                <p className="text-center text-xs text-neutral-600 mt-6">
                  Need help? <a href="tel:8066707913" className="text-tascosa-orange hover:underline">Call or text Andy at 806-670-7913</a>
                </p>
              </div>
            </div>
          )}

          {/* Main onboarding form — only shown after password is set */}
          {!needsPassword && (
          <div>

          {/* Header */}
          <div className="text-center mb-10">
            <img src="/TA Logo.png" alt="Tascosa Audio" className="h-14 w-auto mx-auto object-contain mb-5" />
            <h1 className="text-3xl font-extrabold">Your Information</h1>
            <p className="text-neutral-400 mt-3 leading-relaxed">
              Review and update your details below. Any changes you make will be saved immediately.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Person 1 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                <h2 className="text-lg font-bold">Person 1</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className={LabelClass}>Role</label>
                  <select name="person1_role" value={form.person1_role} onChange={handleChange} className={InputClass + ' appearance-none cursor-pointer'}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LabelClass}>First Name</label>
                    <input name="person1_first_name" value={form.person1_first_name} onChange={handleChange} required placeholder="First name" className={InputClass} />
                  </div>
                  <div>
                    <label className={LabelClass}>Last Name</label>
                    <input name="person1_last_name" value={form.person1_last_name} onChange={handleChange} required placeholder="Last name" className={InputClass} />
                  </div>
                </div>
                <div>
                  <label className={LabelClass}>Email Address</label>
                  <input name="person1_email" type="email" value={form.person1_email} onChange={handleChange} required placeholder="email@example.com" className={InputClass} />
                </div>
                <div>
                  <label className={LabelClass}>Phone Number</label>
                  <input name="person1_phone" type="tel" value={form.person1_phone} onChange={handleChange} required placeholder="806-555-0123" className={InputClass} />
                </div>
              </div>
            </div>

            {/* Person 2 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                <h2 className="text-lg font-bold">Person 2</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className={LabelClass}>Role</label>
                  <select name="person2_role" value={form.person2_role} onChange={handleChange} className={InputClass + ' appearance-none cursor-pointer'}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LabelClass}>First Name</label>
                    <input name="person2_first_name" value={form.person2_first_name} onChange={handleChange} required placeholder="First name" className={InputClass} />
                  </div>
                  <div>
                    <label className={LabelClass}>Last Name</label>
                    <input name="person2_last_name" value={form.person2_last_name} onChange={handleChange} required placeholder="Last name" className={InputClass} />
                  </div>
                </div>
                <div>
                  <label className={LabelClass}>Email Address</label>
                  <input name="person2_email" type="email" value={form.person2_email} onChange={handleChange} required placeholder="email@example.com" className={InputClass} />
                </div>
                <div>
                  <label className={LabelClass}>Phone Number</label>
                  <input name="person2_phone" type="tel" value={form.person2_phone} onChange={handleChange} required placeholder="806-555-0123" className={InputClass} />
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-7">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
                <h2 className="text-lg font-bold">Event Details</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className={LabelClass}>Wedding Date</label>
                  <input name="wedding_date" type="date" value={form.wedding_date} onChange={handleChange} required className={InputClass + ' [color-scheme:dark]'} />
                </div>
                <div>
                  <label className={LabelClass}>Venue</label>
                  <select name="venue" value={form.venue} onChange={handleChange} required className={InputClass + ' appearance-none cursor-pointer'}>
                    <option value="">Select your venue...</option>
                    {VENUES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                {venueOther && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className={LabelClass}>Please enter your venue name</label>
                    <input name="venue_other" value={form.venue_other} onChange={handleChange} required placeholder="Venue name" className={InputClass} />
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {status === 'error' && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400 flex-none"></span>
                Something went wrong. Please try again or contact us at 806-670-7913.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="w-full rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-wider text-sm shadow-lg shadow-tascosa-orange/20"
            >
              {status === 'loading' ? 'Saving...' : status === 'success' ? 'Taking you to your dashboard...' : 'Save & Continue to Dashboard →'}
            </button>

          </form>

          <p className="text-center text-xs text-neutral-600 mt-8">
            Questions? Reach us at{' '}
            <a href="mailto:info@tascosaaudio.com" className="text-tascosa-orange hover:underline">info@tascosaaudio.com</a>
            {' '}or{' '}
            <a href="tel:8066707913" className="text-tascosa-orange hover:underline">806-670-7913</a>
          </p>

          </div>
          )}

        </div>
      </div>
    </>
  )
}

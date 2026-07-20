// FILE LOCATION: pages/portal/login.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Client portal login page
// Clients land here from their invite email link
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Head from 'next/head'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function PortalLogin() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // login | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  // If they're already logged in, redirect to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/portal/dashboard')
    })

    // Handle magic link / invite token from URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/portal/dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setStatus('error')
      setMessage('Incorrect email or password. Please try again.')
    } else {
      setStatus('success')
      router.push('/portal/dashboard')
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage('Account created! Redirecting to your dashboard...')
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/login`,
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage('Password reset email sent! Check your inbox.')
    }
  }

  return (
    <>
      <Head>
        <title>Client Portal — Tascosa Audio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/TA Logo.png" alt="Tascosa Audio" className="h-16 w-auto mx-auto object-contain mb-4" />
            <h1 className="text-2xl font-bold">Client Portal</h1>
            <p className="text-neutral-400 text-sm mt-1">
              {mode === 'login' && 'Sign in to access your wedding planning dashboard'}
              {mode === 'signup' && 'Create your account to get started'}
              {mode === 'reset' && 'Reset your password'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">

            <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleReset} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
                />
              </div>

              {/* Password — not shown on reset */}
              {mode !== 'reset' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
                  />
                </div>
              )}

              {/* Status message */}
              {message && (
                <p className={`text-sm font-medium flex items-center gap-2 ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                  <span className={`h-2 w-2 rounded-full flex-none ${status === 'error' ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                  {message}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-wider text-sm"
              >
                {status === 'loading'
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign In'
                  : mode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Email'}
              </button>

            </form>

            {/* Mode switchers */}
            <div className="mt-6 pt-6 border-t border-neutral-800 text-center space-y-3">
              {mode === 'login' && (
                <>
                  <button onClick={() => { setMode('reset'); setMessage('') }} className="text-sm text-neutral-400 hover:text-tascosa-orange transition-colors block w-full">
                    Forgot your password?
                  </button>
                  <button onClick={() => { setMode('signup'); setMessage('') }} className="text-sm text-neutral-400 hover:text-tascosa-orange transition-colors block w-full">
                    New client? Create your account
                  </button>
                </>
              )}
              {(mode === 'signup' || mode === 'reset') && (
                <button onClick={() => { setMode('login'); setMessage('') }} className="text-sm text-neutral-400 hover:text-tascosa-orange transition-colors">
                  ← Back to sign in
                </button>
              )}
            </div>

          </div>

          {/* Footer */}
          <p className="text-center text-xs text-neutral-600 mt-6">
            Need help? Contact us at{' '}
            <a href="mailto:info@tascosaaudio.com" className="text-tascosa-orange hover:underline">
              info@tascosaaudio.com
            </a>
          </p>

        </div>
      </div>
    </>
  )
}

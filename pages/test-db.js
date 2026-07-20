// FILE LOCATION: pages/test-db.js
// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY TEST PAGE — DELETE THIS FILE AFTER CONFIRMING CONNECTION WORKS
// Visit: https://www.tascosaaudio.com/test-db to run the test
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function TestDB() {
  const [status, setStatus] = useState('Testing connection...')
  const [tables, setTables] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const { error: e1 } = await supabase.from('clients').select('count').limit(1)
        if (e1) { setError(e1.message); setStatus('❌ clients table error'); return }

        const { error: e2 } = await supabase.from('invites').select('count').limit(1)
        if (e2) { setError(e2.message); setStatus('❌ invites table error'); return }

        const { error: e3 } = await supabase.from('wedding_planner').select('count').limit(1)
        if (e3) { setError(e3.message); setStatus('❌ wedding_planner table error'); return }

        setTables(['clients ✓', 'invites ✓', 'wedding_planner ✓'])
        setStatus('✅ Connected successfully!')
      } catch (err) {
        setError(err.message)
        setStatus('❌ Unexpected error')
      }
    }
    testConnection()
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#0f0f0f', color:'#f0ece4', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', padding:'2rem' }}>
      <div style={{ background:'#1a1a1a', border:'1px solid #333', borderRadius:'16px', padding:'2rem', maxWidth:'480px', width:'100%' }}>
        <h1 style={{ color:'#fb923c', marginBottom:'1rem', fontSize:'20px' }}>Tascosa Audio — Supabase Connection Test</h1>
        <div style={{ fontSize:'18px', fontWeight:'700', marginBottom:'1.5rem', color: status.includes('✅') ? '#4ade80' : status.includes('❌') ? '#f87171' : '#facc15' }}>
          {status}
        </div>
        {tables.length > 0 && (
          <div style={{ marginBottom:'1rem' }}>
            <p style={{ color:'#888', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px' }}>Tables verified:</p>
            {tables.map(t => <div key={t} style={{ color:'#4ade80', fontSize:'14px', marginBottom:'4px' }}>{t}</div>)}
          </div>
        )}
        {error && (
          <div style={{ background:'#2a1a1a', border:'1px solid #f87171', borderRadius:'8px', padding:'12px', fontSize:'13px', color:'#f87171', marginBottom:'1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        <div style={{ background:'#111', border:'1px solid #333', borderRadius:'8px', padding:'12px', fontSize:'12px', color:'#666', marginTop:'1rem' }}>
          ⚠️ Remember to delete <code style={{ color:'#fb923c' }}>pages/test-db.js</code> after confirming the connection works.
        </div>
      </div>
    </div>
  )
}

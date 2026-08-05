// FILE LOCATION: pages/api/delete-quote.js
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })
  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'Missing quote id' })

  const { error } = await supabaseAdmin
    .from('quotes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete quote error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}

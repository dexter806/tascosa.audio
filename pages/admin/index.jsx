Skip to content
dexter806
tascosa.audio
Repository navigation
Code
Issues
Pull requests
Actions
Projects
Wiki
Security and quality
Insights
Settings
tascosa.audio/pages/admin
/
index.jsx
in
main

Edit

Preview
Indent mode

Spaces
Indent size

2
Line wrap mode

No wrap
Editing index.jsx file contents
  1
  2
  3
  4
  5
  6
  7
  8
  9
 10
 11
 12
 13
 14
 15
 16
 17
 18
 19
 20
 21
 22
 23
 24
 25
 26
 27
 28
 29
 30
 31
 32
 33
 34
 35
 36
 37
 38
 39
 40
 41
 42
 43
 44
 45
 46
 47
 48
 49
 50
 51
 52
 53
 54
 55
 56
 57
 58
 59
 60
 61
 62
 63
 64
// FILE LOCATION: pages/admin/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Portal Dashboard — Tascosa Audio (Mobile Optimized)
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
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZnSg-uYwHIkH6JT6xXSWgA-WBpioUwYTwag0ihGab-Q7Ig21PJrljlMTlSism63VL/exec'

async function calendarSync(payload) {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('Calendar sync error:', err)
  }
}

function djColor(assignedTo) {
  if (assignedTo === 'Andy') return '6'
  if (assignedTo === 'Austin') return '3'
  if (assignedTo === 'Joe') return '4'
  if (assignedTo === 'Danny') return '5'
  return '6'
}
const TEAM = ['Andy', 'Austin', 'Joe', 'Danny']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00'
  const event = new Date(d)
  event.setHours(0, 0, 0, 0)
  return Math.round((event - today) / (1000 * 60 * 60 * 24))
}

const HoldRow = ({ hold, onDelete }) => {
  const days = Math.ceil((new Date(hold.event_date + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))
  const formattedDate = new Date(hold.event_date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
 

#!/usr/bin/env tsx
/**
 * CastWA — Sync alert data to Supabase
 *
 * Usage:
 *   npm run sync-alerts
 *   # or directly:
 *   npx tsx scripts/sync-alerts-to-supabase.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment (from .env.local).
 * Reads NEXT_PUBLIC_SUPABASE_URL from .env.local as well.
 *
 * Run this whenever you update DAILY_UPDATES, EMERGENCY_ALERTS, or
 * REGULATIONS in their lib/*.ts files to push those changes live
 * WITHOUT requiring a new app build.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

import { DAILY_UPDATES } from '../lib/daily-updates'
import { EMERGENCY_ALERTS } from '../lib/emergency-alerts'
import { REGULATIONS } from '../lib/regulations-live-data'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function syncDailyUpdates() {
  const rows = DAILY_UPDATES.map(u => ({
    id:             u.id,
    category:       u.category,
    priority:       u.priority,
    icon:           u.icon,
    featured_label: u.featuredLabel,
    featured:       u.featured,
    headline:       u.headline,
    subtext:        u.subtext,
    detail:         u.detail,
    active_from:    u.activeFrom,
    active_to:      u.activeTo ?? null,
    wdfw_url:       u.wdfw_url,
  }))

  const { error } = await sb
    .from('daily_updates')
    .upsert(rows, { onConflict: 'id' })

  if (error) throw new Error(`daily_updates: ${error.message}`)
  console.log(`  ✅ daily_updates: upserted ${rows.length} rows`)
}

async function syncEmergencyAlerts() {
  const rows = EMERGENCY_ALERTS.map(a => ({
    id:          a.id,
    type:        a.type,
    species:     a.species,
    water_body:  a.waterBody,
    description: a.description,
    active_from: a.activeFrom,
    active_to:   a.activeTo ?? null,
    wdfw_url:    a.wdfw_url,
  }))

  const { error } = await sb
    .from('emergency_alerts')
    .upsert(rows, { onConflict: 'id' })

  if (error) throw new Error(`emergency_alerts: ${error.message}`)
  console.log(`  ✅ emergency_alerts: upserted ${rows.length} rows`)
}

async function syncRegulations() {
  const rows = REGULATIONS.map(r => ({
    id:             r.id,
    title:          r.title,
    body:           r.body,
    severity:       r.severity,
    waters:         r.waters,
    species:        r.species,
    effective_date: r.effectiveDate,
    expires_date:   r.expiresDate ?? null,
    source:         r.source,
    is_emergency:   r.isEmergency,
    rule_ref:       r.ruleRef ?? null,
  }))

  const { error } = await sb
    .from('regulations_live')
    .upsert(rows, { onConflict: 'id' })

  if (error) throw new Error(`regulations_live: ${error.message}`)
  console.log(`  ✅ regulations_live: upserted ${rows.length} rows`)
}

async function main() {
  console.log('🔄 CastWA: Syncing alert data to Supabase...')
  console.log(`   Project: ${SUPABASE_URL}`)
  console.log()

  try {
    await syncDailyUpdates()
    await syncEmergencyAlerts()
    await syncRegulations()
    console.log()
    console.log('✅ Sync complete. Live data updated — no app build required.')
    console.log('   New alerts are available to all clients immediately.')
  } catch (err) {
    console.error('❌ Sync failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()

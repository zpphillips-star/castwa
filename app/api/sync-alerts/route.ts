/**
 * POST /api/sync-alerts
 *
 * Admin endpoint that upserts current DAILY_UPDATES + EMERGENCY_ALERTS
 * into Supabase so that new alert content becomes live without a build.
 *
 * Authentication: requires the SUPABASE_SERVICE_ROLE_KEY to be passed
 * in the Authorization header as "Bearer <key>".
 *
 * Called by:
 *  • scripts/sync-alerts-to-supabase.ts (manual / CI)
 *  • GitHub Actions cron / Vercel cron job for nightly sync
 *
 * Security: this route is server-only (app/api). The service role key
 * is NEVER sent to the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DAILY_UPDATES } from '@/lib/daily-updates'
import { EMERGENCY_ALERTS } from '@/lib/emergency-alerts'
import { REGULATIONS } from '@/lib/regulations-live-data'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === SERVICE_ROLE_KEY
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = adminClient()

  // ── 1. Upsert daily_updates ────────────────────────────────────────────────
  const dailyRows = DAILY_UPDATES.map(u => ({
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

  const { error: duErr } = await sb
    .from('daily_updates')
    .upsert(dailyRows, { onConflict: 'id' })

  if (duErr) {
    console.error('[sync-alerts] daily_updates upsert error:', duErr)
    return NextResponse.json({ error: duErr.message }, { status: 500 })
  }

  // ── 2. Upsert emergency_alerts ─────────────────────────────────────────────
  const alertRows = EMERGENCY_ALERTS.map(a => ({
    id:          a.id,
    type:        a.type,
    species:     a.species,
    water_body:  a.waterBody,
    description: a.description,
    active_from: a.activeFrom,
    active_to:   a.activeTo ?? null,
    wdfw_url:    a.wdfw_url,
  }))

  const { error: eaErr } = await sb
    .from('emergency_alerts')
    .upsert(alertRows, { onConflict: 'id' })

  if (eaErr) {
    console.error('[sync-alerts] emergency_alerts upsert error:', eaErr)
    return NextResponse.json({ error: eaErr.message }, { status: 500 })
  }

  // ── 3. Upsert regulations_live ─────────────────────────────────────────────
  const regRows = REGULATIONS.map(r => ({
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

  const { error: regErr } = await sb
    .from('regulations_live')
    .upsert(regRows, { onConflict: 'id' })

  if (regErr) {
    console.error('[sync-alerts] regulations_live upsert error:', regErr)
    return NextResponse.json({ error: regErr.message }, { status: 500 })
  }

  const result = {
    ok: true,
    synced: {
      daily_updates:    dailyRows.length,
      emergency_alerts: alertRows.length,
      regulations_live: regRows.length,
    },
    syncedAt: new Date().toISOString(),
  }

  console.log('[sync-alerts] sync complete:', result)
  return NextResponse.json(result)
}

/**
 * CastWA Live Alerts — Supabase-backed fetch with static fallback
 *
 * Fetches daily_updates and emergency_alerts from Supabase so new alert
 * data does NOT require an app rebuild.  Falls back gracefully to the
 * bundled static arrays when Supabase is unreachable or returns nothing.
 *
 * Architecture:
 *  • Supabase anon key (read-only, RLS-protected) — safe in client code.
 *  • Writes only via service_role key in sync scripts / API routes.
 *  • Last-updated timestamp surfaced to UI from Supabase row updated_at.
 */

import { supabase } from './supabase'
import { DAILY_UPDATES, type DailyUpdate } from './daily-updates'
import { EMERGENCY_ALERTS, type EmergencyAlert } from './emergency-alerts'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveAlertsResult {
  dailyUpdates: DailyUpdate[]
  emergencyAlerts: EmergencyAlert[]
  /** ISO string of the most recently updated row, or null if from static. */
  lastUpdated: string | null
  /** true = data came from Supabase; false = static bundled fallback */
  fromSupabase: boolean
}

// ─── Supabase row → app type mappers ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDailyUpdate(row: any): DailyUpdate {
  return {
    id:             row.id,
    category:       row.category,
    priority:       row.priority,
    icon:           row.icon,
    featuredLabel:  row.featured_label,
    featured:       row.featured,
    headline:       row.headline,
    subtext:        row.subtext ?? '',
    detail:         row.detail,
    activeFrom:     row.active_from,
    activeTo:       row.active_to ?? null,
    wdfw_url:       row.wdfw_url,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEmergencyAlert(row: any): EmergencyAlert {
  return {
    id:          row.id,
    type:        row.type,
    species:     row.species,
    waterBody:   row.water_body,
    description: row.description,
    activeFrom:  row.active_from,
    activeTo:    row.active_to ?? null,
    wdfw_url:    row.wdfw_url,
  }
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

/**
 * Fetch live alert data from Supabase.
 * On error or empty result, silently returns the bundled static data so the
 * app always has something to show.
 */
export async function fetchLiveAlerts(): Promise<LiveAlertsResult> {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const [duRes, eaRes] = await Promise.all([
      supabase
        .from('daily_updates')
        .select('*')
        .lte('active_from', today)
        .or(`active_to.is.null,active_to.gte.${today}`)
        .order('priority', { ascending: true })
        .order('active_from', { ascending: false }),

      supabase
        .from('emergency_alerts')
        .select('*')
        .lte('active_from', today)
        .or(`active_to.is.null,active_to.gte.${today}`)
        .order('active_from', { ascending: false }),
    ])

    if (duRes.error) throw duRes.error
    if (eaRes.error) throw eaRes.error

    const duRows  = duRes.data  ?? []
    const eaRows  = eaRes.data  ?? []

    // If Supabase returned no rows at all, fall through to static
    if (duRows.length === 0 && eaRows.length === 0) {
      return staticFallback()
    }

    // Pick the most recent updated_at across all rows for the "last updated" label
    const allUpdatedAts = [...duRows, ...eaRows]
      .map(r => r.updated_at as string)
      .filter(Boolean)
      .sort()
      .reverse()
    const lastUpdated = allUpdatedAts[0] ?? null

    return {
      dailyUpdates:    duRows.map(rowToDailyUpdate),
      emergencyAlerts: eaRows.map(rowToEmergencyAlert),
      lastUpdated,
      fromSupabase: true,
    }
  } catch (err) {
    console.warn('[CastWA] live-alerts: Supabase fetch failed, using static data', err)
    return staticFallback()
  }
}

function staticFallback(): LiveAlertsResult {
  return {
    dailyUpdates:    DAILY_UPDATES,
    emergencyAlerts: EMERGENCY_ALERTS,
    lastUpdated:     null,
    fromSupabase:    false,
  }
}

// ─── Formatted last-updated label ─────────────────────────────────────────────

/** Returns a human-friendly label like "Updated 3 min ago" or null. */
export function formatLastUpdated(isoString: string | null): string | null {
  if (!isoString) return null
  const diffMs  = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 2)   return 'Updated just now'
  if (diffMin < 60)  return `Updated ${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)   return `Updated ${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `Updated ${diffDay}d ago`
}

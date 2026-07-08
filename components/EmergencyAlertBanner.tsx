'use client'

import { useState, useEffect } from 'react'
import { getActiveAlerts, EmergencyAlert, AlertType } from '@/lib/emergency-alerts'

const TYPE_STYLE: Record<AlertType, { bg: string; border: string; badge: string; badgeBg: string; icon: string }> = {
  OPEN:     { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.3)',  badge: '#22c55e', badgeBg: 'rgba(34,197,94,0.15)',  icon: '🟢' },
  CLOSED:   { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  badge: '#ef4444', badgeBg: 'rgba(239,68,68,0.15)',  icon: '🔴' },
  MODIFIED: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', badge: '#f59e0b', badgeBg: 'rgba(245,158,11,0.15)', icon: '🟡' },
}

function AlertCard({ alert }: { alert: EmergencyAlert }) {
  const s = TYPE_STYLE[alert.type]
  const dateRange = alert.activeTo
    ? `${fmtDate(alert.activeFrom)} – ${fmtDate(alert.activeTo)}`
    : `From ${fmtDate(alert.activeFrom)}`
  return (
    <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(245,158,11,0.15)' }}>
      <div className="flex items-start gap-2">
        <span className="text-sm mt-0.5 flex-shrink-0">{s.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: s.badgeBg, color: s.badge }}>
              {alert.type}
            </span>
            <span className="text-xs font-bold text-white">{alert.species}</span>
          </div>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#fde68a' }}>
            {alert.waterBody}
          </p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#d1d5db' }}>
            {alert.description}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px]" style={{ color: '#9ca3af' }}>{dateRange}</span>
            <a
              href={alert.wdfw_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold"
              style={{ color: '#f59e0b' }}
            >
              WDFW ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`
}

const DISMISS_KEY = 'castwa_emergency_dismissed'

export default function EmergencyAlertBanner() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(true) // start dismissed to avoid flash

  useEffect(() => {
    const active = getActiveAlerts(new Date())
    setAlerts(active)
    if (active.length === 0) return

    // Check if user dismissed this specific set of alerts
    try {
      const stored = localStorage.getItem(DISMISS_KEY)
      if (stored) {
        const { ids, date } = JSON.parse(stored) as { ids: string[]; date: string }
        const today = new Date().toISOString().slice(0, 10)
        const activeIds = active.map(a => a.id).sort().join(',')
        const storedIds = ids.sort().join(',')
        // Re-show if alerts changed or it's a new day
        if (activeIds === storedIds && date === today) {
          setDismissed(true)
          return
        }
      }
    } catch {
      // ignore localStorage errors
    }
    setDismissed(false)
  }, [])

  if (dismissed || alerts.length === 0) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify({
        ids: alerts.map(a => a.id),
        date: new Date().toISOString().slice(0, 10),
      }))
    } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <div className="mb-3 rounded-xl overflow-hidden" style={{
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.35)',
    }}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-sm flex-shrink-0">⚠️</span>
        <button
          className="flex-1 flex items-center gap-1 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <span className="text-xs font-black tracking-wide" style={{ color: '#f59e0b' }}>
            WDFW EMERGENCY RULE
          </span>
          <span className="text-xs" style={{ color: '#f59e0b' }}>
            — {alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'} {expanded ? '▲' : '▼'}
          </span>
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Alert cards (shown when expanded) */}
      {expanded && alerts.map(a => <AlertCard key={a.id} alert={a} />)}

      {/* Collapsed preview */}
      {!expanded && (
        <div className="px-3 pb-2">
          <p className="text-[11px] leading-snug" style={{ color: '#fde68a' }}>
            {alerts[0].species} · {alerts[0].waterBody} · <span style={{ color: '#f59e0b' }}>{alerts[0].type}</span>
            {alerts.length > 1 ? ` + ${alerts.length - 1} more` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

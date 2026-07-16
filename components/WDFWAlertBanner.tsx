'use client'

import { useEffect, useState } from 'react'

interface WDFWAlert {
  title: string
  link: string
  pubDate: string
  isFishingRelated: boolean
}

interface AlertsResponse {
  alerts: WDFWAlert[]
  error?: string
  fallbackMessage?: string
  fetchedAt?: number
  sourceUrl: string
}

export default function WDFWAlertBanner() {
  const [data, setData] = useState<AlertsResponse | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wdfw-alerts')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Only render if there are actual emergency alerts — no banner when nothing is happening
  if (loading || !data || !data.alerts.length) return null

  return (
    <div className="mb-3">
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.3)' }}
      >
        <button
          className="w-full flex items-center gap-2 px-3 py-2 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-sm">🚨</span>
          <span className="flex-1 text-xs font-semibold" style={{ color: 'var(--live)' }}>
            {data.alerts.length} WDFW Emergency Closure{data.alerts.length > 1 ? 's' : ''} — tap to view
          </span>
          <span className="text-xs" style={{ color: 'var(--live)' }}>{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: '1px solid rgba(220,38,38,0.2)' }}>
            {data.alerts.slice(0, 5).map((alert, i) => (
              <a
                key={i}
                href={alert.link || 'https://wdfw.wa.gov/fishing/regulations'}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs pt-1.5"
                style={{ color: 'var(--live-soft)', textDecoration: 'none' }}
              >
                → {alert.title}
              </a>
            ))}
            {data.alerts.length > 5 && (
              <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
                className="block text-xs" style={{ color: 'var(--live)' }}>
                + {data.alerts.length - 5} more at wdfw.wa.gov ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

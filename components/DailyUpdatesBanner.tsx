'use client'
import { useState } from 'react'
import { DailyUpdate, UpdatePriority } from '@/lib/daily-updates'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<UpdatePriority, string> = {
  alert:     'var(--live)',
  highlight: 'var(--amber)',
  info:      'var(--status-open-bright)',
}

const PRIORITY_BG: Record<UpdatePriority, string> = {
  alert:     'rgba(239,68,68,0.12)',
  highlight: 'rgba(245,158,11,0.12)',
  info:      'rgba(34,197,94,0.10)',
}

const PRIORITY_LABEL: Record<UpdatePriority, string> = {
  alert:     'ALERT',
  highlight: 'UPDATE',
  info:      'INFO',
}

const CATEGORY_LABEL: Record<DailyUpdate['category'], string> = {
  'halibut':           'Halibut',
  'salmon-marine':     'Marine Salmon',
  'salmon-freshwater': 'River Salmon',
  'shrimp':            'Shrimp',
  'crab':              'Crab',
  'biotoxin':          'Biotoxin / Shellfish',
  'freshwater':        'Freshwater',
  'general':           'General',
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── EXPANDED ITEM CARD ───────────────────────────────────────────────────────

function UpdateCard({ update, isLast }: { update: DailyUpdate; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const color = PRIORITY_COLOR[update.priority]
  const bg    = PRIORITY_BG[update.priority]

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* Row — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 transition-opacity active:opacity-70"
        style={{ cursor: 'pointer' }}
      >
        {/* Left accent bar */}
        <div
          className="flex-shrink-0 mt-0.5"
          style={{ width: 3, borderRadius: 2, background: color, alignSelf: 'stretch', minHeight: 20 }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Priority + Category tags */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: bg, color }}
            >
              {PRIORITY_LABEL[update.priority]}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-faint)' }}>
              {CATEGORY_LABEL[update.category]}
            </span>
          </div>

          {/* Headline */}
          <p className="text-sm font-bold text-[var(--text)] leading-snug">{update.headline}</p>

          {/* Subtext */}
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--amber)' }}>
            {update.subtext}
          </p>

          {/* Date range */}
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
            {fmtDate(update.activeFrom)}
            {update.activeTo ? ` – ${fmtDate(update.activeTo)}` : ' – until further notice'}
          </p>
        </div>

        {/* Expand chevron */}
        <span
          className="flex-shrink-0 text-sm transition-transform duration-200"
          style={{
            color: 'var(--text-faint)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ›
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Detail text — preserve line breaks */}
          <p
            className="text-xs leading-relaxed whitespace-pre-line"
            style={{ color: 'var(--text-muted)' }}
          >
            {update.detail}
          </p>

          {/* Official rule link */}
          <a
            href={update.wdfw_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold no-underline"
            style={{ color: 'var(--amber)', textDecoration: 'none' }}
          >
            Official WDFW rule ↗
          </a>
        </div>
      )}
    </div>
  )
}

// ─── MAIN EXPORTED COMPONENT ──────────────────────────────────────────────────

interface DailyUpdatesBannerProps {
  updates: DailyUpdate[]
  date: Date
  newCount?: number
}

export default function DailyUpdatesBanner({
  updates,
  date,
  newCount = 0,
}: DailyUpdatesBannerProps) {
  const [open, setOpen] = useState(false)

  const alertCount = updates.filter(u => u.priority === 'alert').length

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // Banner right-side status copy
  const bannerStatus =
    updates.length === 0
      ? 'No updates'
      : alertCount > 0
      ? `${alertCount} alert${alertCount > 1 ? 's' : ''}`
      : `${updates.length} update${updates.length > 1 ? 's' : ''}`

  const bannerColor =
    alertCount > 0 ? 'var(--live-soft)' : 'var(--amber)'

  const chevronColor =
    alertCount > 0 ? 'var(--live)' : 'var(--amber)'

  return (
    <>
      {/* ── Banner button ── */}
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-xl transition-all active:scale-[0.99] flex items-center gap-4"
        style={{
          background: 'var(--surface-overlay)',
          border: `1px solid ${alertCount > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
          cursor: 'pointer',
          minHeight: 56,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* Icon + label */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span style={{ fontSize: 18 }}>📰</span>
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-base font-bold text-[var(--text)]">Daily Updates</p>
            {newCount > 0 && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--live)', color: '#fff', lineHeight: 1.4 }}
              >
                NEW
              </span>
            )}
          </div>
        </div>

        {/* Status + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold" style={{ color: bannerColor }}>
            {bannerStatus}
          </span>
          <span className="text-lg font-light" style={{ color: chevronColor, opacity: 0.8 }}>
            ›
          </span>
        </div>
      </button>

      {/* ── Bottom sheet modal ── */}
      {open && (
        <div
          className="fixed inset-0 flex flex-col justify-end"
          style={{ zIndex: 1200, background: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
            style={{ background: 'var(--photo-bg)', maxHeight: '88dvh' }}
          >
            {/* Handle + header */}
            <div
              className="flex-shrink-0 px-4 pt-3 pb-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div
                className="w-8 h-1 rounded-full mx-auto mb-3"
                style={{ background: 'var(--text-20)' }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 20 }}>📰</span>
                    <p className="text-base font-black text-[var(--text)]">Daily Updates</p>
                    {newCount > 0 && (
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--live)', color: '#fff', lineHeight: 1.4 }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {dateLabel} · {updates.length} statewide update{updates.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--border)' }}
                >
                  <svg
                    className="w-4 h-4 text-[var(--text)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
            >
              {updates.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.3)',
                    }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: 'var(--status-open-bright)' }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-[var(--text)]">All quiet today</p>
                  <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                    No active statewide updates — check back tomorrow.
                  </p>
                </div>
              ) : (
                <>
                  {/* Updates list — grouped visually */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    {updates.map((update, i) => (
                      <UpdateCard
                        key={update.id}
                        update={update}
                        isLast={i === updates.length - 1}
                      />
                    ))}
                  </div>

                  {/* Disclaimer */}
                  <p
                    className="text-[10px] text-center leading-relaxed"
                    style={{ color: 'var(--text-faint)' }}
                  >
                    Updates are based on active WDFW emergency rules and published season data.
                    Always verify regulations at{' '}
                    <a
                      href="https://wdfw.wa.gov/fishing/regulations"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      wdfw.wa.gov
                    </a>{' '}
                    before fishing.
                  </p>
                </>
              )}

              {/* Footer CTA */}
              <a
                href="https://wdfw.wa.gov/fishing/regulations/emergency"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl no-underline"
                style={{
                  background: 'rgba(242,101,34,0.08)',
                  border: '1px solid rgba(242,101,34,0.2)',
                  textDecoration: 'none',
                }}
              >
                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  All WDFW emergency rules →
                </span>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  wdfw.wa.gov
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

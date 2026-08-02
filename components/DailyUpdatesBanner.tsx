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
  alert:     'rgba(239,68,68,0.14)',
  highlight: 'rgba(245,158,11,0.13)',
  info:      'rgba(34,197,94,0.11)',
}

const PRIORITY_BORDER: Record<UpdatePriority, string> = {
  alert:     'rgba(239,68,68,0.28)',
  highlight: 'rgba(245,158,11,0.28)',
  info:      'rgba(34,197,94,0.22)',
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

function dateRangeLabel(update: DailyUpdate): string {
  const from = fmtDate(update.activeFrom)
  if (!update.activeTo) return `${from} – until further notice`
  return `${from} – ${fmtDate(update.activeTo)}`
}

// ─── FEATURED UPDATE CARD ─────────────────────────────────────────────────────

function FeaturedCard({ update }: { update: DailyUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const color  = PRIORITY_COLOR[update.priority]
  const bg     = PRIORITY_BG[update.priority]
  const border = PRIORITY_BORDER[update.priority]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: `1px solid ${border}` }}
    >
      {/* ── Colored hero strip ── */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: bg, borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 17, lineHeight: 1 }}>{update.icon}</span>
          <span
            className="text-[11px] font-black tracking-widest uppercase"
            style={{ color }}
          >
            {update.featuredLabel}
          </span>
        </div>
        <span
          className="text-[10px] font-semibold"
          style={{ color: 'var(--text-faint)' }}
        >
          {CATEGORY_LABEL[update.category]}
        </span>
      </div>

      {/* ── Card body ── */}
      <div className="px-4 pt-2.5 pb-2.5">
        {/* Headline */}
        <p className="text-[14px] font-black leading-snug text-[var(--text)]">
          {update.headline}
        </p>

        {/* One-sentence summary — always visible */}
        <p
          className="text-[12px] font-medium mt-1 leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          {update.subtext}
        </p>

        {/* Expand / collapse detail toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 mt-2 text-[11px] font-bold transition-opacity active:opacity-60"
          style={{ color, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <span>{expanded ? 'Hide details' : 'Details + dates'}</span>
          <span
            className="text-sm transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
          >
            ›
          </span>
        </button>

        {/* Expanded detail block */}
        {expanded && (
          <div
            className="mt-2.5 pt-2.5"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {/* Date range inside expanded */}
            <p
              className="text-[11px] mb-2 font-semibold"
              style={{ color: 'var(--text-faint)' }}
            >
              📅 {dateRangeLabel(update)}
            </p>
            <p
              className="text-[12px] leading-relaxed whitespace-pre-line"
              style={{ color: 'var(--text-muted)' }}
            >
              {update.detail}
            </p>
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

  // Top update for banner preview
  const topUpdate = updates[0]

  // Banner right-side status copy
  const bannerStatus =
    updates.length === 0
      ? 'No updates'
      : alertCount > 0
      ? `${alertCount} alert${alertCount > 1 ? 's' : ''}`
      : `${updates.length} update${updates.length > 1 ? 's' : ''}`

  const bannerColor  = alertCount > 0 ? 'var(--live-soft)' : 'var(--amber)'
  const chevronColor = alertCount > 0 ? 'var(--live)'      : 'var(--amber)'
  const borderColor  = alertCount > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)'

  return (
    <>
      {/* ── Banner button ── */}
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-xl transition-all active:scale-[0.99]"
        style={{
          background: 'var(--surface-overlay)',
          border: `1px solid ${borderColor}`,
          cursor: 'pointer',
          padding: '12px 20px',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon + label row */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span style={{ fontSize: 18, flexShrink: 0 }}>📰</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
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
              {/* Tease the top update headline if available */}
              {topUpdate && (
                <p
                  className="text-[11px] font-semibold mt-0.5 truncate"
                  style={{ color: PRIORITY_COLOR[topUpdate.priority] }}
                >
                  {topUpdate.featuredLabel}: {topUpdate.headline}
                </p>
              )}
            </div>
          </div>

          {/* Status + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold" style={{ color: bannerColor }}>
              {bannerStatus}
            </span>
            <span className="text-lg font-light" style={{ color: chevronColor, opacity: 0.8 }}>›</span>
          </div>
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
            {/* ── Handle + header ── */}
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
                    {dateLabel} · {updates.length} featured update{updates.length !== 1 ? 's' : ''}
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

            {/* ── Scrollable content ── */}
            <div
              className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-3"
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
                    No major statewide updates — check back tomorrow.
                  </p>
                </div>
              ) : (
                <>
                  {/* Featured update cards — individual cards, not grouped list */}
                  {updates.map(update => (
                    <FeaturedCard key={update.id} update={update} />
                  ))}

                  {/* Disclaimer */}
                  <p
                    className="text-[10px] text-center leading-relaxed pt-1"
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

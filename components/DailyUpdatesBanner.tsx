'use client'
import { useState } from 'react'
import { DailyUpdate, UpdatePriority } from '@/lib/daily-updates'

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<DailyUpdate['category'], string> = {
  'halibut':           'Halibut',
  'salmon-marine':     'Marine Salmon',
  'salmon-freshwater': 'River Salmon',
  'shrimp':            'Shrimp',
  'crab':              'Crab',
  'biotoxin':          'Biotoxin',
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

// ─── CHIP BADGE ───────────────────────────────────────────────────────────────

type ChipColors = { bg: string; color: string; border: string }

function getChipColors(update: DailyUpdate): ChipColors {
  const lbl = update.featuredLabel.toLowerCase()
  if (lbl.includes('today') || lbl === 'opens today')
    return { bg: 'rgba(74,222,128,0.18)', color: '#4ade80',  border: 'rgba(74,222,128,0.32)' }
  if (lbl.includes('closure') || lbl.includes('closed') || update.category === 'biotoxin')
    return { bg: 'rgba(239,68,68,0.16)',  color: '#f87171',  border: 'rgba(239,68,68,0.32)' }
  if (lbl.includes('reopen'))
    return { bg: 'rgba(245,158,11,0.16)', color: '#fbbf24',  border: 'rgba(245,158,11,0.32)' }
  if (update.priority === 'alert')
    return { bg: 'rgba(239,68,68,0.16)',  color: '#f87171',  border: 'rgba(239,68,68,0.32)' }
  if (update.priority === 'highlight')
    return { bg: 'rgba(245,158,11,0.16)', color: '#fbbf24',  border: 'rgba(245,158,11,0.32)' }
  // info / season open
  return   { bg: 'rgba(74,222,128,0.14)', color: '#86efac',  border: 'rgba(74,222,128,0.26)' }
}

function ChipBadge({ update, size = 'sm' }: { update: DailyUpdate; size?: 'sm' | 'xs' }) {
  const c = getChipColors(update)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 100,
        padding: size === 'xs' ? '2px 8px' : '3px 10px',
        fontSize: size === 'xs' ? 9 : 10,
        fontWeight: 900,
        letterSpacing: '0.07em',
        textTransform: 'uppercase' as const,
        color: c.color,
        whiteSpace: 'nowrap' as const,
      }}
    >
      <span
        style={{
          width: size === 'xs' ? 4 : 5,
          height: size === 'xs' ? 4 : 5,
          borderRadius: '50%',
          background: c.color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {update.featuredLabel}
    </span>
  )
}

// ─── ICON CIRCLE ──────────────────────────────────────────────────────────────

function IconCircle({ update }: { update: DailyUpdate }) {
  const c = getChipColors(update)
  return (
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: '50%',
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 22,
      }}
    >
      {update.icon}
    </div>
  )
}

// ─── FEATURED UPDATE CARD (sheet) ─────────────────────────────────────────────

function FeaturedCard({ update }: { update: DailyUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const c = getChipColors(update)

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${c.border}`,
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      {/* ── Card body ── */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* Icon circle */}
          <IconCircle update={update} />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge + category row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <ChipBadge update={update} />
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text-faint)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
                {CATEGORY_LABEL[update.category]}
              </span>
            </div>

            {/* Headline */}
            <p
              style={{
                fontSize: 14,
                fontWeight: 900,
                marginTop: 7,
                color: 'var(--text)',
                lineHeight: 1.35,
              }}
            >
              {update.headline}
            </p>

            {/* Subtext */}
            <p
              style={{
                fontSize: 12,
                marginTop: 4,
                color: 'var(--text-muted)',
                lineHeight: 1.4,
              }}
            >
              {update.subtext}
            </p>
          </div>
        </div>

        {/* Expand / collapse toggle */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 800,
              color: c.color,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            <span>{expanded ? 'Hide details' : 'Details + dates'}</span>
            <span
              style={{
                fontSize: 14,
                display: 'inline-block',
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              ›
            </span>
          </button>
        </div>

        {/* Expanded detail block */}
        {expanded && (
          <div style={{ marginTop: 12 }}>
            <p
              style={{
                fontSize: 11,
                marginBottom: 8,
                fontWeight: 700,
                color: 'var(--text-faint)',
              }}
            >
              📅 {dateRangeLabel(update)}
            </p>
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.65,
                color: 'var(--text-muted)',
                whiteSpace: 'pre-line',
              }}
            >
              {update.detail}
            </p>
            <a
              href={update.wdfw_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 12,
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--amber)',
                textDecoration: 'none',
              }}
            >
              Official WDFW source ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BANNER ENTRY MODULE ──────────────────────────────────────────────────────

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

  const alertCount  = updates.filter(u => u.priority === 'alert').length
  const topUpdate   = updates[0]
  const restUpdates = updates.slice(1, 4)     // up to 3 mini chips in footer

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  })

  const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const hasAlerts   = alertCount > 0
  const moduleBorder = hasAlerts ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.10)'

  return (
    <>
      {/* ── Module card (banner entry) ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: `1px solid ${moduleBorder}`,
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        {/* ── Module header strip ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15 }}>📰</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              Daily Briefing
            </span>
            {newCount > 0 && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: 100,
                  background: 'var(--live)',
                  color: '#fff',
                  letterSpacing: '0.04em',
                }}
              >
                NEW
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>
            {shortDate}
          </span>
        </div>

        {/* ── Hero top update ── */}
        {updates.length === 0 ? (
          <div
            style={{
              padding: '20px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(74,222,128,0.12)',
                border: '1.5px solid rgba(74,222,128,0.26)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              ✓
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>
                All quiet today
              </p>
              <p style={{ fontSize: 12, marginTop: 2, color: 'var(--text-muted)' }}>
                No major statewide updates
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'block',
            }}
          >
            {/* Chip badge */}
            {topUpdate && <ChipBadge update={topUpdate} />}

            {/* Headline */}
            {topUpdate && (
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  marginTop: 9,
                  color: 'var(--text)',
                  lineHeight: 1.3,
                }}
              >
                {topUpdate.headline}
              </p>
            )}

            {/* Subtext */}
            {topUpdate && (
              <p
                style={{
                  fontSize: 12,
                  marginTop: 5,
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}
              >
                {topUpdate.subtext}
              </p>
            )}
          </button>
        )}

        {/* ── Footer: mini chips for remaining + "See all" ── */}
        {updates.length > 1 && (
          <button
            onClick={() => setOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid var(--border)',
              cursor: 'pointer',
            } as React.CSSProperties}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {restUpdates.map(u => (
                <ChipBadge key={u.id} update={u} size="xs" />
              ))}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent)',
                whiteSpace: 'nowrap',
                marginLeft: 8,
              }}
            >
              See all {updates.length} →
            </span>
          </button>
        )}
      </div>

      {/* ── Bottom sheet modal ── */}
      {open && (
        <div
          className="fixed inset-0 flex flex-col justify-end animate-backdrop"
          style={{ zIndex: 1200, background: 'rgba(0,0,0,0.72)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
            style={{ background: 'var(--photo-bg)', maxHeight: '90dvh' }}
          >
            {/* ── Handle ── */}
            <div style={{ paddingTop: 10, paddingBottom: 0, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: 'var(--text-20)',
                }}
              />
            </div>

            {/* ── Sheet header ── */}
            <div
              style={{
                padding: '14px 20px 14px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Section label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--accent)',
                    }}
                  >
                    📰 Daily Briefing
                  </span>
                  {newCount > 0 && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: 100,
                        background: 'var(--live)',
                        color: '#fff',
                      }}
                    >
                      NEW
                    </span>
                  )}
                </div>
                {/* Large title */}
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: 'var(--text)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Daily Updates
                </h2>
                <p style={{ fontSize: 12, marginTop: 3, color: 'var(--text-muted)' }}>
                  {dateLabel} · {updates.length} featured {updates.length === 1 ? 'update' : 'updates'}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--surface-overlay)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Scrollable cards ── */}
            <div
              className="flex-1 overflow-y-auto no-scrollbar"
              style={{
                padding: '16px 16px',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {updates.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '40px 16px',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'rgba(74,222,128,0.12)',
                      border: '1.5px solid rgba(74,222,128,0.26)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    ✓
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>
                    All quiet today
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                    No major statewide updates — check back tomorrow.
                  </p>
                </div>
              ) : (
                <>
                  {updates.map(u => (
                    <FeaturedCard key={u.id} update={u} />
                  ))}

                  {/* Disclaimer */}
                  <p
                    style={{
                      fontSize: 10,
                      color: 'var(--text-faint)',
                      textAlign: 'center',
                      lineHeight: 1.6,
                      paddingTop: 4,
                    }}
                  >
                    Based on active WDFW emergency rules and published season data.
                    Always verify at{' '}
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.20)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>
                  All WDFW emergency rules →
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
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

'use client'
import { useState } from 'react'
import { DailyUpdate } from '@/lib/daily-updates'

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

// Species-specific accent emoji shown tastefully in detail views only
const CATEGORY_ACCENT: Partial<Record<DailyUpdate['category'], string>> = {
  'shrimp': '🦐',
  'crab':   '🦀',
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

// ─── COLOR HELPERS ────────────────────────────────────────────────────────────

function getAccentColor(update: DailyUpdate): string {
  const lbl = update.featuredLabel.toLowerCase()
  if (lbl.includes('today') || lbl.includes('opens today')) return '#4ade80'
  if (lbl.includes('closure') || lbl.includes('closed') || update.category === 'biotoxin') return '#f87171'
  if (lbl.includes('reopen')) return '#fbbf24'
  if (update.priority === 'alert')     return '#f87171'
  if (update.priority === 'highlight') return '#fbbf24'
  return '#86efac'
}

// ─── STATUS LABEL (text-only, no dot/border badge) ────────────────────────────

function StatusLabel({ update }: { update: DailyUpdate }) {
  const color = getAccentColor(update)
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.09em',
        textTransform: 'uppercase' as const,
        color,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {update.featuredLabel}
    </span>
  )
}

// ─── UPDATE DETAIL SHEET (second level) ───────────────────────────────────────

function UpdateDetailSheet({
  update,
  onClose,
}: {
  update: DailyUpdate
  onClose: () => void
}) {
  const accent  = getAccentColor(update)
  const speciesEmoji = CATEGORY_ACCENT[update.category]

  return (
    <div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex: 1300, background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--photo-bg)', maxHeight: '92dvh' }}
      >
        {/* Handle */}
        <div style={{ paddingTop: 10, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--text-20)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 0' }}>
          {/* Back nav */}
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 700,
              padding: 0,
              marginBottom: 18,
            }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Daily Updates
          </button>

          {/* Category row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusLabel update={update} />
              <span style={{
                fontSize: 10,
                color: 'var(--text-faint)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
              }}>
                {CATEGORY_LABEL[update.category]}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500 }}>
              {dateRangeLabel(update)}
            </span>
          </div>

          {/* Headline — species emoji only here if applicable */}
          <h2 style={{
            fontSize: 20,
            fontWeight: 900,
            color: 'var(--text)',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}>
            {speciesEmoji && (
              <span style={{ marginRight: 7, fontSize: 18 }}>{speciesEmoji}</span>
            )}
            {update.headline}
          </h2>

          {/* Subtext */}
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: 0,
          }}>
            {update.subtext}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '16px 0 0' }} />

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{
            padding: '20px 20px',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
          }}
        >
          {/* Detail section label */}
          <p style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.09em',
            textTransform: 'uppercase' as const,
            color: 'var(--text-faint)',
            marginBottom: 12,
          }}>
            Details
          </p>

          {/* Detail body */}
          <p style={{
            fontSize: 14,
            lineHeight: 1.75,
            color: 'var(--text-muted)',
            whiteSpace: 'pre-line',
          }}>
            {update.detail}
          </p>

          {/* Source card */}
          <div style={{
            marginTop: 28,
            padding: '14px 16px',
            borderRadius: 14,
            background: 'rgba(249,115,22,0.07)',
            border: '1px solid rgba(249,115,22,0.18)',
          }}>
            <p style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: 'var(--text-faint)',
              marginBottom: 7,
            }}>
              Official Source
            </p>
            <a
              href={update.wdfw_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
              }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--accent)',
              }}>
                WDFW — {CATEGORY_LABEL[update.category]} ↗
              </span>
            </a>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>
              wdfw.wa.gov
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── UPDATE ROW (in list sheet — fully tappable) ─────────────────────────────

function UpdateRow({
  update,
  onSelect,
}: {
  update: DailyUpdate
  onSelect: () => void
}) {
  const accent = getAccentColor(update)

  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 14,
        padding: '13px 14px 13px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Status + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <StatusLabel update={update} />
          <span style={{
            fontSize: 10,
            color: 'var(--text-faint)',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
          }}>
            {CATEGORY_LABEL[update.category]}
          </span>
        </div>
        {/* Headline */}
        <p style={{
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--text)',
          lineHeight: 1.35,
          marginBottom: 3,
        }}>
          {update.headline}
        </p>
        {/* Subtext */}
        <p style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.4,
        }}>
          {update.subtext}
        </p>
      </div>
      {/* Chevron indicator */}
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="var(--text-faint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
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
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState<DailyUpdate | null>(null)

  const topUpdate     = updates[0]
  const footerUpdates = updates.slice(1, 4)   // up to 3 footer labels
  const alertCount    = updates.filter(u => u.priority === 'alert').length
  const hasAlerts     = alertCount > 0

  const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  })

  const moduleBorder = hasAlerts ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.10)'

  if (updates.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 18,
        padding: '16px 16px',
      }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>All quiet today</p>
        <p style={{ fontSize: 12, marginTop: 3, color: 'var(--text-muted)' }}>No major statewide updates</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Module card ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: `1px solid ${moduleBorder}`,
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        {/* Header strip — no emoji, clean text */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 16px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.10em',
              textTransform: 'uppercase' as const,
              color: 'var(--accent)',
            }}>
              Daily Briefing
            </span>
            {newCount > 0 && (
              <span style={{
                fontSize: 9,
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: 100,
                background: 'var(--live)',
                color: '#fff',
                letterSpacing: '0.04em',
              }}>
                NEW
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>
            {shortDate}
          </span>
        </div>

        {/* Hero — top update, full card tappable */}
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            borderLeft: `3px solid ${getAccentColor(topUpdate)}`,
            cursor: 'pointer',
            display: 'block',
          }}
        >
          <StatusLabel update={topUpdate} />
          <p style={{
            fontSize: 15,
            fontWeight: 900,
            marginTop: 6,
            color: 'var(--text)',
            lineHeight: 1.3,
          }}>
            {topUpdate.headline}
          </p>
          <p style={{
            fontSize: 12,
            marginTop: 4,
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}>
            {topUpdate.subtext}
          </p>
        </button>

        {/* Footer: remaining labels + "See all" */}
        {footerUpdates.length > 0 && (
          <button
            onClick={() => setOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 16px',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid var(--border)',
              cursor: 'pointer',
            } as React.CSSProperties}
          >
            <p style={{
              fontSize: 11,
              color: 'var(--text-faint)',
              fontWeight: 600,
              whiteSpace: 'nowrap' as const,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0,
            }}>
              {footerUpdates.map(u => u.featuredLabel).join(' · ')}
            </p>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--accent)',
              whiteSpace: 'nowrap',
              marginLeft: 8,
              flexShrink: 0,
            }}>
              See all {updates.length} →
            </span>
          </button>
        )}
      </div>

      {/* ── List sheet ── */}
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
            {/* Handle */}
            <div style={{ paddingTop: 10, paddingBottom: 0, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--text-20)' }} />
            </div>

            {/* Sheet header */}
            <div style={{
              padding: '14px 20px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--accent)',
                  }}>
                    Daily Briefing
                  </span>
                  {newCount > 0 && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: 100,
                      background: 'var(--live)',
                      color: '#fff',
                    }}>
                      NEW
                    </span>
                  )}
                </div>
                <h2 style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}>
                  Daily Updates
                </h2>
                <p style={{ fontSize: 12, marginTop: 3, color: 'var(--text-muted)' }}>
                  {dateLabel} · {updates.length} {updates.length === 1 ? 'update' : 'updates'}
                </p>
              </div>

              {/* Close */}
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

            {/* Instruction hint */}
            <p style={{
              fontSize: 11,
              color: 'var(--text-faint)',
              fontWeight: 500,
              padding: '10px 20px 0',
              margin: 0,
            }}>
              Tap any item for full details
            </p>

            {/* Scrollable update rows */}
            <div
              className="flex-1 overflow-y-auto no-scrollbar"
              style={{
                padding: '10px 16px',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {updates.map(u => (
                <UpdateRow
                  key={u.id}
                  update={u}
                  onSelect={() => setSelected(u)}
                />
              ))}

              {/* Disclaimer */}
              <p style={{
                fontSize: 10,
                color: 'var(--text-faint)',
                textAlign: 'center',
                lineHeight: 1.6,
                paddingTop: 4,
              }}>
                Based on active WDFW emergency rules and published season data.{' '}
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

      {/* ── Detail sheet (second level, above list sheet) ── */}
      {selected && (
        <UpdateDetailSheet
          update={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

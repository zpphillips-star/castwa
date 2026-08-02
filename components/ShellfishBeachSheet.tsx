'use client'
import { useEffect, useRef } from 'react'
import type { ShellfishBeach } from '@/lib/shellfish-data'
import {
  shellfishStatusColor,
  shellfishStatusLabel,
  shellfishStatusAnswer,
  dohStatusLabel,
  wdfwStatusLabel,
  speciesLabel,
  DOH_BIOTOXIN_HOTLINE,
} from '@/lib/shellfish-data'

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface Props {
  beach: ShellfishBeach
  onClose: () => void
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
function statusConfig(beach: ShellfishBeach) {
  const color = shellfishStatusColor(beach.status)
  const label = shellfishStatusLabel(beach.status)
  const answer = shellfishStatusAnswer(beach.status)
  const bgAlpha = beach.status === 'open' ? '22' : beach.status === 'advisory' ? '22' : '22'
  return { color, label, answer, bg: color + bgAlpha }
}

// ─── SECTION COMPONENT ───────────────────────────────────────────────────────
function Section({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-faint)',
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

// ─── INFO ROW ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 6,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-faint)', flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{
        fontSize: 12,
        color: valueColor ?? 'var(--text)',
        textAlign: 'right',
        lineHeight: 1.4,
      }}>{value}</span>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ShellfishBeachSheet({ beach, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const st = statusConfig(beach)

  // Close on backdrop tap
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const el = sheetRef.current
      if (el && !el.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handler)
      document.addEventListener('touchstart', handler)
    }, 80)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClose])

  const speciesList = beach.species.map(speciesLabel).join(', ')

  // Format date human-readable
  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  const dohColor = beach.doh.status === 'safe'
    ? 'var(--open)'
    : beach.doh.status === 'advisory'
    ? 'var(--amber)'
    : beach.doh.status === 'unknown'
    ? 'var(--text-faint)'
    : 'var(--live)'

  const wdfwColor = beach.wdfw.status === 'open'
    ? 'var(--open)'
    : beach.wdfw.status === 'limited'
    ? 'var(--amber)'
    : beach.wdfw.status === 'unknown'
    ? 'var(--text-faint)'
    : 'var(--live)'

  const accessTypeLabel: Record<ShellfishBeach['access']['type'], string> = {
    public_beach:   'Public Beach',
    state_park:     'State Park',
    dnr_tidelands:  'DNR Public Tidelands',
    tribal:         'Tribal Tidelands',
    private:        'Private',
    unknown:        'Unknown',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 2800,
          animation: 'sfBdIn 0.18s ease-out',
        }}
        aria-hidden
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2900,
          maxHeight: '88dvh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'sfSlideUp 0.22s ease-out',
        }}
      >
        <div
          ref={sheetRef}
          style={{
            background: 'var(--surface)',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            border: '1px solid var(--border)',
            borderBottom: 'none',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '88dvh',
            overflow: 'hidden',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--text-20)' }} />
          </div>

          {/* Header */}
          <div style={{ padding: '12px 20px 14px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-faint)',
                  marginBottom: 3,
                }}>
                  {beach.region} · {speciesList}
                </p>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, marginBottom: 6 }}>
                  {beach.name}
                </h2>

                {/* Main question + answer */}
                <p style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-faint)',
                  marginBottom: 4,
                }}>
                  Can I harvest shellfish here today?
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: st.color + '18',
                  border: `1.5px solid ${st.color}55`,
                  borderRadius: 10,
                  padding: '6px 12px',
                }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: st.color,
                  }}>
                    {st.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                    {st.answer}
                  </span>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  background: 'var(--surface-overlay)',
                  border: 'none',
                  borderRadius: 20,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-faint)',
                  cursor: 'pointer',
                  fontSize: 18,
                  flexShrink: 0,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 16px',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
            WebkitOverflowScrolling: 'touch' as never,
          }}>

            {/* ── Safety (DOH) ────────────────────────────────────────────── */}
            <Section icon="🔬" title="Safety — Dept. of Health (DOH)">
              <InfoRow
                label="Status"
                value={dohStatusLabel(beach.doh.status)}
                valueColor={dohColor}
              />
              <div style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                marginTop: 4,
              }}>
                {beach.doh.detail}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>DOH last checked:</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(beach.doh.lastChecked)}</span>
              </div>
            </Section>

            {/* ── Legal Season (WDFW) ──────────────────────────────────────── */}
            <Section icon="📋" title="Legal Season — WDFW">
              <InfoRow
                label="Season"
                value={wdfwStatusLabel(beach.wdfw.status)}
                valueColor={wdfwColor}
              />
              <div style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                marginTop: 2,
                marginBottom: 8,
              }}>
                {beach.wdfw.seasonNote}
              </div>
              {beach.wdfw.dailyLimit && (
                <InfoRow label="Bag limit" value={beach.wdfw.dailyLimit} />
              )}
              {beach.wdfw.gearRestriction && (
                <InfoRow label="Gear" value={beach.wdfw.gearRestriction} />
              )}
              {beach.wdfw.licenseRequired && beach.wdfw.licenseNote && (
                <InfoRow label="License" value={beach.wdfw.licenseNote} />
              )}
            </Section>

            {/* ── Access ───────────────────────────────────────────────────── */}
            <Section icon="🚗" title="Access">
              <InfoRow
                label="Land type"
                value={accessTypeLabel[beach.access.type]}
              />
              {beach.access.permitRequired && (
                <InfoRow label="Permit" value="Required — see details below" valueColor="var(--amber)" />
              )}
              <div style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                marginTop: 4,
              }}>
                {beach.access.note}
              </div>
            </Section>

            {/* ── Last Update & Mock Warning ──────────────────────────────── */}
            <div style={{
              background: 'var(--surface-2)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 10,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Last official update</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {fmtDate(beach.lastOfficialUpdate)}
                </span>
              </div>

              {beach.dataSource === 'mock' && (
                <div style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  marginTop: 6,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', marginBottom: 2 }}>
                    ⚠ Demo Data
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    This beach shows placeholder data for UI demonstration.
                    Always verify with DOH and WDFW before harvesting.
                  </p>
                </div>
              )}
            </div>

            {/* ── Action buttons ───────────────────────────────────────────── */}
            <div style={{ marginBottom: 10 }}>
              {/* DOH Biotoxin Hotline */}
              <a
                href={`tel:${DOH_BIOTOXIN_HOTLINE}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 12,
                  padding: '13px 16px',
                  marginBottom: 8,
                  textDecoration: 'none',
                }}
              >
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--live)', marginBottom: 2 }}>
                    📞 DOH Biotoxin Hotline
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {DOH_BIOTOXIN_HOTLINE}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>Live closure info 24/7</p>
                </div>
                <span style={{ fontSize: 20, color: 'var(--text-faint)' }}>›</span>
              </a>

              {/* Official links */}
              {beach.officialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 8,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {link.label}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--text-faint)' }}>↗</span>
                </a>
              ))}
            </div>

            {/* Disclaimer */}
            <p style={{
              fontSize: 10,
              color: 'var(--text-faint)',
              lineHeight: 1.6,
              padding: '0 4px',
            }}>
              Always verify current conditions with DOH and WDFW before harvesting shellfish.
              Conditions can change within hours due to biotoxin blooms, pollution events, or
              emergency rule changes. CastWA is not responsible for harvest decisions made
              based on this information.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sfSlideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes sfBdIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  )
}

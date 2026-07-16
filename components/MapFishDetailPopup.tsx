'use client'
import { useEffect } from 'react'
import type { FishSegment } from '@/lib/use-fish-map-segments'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Props {
  segment: FishSegment
  fishName: string
  onClose: () => void
  onViewFullRegs: () => void
  onZoomRiver: () => void
}

const STATUS_CONFIG = {
  open:      { label: 'OPEN',      color: '#6ab04c', bg: 'rgba(34,197,94,0.15)' },
  closed:    { label: 'CLOSED',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  emergency: { label: 'EMERGENCY', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
} as const

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MapFishDetailPopup({
  segment, fishName, onClose, onViewFullRegs, onZoomRiver,
}: Props) {
  // Dismiss on outside click/touch
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const el = document.getElementById('fish-detail-popup')
      if (el && !el.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handler)
      document.addEventListener('touchstart', handler)
    }, 60)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClose])

  const st = STATUS_CONFIG[segment.status] ?? STATUS_CONFIG.closed
  const reg = segment.regulation
  const sec = segment.section
  const season = segment.relevantSeason

  return (
    <div
      className="absolute bottom-0 left-0 right-0 px-3 pb-3"
      style={{ zIndex: 2000, pointerEvents: 'none' }}
    >
      <div
        id="fish-detail-popup"
        className="rounded-2xl p-4 shadow-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          pointerEvents: 'auto',
          animation: 'fishPopupSlideUp 0.22s ease-out',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-base" style={{ color: 'var(--text)' }}>{fishName}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: st.color, background: st.bg }}
              >
                {st.label}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{segment.waterName}</p>
            {segment.sectionName && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{segment.sectionName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none ml-3 mt-0.5 transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            ×
          </button>
        </div>

        {/* ── Restriction rows ────────────────────────────────────────────────── */}
        <div className="space-y-1.5 mb-4">
          {/* REGULATION-based water (non-Skagit) */}
          {reg && (
            <>
              {reg.dailyLimit !== null && (
                <Row label="Limit" value={`${reg.dailyLimit} fish/day`} />
              )}
              {reg.minSize !== null && (
                <Row label="Min size" value={`${reg.minSize}"`} />
              )}
              {reg.hatcheryOnly && (
                <Row label="Hatchery" value="Hatchery only (clipped fin)" accent="#fbbf24" />
              )}
              {reg.gearRestriction && (
                <Row label="Gear" value={reg.gearRestriction} />
              )}
              {reg.notes && (
                <Row label="Notes" value={reg.notes} small />
              )}
            </>
          )}

          {/* Skagit section */}
          {sec && season && (
            <>
              {season.dailyLimit !== null && season.dailyLimit !== undefined && (
                <Row label="Limit" value={String(season.dailyLimit)} />
              )}
              {season.notes && (
                <Row label="Notes" value={season.notes} small />
              )}
              {sec.gearPeriods[0] && (
                <Row label="Gear" value={sec.gearPeriods[0].rules} small />
              )}
            </>
          )}

          {/* Fallback if neither */}
          {!reg && !sec && (
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No detailed regulation data.</p>
          )}
        </div>

        {/* ── Action buttons ───────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <button
            onClick={onViewFullRegs}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            See full regulations →
          </button>
          {segment.waterId === 'skagit' && (
            <button
              onClick={onZoomRiver}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              See whole river →
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fishPopupSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── ROW HELPER ───────────────────────────────────────────────────────────────
function Row({
  label,
  value,
  accent,
  small,
}: {
  label: string
  value: string
  accent?: string
  small?: boolean
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{label}</span>
      <span
        className={`text-right ${small ? 'text-xs' : 'text-sm'}`}
        style={{ color: accent ?? 'var(--text)' }}
      >
        {value}
      </span>
    </div>
  )
}

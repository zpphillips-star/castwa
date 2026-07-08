'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { RiverSectionStatus } from './RiverSectionMapInner'

const RiverSectionMapInner = dynamic(
  () => import('./RiverSectionMapInner'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', background: '#08080f', color: '#6b7280', fontSize: 14,
      }}>
        Loading map…
      </div>
    ),
  }
)

export interface RiverSectionMapProps {
  sectionName: string
  startLabel: string
  endLabel: string
  coordinates: [number, number][]
  status: RiverSectionStatus
  detail?: string
  onClose: () => void
  /** Which river's OSM trace to slice from (e.g. 'skagit') */
  riverId?: string
  /** Boundary landmark coord for the start of this section */
  startCoord?: [number, number]
  /** Boundary landmark coord for the end of this section */
  endCoord?: [number, number]
}

const STATUS_LABEL: Record<RiverSectionStatus, string> = {
  open:       '● OPEN',
  closed:     '○ CLOSED',
  emergency:  '🚨 EMERGENCY RULE',
  restricted: '⚠️ RESTRICTED',
}
const STATUS_COLOR: Record<RiverSectionStatus, string> = {
  open:       '#4ade80',
  closed:     '#ef4444',
  emergency:  '#f97316',
  restricted: '#fbbf24',
}

export default function RiverSectionMap({
  sectionName,
  startLabel,
  endLabel,
  coordinates,
  status,
  detail,
  onClose,
  riverId,
  startCoord,
  endCoord,
}: RiverSectionMapProps) {
  const [fullScreen, setFullScreen] = useState(false)

  const color = STATUS_COLOR[status]
  const label = STATUS_LABEL[status]

  // Midpoint coord for Google Maps link
  const mid  = coordinates[Math.floor(coordinates.length / 2)]
  const directionsUrl = `https://maps.google.com/?q=${mid[0]},${mid[1]}`

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          background: '#0d0f1a',
          height: fullScreen ? '100dvh' : '72dvh',
          borderTopLeftRadius: fullScreen ? 0 : 16,
          borderTopRightRadius: fullScreen ? 0 : 16,
          transition: 'height 0.25s ease, border-radius 0.25s ease',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.7)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `2px solid ${color}30`, background: `${color}10` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded"
                style={{ background: `${color}20`, color }}
              >
                {label}
              </span>
            </div>
            <p className="text-sm font-bold text-white leading-tight truncate">{sectionName}</p>
            {detail && (
              <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#9ca3af' }}>
                {detail}
              </p>
            )}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {/* Full-screen toggle */}
            <button
              onClick={() => setFullScreen(f => !f)}
              className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              title={fullScreen ? 'Shrink' : 'Full screen'}
            >
              <span style={{ fontSize: 14 }}>{fullScreen ? '⤓' : '⤢'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              title="Close"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Map area ── */}
        <div className="flex-1 relative overflow-hidden">
          <RiverSectionMapInner
            key={sectionName}
            sectionName={sectionName}
            startLabel={startLabel}
            endLabel={endLabel}
            coordinates={coordinates}
            status={status}
            detail={detail}
            riverId={riverId}
            startCoord={startCoord}
            endCoord={endCoord}
          />
        </div>

        {/* ── Footer ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3 gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0d0f1a' }}
        >
          {/* Landmark summary */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px]" style={{ color: '#6b7280' }}>
              <span style={{ color: '#9ca3af' }}>{startLabel}</span>
              <span className="mx-1" style={{ color: '#374151' }}>→</span>
              <span style={{ color: '#9ca3af' }}>{endLabel}</span>
            </p>
          </div>

          {/* Get Directions */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg active:opacity-70 flex-shrink-0"
            style={{
              background: 'rgba(74,222,128,0.12)',
              border: '1px solid rgba(74,222,128,0.3)',
              color: '#4ade80',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 14 }}>🗺️</span> Directions
          </a>
        </div>
      </div>
    </div>
  )
}

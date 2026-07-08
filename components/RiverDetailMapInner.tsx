'use client'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

export type SegmentStatus = 'open' | 'closed' | 'emergency' | 'restricted' | 'neutral'

export interface MapSegment {
  idx: number
  coords: [number, number][]
  status: SegmentStatus
  label: string
}

interface Props {
  segments: MapSegment[]
  selectedIdx: number
  onSegmentClick?: (idx: number) => void
}

const STATUS_COLOR: Record<SegmentStatus, string> = {
  open:       '#4ade80',
  closed:     '#ef4444',
  emergency:  '#f97316',
  restricted: '#fbbf24',
  neutral:    '#60a5fa',  // plain waterway blue
}

/** Fit map to a specific set of coords whenever they change */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length > 1) {
      try {
        map.fitBounds(L.latLngBounds(coords), { padding: [30, 30], animate: true })
      } catch { /* ignore invalid bounds */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])
  return null
}

export default function RiverDetailMapInner({ segments, selectedIdx, onSegmentClick }: Props) {
  const allCoords = segments.flatMap(s => s.coords)
  if (allCoords.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', background: '#08080f', color: '#6b7280', fontSize: 14 }}>
        No map data available
      </div>
    )
  }

  const initialBounds = L.latLngBounds(allCoords)
  const selectedCoords = segments[selectedIdx]?.coords ?? allCoords

  return (
    <MapContainer
      bounds={initialBounds}
      boundsOptions={{ padding: [30, 30] }}
      style={{ height: '100%', width: '100%', background: '#08080f' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />

      {/* Fit to selected section when it changes */}
      <FitBounds coords={selectedCoords} />

      {/* All non-selected segments — always blue */}
      {segments.map(seg => {
        if (seg.idx === selectedIdx) return null
        return (
          <Polyline
            key={`seg-${seg.idx}`}
            positions={seg.coords}
            pathOptions={{
              color: '#60a5fa',
              weight: 4,
              // dimmer when another segment is actively selected, full when no selection
              opacity: selectedIdx >= 0 ? 0.45 : 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            eventHandlers={{ click: () => onSegmentClick?.(seg.idx) }}
          />
        )
      })}

      {/* Selected segment — always orange & thick (only when idx >= 0) */}
      {selectedIdx >= 0 && segments[selectedIdx] && (
        <Polyline
          key={`selected-${selectedIdx}`}
          positions={segments[selectedIdx].coords}
          pathOptions={{
            color: '#f97316',
            weight: 8,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          eventHandlers={{ click: () => onSegmentClick?.(selectedIdx) }}
        />
      )}
    </MapContainer>
  )
}

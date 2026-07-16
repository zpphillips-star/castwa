'use client'
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
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
  open:       'var(--status-open-bright)',
  closed:     'var(--live)',
  emergency:  'var(--warning)',
  restricted: 'var(--amber)',
  neutral:    'var(--blue)',  // plain waterway blue
}

/** Fit map to a specific set of coords whenever they change */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        map.invalidateSize()          // ensure container is properly sized
        if (coords.length >= 2) {
          map.fitBounds(L.latLngBounds(coords), {
            padding: [40, 40],
            maxZoom: 14,
            animate: false,
          })
        } else if (coords.length === 1) {
          map.setView(coords[0], 11, { animate: false })
        }
      } catch { /* ignore invalid bounds */ }
    }, 100)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])
  return null
}

export default function RiverDetailMapInner({ segments, selectedIdx, onSegmentClick }: Props) {
  const allCoords = segments.flatMap(s => s.coords)
  if (allCoords.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', background: '#b8d8ea', color: 'var(--text-faint)', fontSize: 14 }}>
        No map data available
      </div>
    )
  }

  // Single-point (lake / bay / sound): use center+zoom instead of bounds
  const isSinglePoint = allCoords.length === 1
  const mapProps = isSinglePoint
    ? { center: allCoords[0] as [number, number], zoom: 10 }
    : { bounds: L.latLngBounds(allCoords), boundsOptions: { padding: [40, 40] as [number, number], maxZoom: 14 } }

  const selectedCoords = segments[selectedIdx]?.coords ?? allCoords

  return (
    <MapContainer
      {...mapProps}
      style={{ height: '100%', width: '100%', background: '#b8d8ea' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />

      {/* Fit to selected section when it changes */}
      <FitBounds coords={selectedCoords} />

      {/* All non-selected segments */}
      {segments.map(seg => {
        if (seg.idx === selectedIdx) return null
        const color = 'var(--blue)'
        const opacity = selectedIdx >= 0 ? 0.45 : 0.85
        if (seg.coords.length === 1) {
          return (
            <CircleMarker
              key={`seg-${seg.idx}`}
              center={seg.coords[0]}
              radius={12}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.35, opacity, weight: 2 }}
              eventHandlers={{ click: () => onSegmentClick?.(seg.idx) }}
            />
          )
        }
        return (
          <Polyline
            key={`seg-${seg.idx}`}
            positions={seg.coords}
            pathOptions={{
              color,
              weight: 4,
              opacity,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            eventHandlers={{ click: () => onSegmentClick?.(seg.idx) }}
          />
        )
      })}

      {/* Selected segment — highlighted (only when idx >= 0) */}
      {selectedIdx >= 0 && segments[selectedIdx] && (() => {
        const seg = segments[selectedIdx]
        if (seg.coords.length === 1) {
          return (
            <CircleMarker
              key={`selected-${selectedIdx}`}
              center={seg.coords[0]}
              radius={16}
              pathOptions={{ color: 'var(--warning)', fillColor: 'var(--warning)', fillOpacity: 0.5, opacity: 1, weight: 3 }}
              eventHandlers={{ click: () => onSegmentClick?.(selectedIdx) }}
            />
          )
        }
        return (
          <Polyline
            key={`selected-${selectedIdx}`}
            positions={seg.coords}
            pathOptions={{
              color: 'var(--warning)',
              weight: 8,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            eventHandlers={{ click: () => onSegmentClick?.(selectedIdx) }}
          />
        )
      })()}
    </MapContainer>
  )
}

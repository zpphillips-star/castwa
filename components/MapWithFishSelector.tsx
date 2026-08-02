'use client'
import { useState, useCallback } from 'react'
import WAMap from './WAMap'
import MapFishSelector from './MapFishSelector'
import MapFishDetailPopup from './MapFishDetailPopup'
import FishDetailSheet from './FishDetailSheet'
import FishWaterSheet from './FishWaterSheet'
import RiverDetailSheet from './RiverDetailSheet'
import ShellfishBeachSheet from './ShellfishBeachSheet'
import { useSelectedFishSegments } from '@/lib/use-fish-map-segments'
import type { FishSegment } from '@/lib/use-fish-map-segments'
import { SPECIES, Species, WaterBody, WATER_BODIES } from '@/lib/fishing-data'
import { SHELLFISH_BEACHES } from '@/lib/shellfish-data'
import type { ShellfishBeach } from '@/lib/shellfish-data'

import { RIVER_MAP } from '@/lib/river-lookup'

export default function MapWithFishSelector() {
  const [selectedFish, setSelectedFish] = useState<string | null>(null)
  const [activeSegment, setActiveSegment] = useState<FishSegment | null>(null)
  const [showFishDetail, setShowFishDetail] = useState(false)
  const [zoomToSkagit, setZoomToSkagit] = useState(0)
  const [openRiverId, setOpenRiverId] = useState<string | null>(null)
  const [fishWaterCombo, setFishWaterCombo] = useState<{
    fish: Species
    water: WaterBody
    siblingWaters: WaterBody[]
    index: number
  } | null>(null)

  // ── Shellfish state ────────────────────────────────────────────────────────
  const [shellfishMode, setShellfishMode] = useState(false)
  const [selectedBeach, setSelectedBeach] = useState<ShellfishBeach | null>(null)

  const fishSegments = useSelectedFishSegments(selectedFish)

  const handleSegmentClick = useCallback((seg: FishSegment) => {
    setActiveSegment(seg)
  }, [])

  const handleZoomRiver = useCallback(() => {
    setActiveSegment(null)
    setZoomToSkagit(n => n + 1)
  }, [])

  const handleSelectFish = useCallback((fishId: string | null) => {
    setSelectedFish(fishId)
    setActiveSegment(null)
  }, [])

  const handleOpenRiver = useCallback((riverId: string) => {
    setOpenRiverId(riverId)
    setActiveSegment(null)
  }, [])

  const handleToggleShellfish = useCallback(() => {
    setShellfishMode(prev => {
      const next = !prev
      if (next) {
        // Entering shellfish mode — clear fish selection
        setSelectedFish(null)
        setActiveSegment(null)
      }
      return next
    })
  }, [])

  const handleBeachClick = useCallback((beach: ShellfishBeach) => {
    setSelectedBeach(beach)
  }, [])

  const selectedSpecies = selectedFish ? SPECIES.find(s => s.id === selectedFish) ?? null : null
  const openRiver = openRiverId ? RIVER_MAP[openRiverId] ?? null : null

  return (
    <div className="relative h-full">
      {/* Fish + Shellfish selector pill bar — floats above map */}
      <MapFishSelector
        selected={selectedFish}
        onSelect={handleSelectFish}
        shellfishMode={shellfishMode}
        onToggleShellfish={handleToggleShellfish}
      />

      {/* Shellfish legend — shown when shellfish mode is active */}
      {shellfishMode && (
        <div
          style={{
            position: 'absolute',
            bottom: 90,
            left: 12,
            zIndex: 1000,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '8px 12px',
            pointerEvents: 'none',
          }}
        >
          <p style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-faint)',
            marginBottom: 6,
          }}>
            Shellfish Beaches
          </p>
          {([
            { color: '#4ade80', label: 'Open' },
            { color: '#ef4444', label: 'Closed' },
            { color: '#f59e0b', label: 'Advisory', dash: true },
            { color: 'rgba(107,114,128,0.55)', label: 'Unknown', dash: true },
          ] as { color: string; label: string; dash?: boolean }[]).map(({ color, label, dash }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{
                width: 22,
                height: 4,
                borderRadius: 2,
                background: color,
                opacity: dash ? 0.8 : 1,
                backgroundImage: dash ? `repeating-linear-gradient(90deg, ${color} 0, ${color} 5px, transparent 5px, transparent 8px)` : undefined,
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 4, lineHeight: 1.4 }}>
            Tap a beach for details
          </p>
        </div>
      )}

      {/* Base map — receives fish overlay or shellfish overlay */}
      <WAMap
        selectedFish={shellfishMode ? null : selectedFish}
        fishSegments={shellfishMode ? undefined : (selectedFish ? fishSegments : undefined)}
        onSegmentClick={shellfishMode ? undefined : handleSegmentClick}
        onOpenRiver={shellfishMode ? undefined : handleOpenRiver}
        zoomToSkagit={zoomToSkagit}
        showShellfish={shellfishMode}
        shellfishBeaches={shellfishMode ? SHELLFISH_BEACHES : undefined}
        onBeachClick={handleBeachClick}
      />

      {/* Bottom-sheet popup when a section is tapped with a fish selected */}
      {activeSegment && selectedSpecies && !shellfishMode && (
        <MapFishDetailPopup
          segment={activeSegment}
          fishName={selectedSpecies.name}
          onClose={() => setActiveSegment(null)}
          onViewFullRegs={() => {
            // fish + water both known → go straight to FishWaterSheet
            const wb = WATER_BODIES.find(w => w.id === activeSegment.waterId)
            if (wb && selectedSpecies) {
              const allWaters = fishSegments
                .map(fs => WATER_BODIES.find(w => w.id === fs.waterId))
                .filter((w): w is WaterBody => !!w)
              const idx = Math.max(0, allWaters.findIndex(w => w.id === wb.id))
              setFishWaterCombo({ fish: selectedSpecies, water: wb, siblingWaters: allWaters, index: idx })
              setActiveSegment(null)
            } else {
              // fallback: open full fish detail if water can't be resolved
              setShowFishDetail(true)
              setActiveSegment(null)
            }
          }}
          onZoomRiver={handleZoomRiver}
        />
      )}

      {/* FishWaterSheet — primary: fish + water from map segment popup */}
      {fishWaterCombo && selectedSpecies && (
        <FishWaterSheet
          fish={fishWaterCombo.fish}
          water={fishWaterCombo.water}
          siblingWaters={fishWaterCombo.siblingWaters}
          initialSiblingIndex={fishWaterCombo.index}
          onClose={() => setFishWaterCombo(null)}
        />
      )}

      {/* Fallback full fish regulations sheet (no water context available) */}
      {showFishDetail && selectedSpecies && (
        <FishDetailSheet
          species={selectedSpecies}
          onClose={() => setShowFishDetail(false)}
        />
      )}

      {/* River detail sheet — gold-standard view for any river tapped on the map */}
      {openRiver && (
        <RiverDetailSheet
          river={openRiver}
          flow={{ cfs: null, status: 'loading', trend: null, fetchedAt: '' }}
          onClose={() => setOpenRiverId(null)}
        />
      )}

      {/* Shellfish beach detail sheet */}
      {selectedBeach && (
        <ShellfishBeachSheet
          beach={selectedBeach}
          onClose={() => setSelectedBeach(null)}
        />
      )}
    </div>
  )
}

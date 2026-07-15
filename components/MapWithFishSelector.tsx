'use client'
import { useState, useCallback } from 'react'
import WAMap from './WAMap'
import MapFishSelector from './MapFishSelector'
import MapFishDetailPopup from './MapFishDetailPopup'
import FishDetailSheet from './FishDetailSheet'
import FishWaterSheet from './FishWaterSheet'
import RiverDetailSheet from './RiverDetailSheet'
import { useSelectedFishSegments } from '@/lib/use-fish-map-segments'
import type { FishSegment } from '@/lib/use-fish-map-segments'
import { SPECIES, Species, WaterBody, WATER_BODIES } from '@/lib/fishing-data'

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

  const selectedSpecies = selectedFish ? SPECIES.find(s => s.id === selectedFish) ?? null : null
  const openRiver = openRiverId ? RIVER_MAP[openRiverId] ?? null : null

  return (
    <div className="relative h-full">
      {/* Fish selector pill bar — floats above map */}
      <MapFishSelector
        selected={selectedFish}
        onSelect={handleSelectFish}
      />

      {/* Base map — receives fish overlay data */}
      <WAMap
        selectedFish={selectedFish}
        fishSegments={selectedFish ? fishSegments : undefined}
        onSegmentClick={handleSegmentClick}
        onOpenRiver={handleOpenRiver}
        zoomToSkagit={zoomToSkagit}
      />

      {/* Bottom-sheet popup when a section is tapped with a fish selected */}
      {activeSegment && selectedSpecies && (
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
    </div>
  )
}

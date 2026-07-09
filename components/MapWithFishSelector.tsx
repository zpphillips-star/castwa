'use client'
import { useState, useCallback } from 'react'
import WAMap from './WAMap'
import MapFishSelector from './MapFishSelector'
import MapFishDetailPopup from './MapFishDetailPopup'
import FishDetailSheet from './FishDetailSheet'
import RiverDetailSheet from './RiverDetailSheet'
import { useSelectedFishSegments } from '@/lib/use-fish-map-segments'
import type { FishSegment } from '@/lib/use-fish-map-segments'
import { SPECIES } from '@/lib/fishing-data'

// Canonical Skagit entry for RiverDetailSheet
const SKAGIT_RIVER = {
  id: 'skagit', name: 'Skagit River', region: 'Northwest',
  usgsId: '12200500',
  targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
  idealCfs: { min: 3000, max: 18000 },
}

// All rivers that can be opened via onOpenRiver
const RIVER_MAP: Record<string, typeof SKAGIT_RIVER> = {
  skagit: SKAGIT_RIVER,
}

export default function MapWithFishSelector() {
  const [selectedFish, setSelectedFish] = useState<string | null>(null)
  const [activeSegment, setActiveSegment] = useState<FishSegment | null>(null)
  const [showFishDetail, setShowFishDetail] = useState(false)
  const [zoomToSkagit, setZoomToSkagit] = useState(0)
  const [openRiverId, setOpenRiverId] = useState<string | null>(null)

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
            setShowFishDetail(true)
            setActiveSegment(null)
          }}
          onZoomRiver={handleZoomRiver}
        />
      )}

      {/* Full fish regulations sheet */}
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

'use client'
import { useState, useCallback } from 'react'
import WAMap from './WAMap'
import MapFishSelector from './MapFishSelector'
import MapFishDetailPopup from './MapFishDetailPopup'
import FishDetailSheet from './FishDetailSheet'
import { useSelectedFishSegments } from '@/lib/use-fish-map-segments'
import type { FishSegment } from '@/lib/use-fish-map-segments'
import { SPECIES } from '@/lib/fishing-data'

export default function MapWithFishSelector() {
  const [selectedFish, setSelectedFish] = useState<string | null>(null)
  const [activeSegment, setActiveSegment] = useState<FishSegment | null>(null)
  const [showFishDetail, setShowFishDetail] = useState(false)
  const [zoomToSkagit, setZoomToSkagit] = useState(0)

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

  const selectedSpecies = selectedFish ? SPECIES.find(s => s.id === selectedFish) ?? null : null

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

      {/* Full regulations sheet */}
      {showFishDetail && selectedSpecies && (
        <FishDetailSheet
          species={selectedSpecies}
          onClose={() => setShowFishDetail(false)}
        />
      )}
    </div>
  )
}

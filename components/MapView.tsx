'use client'

import dynamic from 'next/dynamic'
import type { WaterBody } from '@/types'
import { useWaterSheet } from '@/contexts/WaterSheetContext'

// Water body center coordinates for major WA waters
const WATER_COORDS: Record<string, [number, number]> = {
  'Skagit River': [48.4932, -121.8],
  'Snoqualmie River': [47.5293, -121.8309],
  'Green River': [47.3607, -122.0566],
  'Skykomish River': [47.8593, -121.6066],
  'Lake Washington': [47.6200, -122.2571],
  'Lake Sammamish': [47.5924, -122.0855],
  'Banks Lake': [47.8200, -119.2900],
  'Lake Chelan': [47.8400, -120.0200],
  'Ross Lake': [48.7300, -121.0600],
  'Columbia River': [46.2000, -119.2000],
  'Snake River': [46.4000, -118.4000],
  'Yakima River': [46.6400, -120.5100],
  'Methow River': [48.5500, -119.9900],
  'Wenatchee River': [47.6800, -120.4400],
  'Puget Sound': [47.6588, -122.4190],
  'Hood Canal': [47.6200, -123.0200],
  'Willapa Bay': [46.6800, -123.9500],
  'Grays Harbor': [46.9500, -124.1000],
  'Spokane River': [47.6588, -117.4260],
  'Pend Oreille River': [48.5000, -117.0000],
}

interface WaterBodyWithStatus extends WaterBody {
  hasOpenSeason: boolean
}

interface Props {
  waters: WaterBodyWithStatus[]
}

// Dynamically import map to prevent SSR issues
const Map = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0c2a3e]">
      <div className="text-water-400 text-sm">Loading map...</div>
    </div>
  ),
})

export default function MapView({ waters }: Props) {
  const { openSheet } = useWaterSheet()

  return (
    <div className="relative h-full">
      <Map
        waters={waters}
        coords={WATER_COORDS}
        onSelect={(water) => openSheet(water.id)}
      />
    </div>
  )
}

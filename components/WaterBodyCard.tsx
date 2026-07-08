'use client'

import type { WaterBody } from '@/types'
import { useWaterSheet } from '@/contexts/WaterSheetContext'

interface Props {
  water: WaterBody
  compact?: boolean
}

const typeEmoji: Record<string, string> = {
  river: '🌊', lake: '🏞️', stream: '💧', ocean: '🌊', reservoir: '🏔️',
}

const typeColors: Record<string, string> = {
  river: 'text-blue-400',
  lake: 'text-teal-400',
  stream: 'text-cyan-400',
  ocean: 'text-indigo-400',
  reservoir: 'text-purple-400',
}

export default function WaterBodyCard({ water, compact = false }: Props) {
  const { openSheet } = useWaterSheet()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    openSheet(water.id)
  }

  if (compact) {
    return (
      <a
        href={`/water/${water.id}`}
        onClick={handleClick}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span className="text-xl">{typeEmoji[water.type] ?? '💧'}</span>
        <div>
          <p className="font-medium text-white group-hover:text-water-200 transition-colors">{water.name}</p>
          <div className="flex gap-2 text-xs">
            <span className={`capitalize ${typeColors[water.type] ?? 'text-gray-400'}`}>{water.type}</span>
            {water.county && <span className="text-water-400">{water.county} Co.</span>}
          </div>
        </div>
      </a>
    )
  }

  return (
    <a
      href={`/water/${water.id}`}
      onClick={handleClick}
      className="card p-4 hover:border-water-500/50 transition-all block group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{typeEmoji[water.type] ?? '💧'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-water-200 transition-colors truncate">
            {water.name}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            <span className={`text-xs capitalize ${typeColors[water.type] ?? 'text-gray-400'}`}>
              {water.type}
            </span>
            {water.county && (
              <span className="text-xs text-water-400">{water.county} County</span>
            )}
            {water.wria && (
              <span className="text-xs text-water-500">WRIA {water.wria}</span>
            )}
            {water.usgs_site_id && (
              <span className="text-xs text-forest-400">📡 Live conditions</span>
            )}
          </div>
        </div>
        <svg className="h-4 w-4 text-water-500 flex-shrink-0 mt-1 group-hover:text-water-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  )
}

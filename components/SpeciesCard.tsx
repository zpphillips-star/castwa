import Link from 'next/link'
import type { Species } from '@/types'

interface Props {
  species: Species
  compact?: boolean
}

const categoryEmoji: Record<string, string> = {
  salmon: '🐟', trout: '🎣', steelhead: '🐠', bass: '🐟',
  panfish: '🐠', marine: '🦀', other: '🐟',
}

const categoryColors: Record<string, string> = {
  salmon: 'text-orange-400',
  trout: 'text-blue-400',
  steelhead: 'text-indigo-400',
  bass: 'text-green-400',
  panfish: 'text-yellow-400',
  marine: 'text-teal-400',
  other: 'text-gray-400',
}

export default function SpeciesCard({ species, compact = false }: Props) {
  if (compact) {
    return (
      <Link
        href={`/species/${species.id}`}
        className="flex items-center gap-2 rounded-lg border border-water-700/30 bg-water-900/30 px-3 py-2 hover:border-water-500/50 hover:bg-water-800/40 transition-all group"
      >
        <span className="text-lg">{categoryEmoji[species.category] ?? '🐟'}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate group-hover:text-water-200">
            {species.common_name}
          </p>
          <p className={`text-xs capitalize ${categoryColors[species.category] ?? 'text-gray-400'}`}>
            {species.category}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/species/${species.id}`}
      className="card p-4 hover:border-water-500/50 transition-all block group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{categoryEmoji[species.category] ?? '🐟'}</span>
        <div>
          <h3 className="font-semibold text-white group-hover:text-water-200 transition-colors">
            {species.common_name}
          </h3>
          {species.scientific_name && (
            <p className="text-xs text-water-400 italic">{species.scientific_name}</p>
          )}
          <p className={`text-xs mt-1 capitalize ${categoryColors[species.category] ?? 'text-gray-400'}`}>
            {species.category}
          </p>
          {species.description && (
            <p className="mt-2 text-xs text-water-300/70 line-clamp-2">{species.description}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

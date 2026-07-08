import type { Regulation } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props {
  regulation: Regulation
  compact?: boolean
}

interface RegRow {
  icon: string
  label: string
  value: string | null
  variant: 'green' | 'red' | 'yellow' | 'neutral'
  show: boolean
}

export default function RegulationCard({ regulation: reg, compact = false }: Props) {
  const rows: RegRow[] = [
    {
      icon: '🐟',
      label: 'Daily Limit',
      value: reg.daily_limit === 0 ? 'Catch-and-release only' : reg.daily_limit !== null ? `${reg.daily_limit} fish per day` : null,
      variant: reg.daily_limit === 0 ? 'yellow' : reg.daily_limit !== null ? 'green' : 'neutral',
      show: reg.daily_limit !== null,
    },
    {
      icon: '📏',
      label: 'Size Minimum',
      value: reg.size_min_inches && reg.size_min_inches > 0 ? `${reg.size_min_inches}" minimum` : reg.size_min_inches === 0 ? 'No size minimum' : null,
      variant: reg.size_min_inches !== null && reg.size_min_inches > 0 ? 'yellow' : 'green',
      show: reg.size_min_inches !== null,
    },
    {
      icon: '🏭',
      label: 'Hatchery Fish Only',
      value: reg.hatchery_only ? 'Hatchery fish only' : 'Hatchery & wild fish',
      variant: reg.hatchery_only ? 'yellow' : 'green',
      show: true,
    },
    {
      icon: '🐠',
      label: 'Wild Fish Release',
      value: reg.wild_release_required ? 'Wild fish must be released' : 'Wild fish may be kept',
      variant: reg.wild_release_required ? 'red' : 'green',
      show: true,
    },
    {
      icon: '🪱',
      label: 'Bait',
      value: reg.bait_allowed === null ? null : reg.bait_allowed ? 'Bait allowed' : 'No bait — lure/fly only',
      variant: reg.bait_allowed === null ? 'neutral' : reg.bait_allowed ? 'green' : 'red',
      show: reg.bait_allowed !== null,
    },
    {
      icon: '🪝',
      label: 'Hook Restrictions',
      value: reg.barbless_required ? 'Barbless hooks required' : 'Standard hooks allowed',
      variant: reg.barbless_required ? 'yellow' : 'green',
      show: true,
    },
    {
      icon: '🌙',
      label: 'Night Fishing',
      value: reg.night_fishing_allowed === null ? null : reg.night_fishing_allowed ? 'Night fishing allowed' : 'Night fishing prohibited',
      variant: reg.night_fishing_allowed === null ? 'neutral' : reg.night_fishing_allowed ? 'green' : 'red',
      show: reg.night_fishing_allowed !== null,
    },
  ]

  const visibleRows = rows.filter((r) => r.show)

  const variantStyles = {
    green: 'regulation-allowed',
    red: 'regulation-prohibited',
    yellow: 'regulation-warning',
    neutral: 'bg-gray-900/30 border-l-4 border-gray-600 text-gray-300',
  }

  const variantIcons = {
    green: '✓',
    red: '✗',
    yellow: '⚠',
    neutral: '–',
  }

  return (
    <div className="space-y-1.5">
      {visibleRows.map((row) => (
        row.value !== null && (
          <div
            key={row.label}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${variantStyles[row.variant]}`}
          >
            <span className="text-base">{row.icon}</span>
            <span className="flex-1">{row.value}</span>
            <span className="ml-auto text-base font-bold opacity-80">{variantIcons[row.variant]}</span>
          </div>
        )
      ))}

      {!compact && (
        <>
          {reg.gear_restrictions && (
            <div className="regulation-warning flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
              <span className="text-base">⚙️</span>
              <span>{reg.gear_restrictions}</span>
            </div>
          )}

          {reg.closed_sections && (
            <div className="regulation-prohibited flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
              <span className="text-base">🚫</span>
              <div>
                <span className="font-medium">Closed sections: </span>
                <span>{reg.closed_sections}</span>
              </div>
            </div>
          )}

          {reg.notes && (
            <div className="mt-2 rounded-lg bg-water-900/30 border border-water-700/20 p-3 text-xs text-water-300">
              <p className="font-medium text-water-200 mb-1">Additional Notes</p>
              <p>{reg.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-xs text-water-500">
            <span>Updated: {formatDate(reg.updated_at)}</span>
            {reg.source_url && (
              <a
                href={reg.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-water-400 hover:text-water-200 underline"
              >
                WDFW source →
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )
}

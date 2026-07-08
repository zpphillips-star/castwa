'use client'

import { getSeasonStatus, formatDate } from '@/lib/utils'

interface Props {
  openDate: string
  closeDate: string
}

export default function SeasonBadge({ openDate, closeDate }: Props) {
  const { isOpen, label, urgency } = getSeasonStatus(openDate, closeDate)

  const styles = {
    normal: isOpen
      ? 'bg-forest-900/60 border-forest-600/50 text-forest-200'
      : 'bg-gray-900/60 border-gray-600/50 text-gray-400',
    soon: 'bg-yellow-900/60 border-yellow-600/50 text-yellow-200 animate-pulse',
    closing: 'bg-orange-900/60 border-orange-600/50 text-orange-200',
  }

  const dotColor = {
    normal: isOpen ? 'bg-forest-400' : 'bg-gray-500',
    soon: 'bg-yellow-400',
    closing: 'bg-orange-400',
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[urgency]}`}>
        <span className={`h-2 w-2 rounded-full ${dotColor[urgency]}`} />
        {label}
      </div>
      <p className="text-xs text-water-500">
        {formatDate(openDate)} – {formatDate(closeDate)}
      </p>
    </div>
  )
}

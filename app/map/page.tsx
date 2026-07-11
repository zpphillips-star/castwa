'use client'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'

const MapWithFishSelector = dynamic(() => import('@/components/MapWithFishSelector'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
      Loading map...
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--bg)', paddingBottom: '80px' }}>
      <header className="glass-header px-4 flex-shrink-0">
        <div className="max-w-lg mx-auto py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Open Now</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Where to fish in WA today</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><span style={{ color: '#4ade80' }}>●</span> Open</span>
            <span className="flex items-center gap-1"><span style={{ color: '#ef4444' }}>●</span> Closed</span>
            <span className="flex items-center gap-1"><span style={{ color: '#6b7280' }}>●</span> No season</span>
          </div>
        </div>
      </header>
      <div className="flex-1 relative">
        <MapWithFishSelector />
      </div>
      <BottomNav />
    </div>
  )
}


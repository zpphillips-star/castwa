'use client'
import { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[2000] flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold"
      style={{ background: 'var(--amber)', color: '#000' }}
    >
      <span>📵</span>
      <span>Offline — showing cached regulations</span>
    </div>
  )
}

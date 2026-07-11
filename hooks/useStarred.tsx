'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const FISH_KEY  = 'castwa:starred-fish'
const WATER_KEY = 'castwa:starred-waters'

function load(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}

function save(key: string, ids: string[]) {
  try { localStorage.setItem(key, JSON.stringify(ids)) } catch {}
}

interface StarredContextValue {
  starredFishIds:  string[]
  starredWaterIds: string[]
  hydrated:        boolean
  toggleFish:      (id: string) => void
  toggleWater:     (id: string) => void
  isFishStarred:   (id: string) => boolean
  isWaterStarred:  (id: string) => boolean
}

const StarredContext = createContext<StarredContextValue | null>(null)

export function StarredProvider({ children }: { children: ReactNode }) {
  const [fishIds,  setFishIds]  = useState<string[]>([])
  const [waterIds, setWaterIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setFishIds(load(FISH_KEY))
    setWaterIds(load(WATER_KEY))
    setHydrated(true)
  }, [])

  // Persist on change (skip the initial empty-array write by gating on hydrated)
  useEffect(() => { if (hydrated) save(FISH_KEY,  fishIds)  }, [fishIds,  hydrated])
  useEffect(() => { if (hydrated) save(WATER_KEY, waterIds) }, [waterIds, hydrated])

  const toggleFish  = useCallback((id: string) => setFishIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  ), [])

  const toggleWater = useCallback((id: string) => setWaterIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  ), [])

  const isFishStarred  = useCallback((id: string) => fishIds.includes(id),  [fishIds])
  const isWaterStarred = useCallback((id: string) => waterIds.includes(id), [waterIds])

  return (
    <StarredContext.Provider value={{ starredFishIds: fishIds, starredWaterIds: waterIds, hydrated, toggleFish, toggleWater, isFishStarred, isWaterStarred }}>
      {children}
    </StarredContext.Provider>
  )
}

export function useStarred() {
  const ctx = useContext(StarredContext)
  if (!ctx) throw new Error('useStarred must be used inside <StarredProvider>')
  return ctx
}

// Backward-compat aliases
export const useStarredFish   = () => { const { isFishStarred,  toggleFish,  starredFishIds  } = useStarred(); return { isStarred: isFishStarred,  toggle: toggleFish,  ids: starredFishIds  } }
export const useStarredWaters = () => { const { isWaterStarred, toggleWater, starredWaterIds } = useStarred(); return { isStarred: isWaterStarred, toggle: toggleWater, ids: starredWaterIds } }

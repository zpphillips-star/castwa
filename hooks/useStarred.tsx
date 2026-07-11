'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

// ─── Storage keys ─────────────────────────────────────────────────────────────
const FISH_KEY  = 'castwa:starred-fish'
const WATER_KEY = 'castwa:starred-waters'

function load(key: string): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}

function save(key: string, ids: string[]) {
  try { localStorage.setItem(key, JSON.stringify(ids)) } catch {}
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface StarredContextValue {
  starredFishIds:   string[]
  starredWaterIds:  string[]
  toggleFish:   (id: string) => void
  toggleWater:  (id: string) => void
  isFishStarred:   (id: string) => boolean
  isWaterStarred:  (id: string) => boolean
}

const StarredContext = createContext<StarredContextValue | null>(null)

// ─── Provider — mount once at the app root ────────────────────────────────────
export function StarredProvider({ children }: { children: ReactNode }) {
  const [fishIds,  setFishIds]  = useState<string[]>(() => load(FISH_KEY))
  const [waterIds, setWaterIds] = useState<string[]>(() => load(WATER_KEY))

  // Keep localStorage in sync whenever state changes
  useEffect(() => { save(FISH_KEY,  fishIds)  }, [fishIds])
  useEffect(() => { save(WATER_KEY, waterIds) }, [waterIds])

  const toggleFish  = useCallback((id: string) => setFishIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  ), [])

  const toggleWater = useCallback((id: string) => setWaterIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  ), [])

  const isFishStarred  = useCallback((id: string) => fishIds.includes(id),  [fishIds])
  const isWaterStarred = useCallback((id: string) => waterIds.includes(id), [waterIds])

  return (
    <StarredContext.Provider value={{ starredFishIds: fishIds, starredWaterIds: waterIds, toggleFish, toggleWater, isFishStarred, isWaterStarred }}>
      {children}
    </StarredContext.Provider>
  )
}

// ─── Hook — use anywhere in the tree ──────────────────────────────────────────
export function useStarred() {
  const ctx = useContext(StarredContext)
  if (!ctx) throw new Error('useStarred must be used inside <StarredProvider>')
  return ctx
}

// Backward-compat aliases used by detail sheets
export const useStarredFish   = () => { const { isFishStarred,  toggleFish,  starredFishIds  } = useStarred(); return { isStarred: isFishStarred,  toggle: toggleFish,  ids: starredFishIds  } }
export const useStarredWaters = () => { const { isWaterStarred, toggleWater, starredWaterIds } = useStarred(); return { isStarred: isWaterStarred, toggle: toggleWater, ids: starredWaterIds } }

'use client'
import { useState, useEffect, useCallback } from 'react'

const FISH_KEY   = 'castwa:starred-fish'
const WATER_KEY  = 'castwa:starred-waters'

function useStarredSet(storageKey: string) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setIds(JSON.parse(raw))
    } catch {}
  }, [storageKey])

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }, [storageKey])

  const isStarred = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, toggle, isStarred }
}

export function useStarredFish()   { return useStarredSet(FISH_KEY) }
export function useStarredWaters() { return useStarredSet(WATER_KEY) }

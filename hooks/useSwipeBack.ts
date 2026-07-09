import { useRef, useCallback } from 'react'

/**
 * Returns onTouchStart / onTouchEnd handlers that detect a left→right swipe
 * and call onBack.
 *
 * Thresholds:
 *  - Right displacement ≥ 60 px
 *  - Predominantly horizontal: |dx| > |dy| × 1.5
 *    (prevents false-positives during vertical scrolling)
 *
 * The hook keeps onBack in a ref so the returned handlers are stable
 * (safe to spread onto JSX elements without re-creating on every render).
 */
export function useSwipeBack(onBack: () => void) {
  const startX   = useRef<number | null>(null)
  const startY   = useRef<number | null>(null)
  const callbackRef = useRef(onBack)
  // Keep ref current — safe side-effect in render body (never touches React tree)
  callbackRef.current = onBack

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current
    startX.current = null
    startY.current = null
    // Right-swipe ≥60 px and at least 1.5× more horizontal than vertical
    if (dx >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      callbackRef.current()
    }
  }, [])

  return { onTouchStart, onTouchEnd }
}

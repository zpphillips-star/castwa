import { useRef, useCallback } from 'react'

/**
 * Left-edge swipe-back gesture. Fires onBack only when:
 *  1. Touch starts in the left 25% of the screen
 *  2. Right displacement ≥ 60 px and predominantly horizontal (|dx| > |dy| × 1.5)
 *  3. The touch did NOT originate inside a horizontally scrollable element
 *     (e.g. a tab strip, horizontal list, or image carousel)
 *  4. The touch did NOT originate inside a map container (.leaflet-container)
 */

function isInsideHorizontalScroll(el: EventTarget | null): boolean {
  let node = el as HTMLElement | null
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node)
    const overflowX = style.overflowX
    if ((overflowX === 'auto' || overflowX === 'scroll') && node.scrollWidth > node.clientWidth) {
      return true
    }
    node = node.parentElement
  }
  return false
}

function isInsideMap(el: EventTarget | null): boolean {
  let node = el as HTMLElement | null
  while (node && node !== document.body) {
    if (
      node.classList?.contains('leaflet-container') ||
      node.classList?.contains('leaflet-map-pane') ||
      node.getAttribute?.('data-no-swipe-back') === 'true'
    ) return true
    node = node.parentElement
  }
  return false
}

export function useSwipeBack(onBack: () => void) {
  const startX      = useRef<number | null>(null)
  const startY      = useRef<number | null>(null)
  const armed       = useRef(false)
  const callbackRef = useRef(onBack)
  callbackRef.current = onBack

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    armed.current  = false
    startX.current = null
    startY.current = null

    const touch = e.touches[0]

    // Only arm from left 25% edge
    if (touch.clientX > window.innerWidth * 0.25) return

    // Don't arm inside maps or horizontal scroll containers
    if (isInsideMap(touch.target) || isInsideHorizontalScroll(touch.target)) return

    startX.current = touch.clientX
    startY.current = touch.clientY
    armed.current  = true
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!armed.current || startX.current === null || startY.current === null) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    // If motion is more vertical than horizontal, disarm — user is likely scrolling
    if (Math.abs(dy) > Math.abs(dx)) {
      armed.current = false
    }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!armed.current || startX.current === null || startY.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current
    startX.current = null
    startY.current = null
    armed.current  = false
    if (dx >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      callbackRef.current()
    }
  }, [])

  return { onTouchStart, onTouchMove, onTouchEnd }
}

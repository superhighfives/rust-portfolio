import { useEffect, useRef, useMemo, useCallback, type RefObject } from 'react'

const STORAGE_KEY = 'portfolio-scroll-y'

export interface VirtualScroll {
  targetY: RefObject<number>
  maxScroll: RefObject<number>
  applyScroll: (y: number) => void
}

function getStoredScroll(): number {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored != null) return parseFloat(stored) || 0
  } catch { /* sessionStorage unavailable */ }
  return 0
}

export function useVirtualScroll(contentRef: RefObject<HTMLElement | null>): VirtualScroll {
  const targetY = useRef(getStoredScroll())
  const maxScroll = useRef(0)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    // Apply stored scroll immediately (before WASM loads) to avoid flash
    const initialY = targetY.current
    if (initialY > 0) {
      el.style.transform = `translateY(${-initialY}px)`
    }

    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)

    function updateMaxScroll() {
      const contentHeight = el!.scrollHeight
      maxScroll.current = Math.max(0, contentHeight - window.innerHeight)
    }

    // Measure content
    const ro = new ResizeObserver(updateMaxScroll)
    ro.observe(el)
    updateMaxScroll()

    // Throttled save — at most once per second
    let saveTimer = 0
    function scheduleSave() {
      if (saveTimer) return
      saveTimer = window.setTimeout(() => {
        saveTimer = 0
        try { sessionStorage.setItem(STORAGE_KEY, String(targetY.current)) } catch {}
      }, 1000)
    }

    function saveScroll() {
      try { sessionStorage.setItem(STORAGE_KEY, String(targetY.current)) } catch {}
    }

    // Wheel input
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      targetY.current = Math.min(Math.max(0, targetY.current + e.deltaY), maxScroll.current)
      scheduleSave()
    }

    // Touch input
    let touchStartY = 0
    function onTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0].clientY
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      const delta = touchStartY - e.touches[0].clientY
      touchStartY = e.touches[0].clientY
      targetY.current = Math.min(Math.max(0, targetY.current + delta), maxScroll.current)
      scheduleSave()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('resize', updateMaxScroll)
    window.addEventListener('beforeunload', saveScroll)

    return () => {
      saveScroll()
      clearTimeout(saveTimer)
      document.documentElement.style.overflow = prev
      ro.disconnect()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('resize', updateMaxScroll)
      window.removeEventListener('beforeunload', saveScroll)
    }
  }, [contentRef])

  const applyScroll = useCallback((y: number) => {
    const el = contentRef.current
    if (el) {
      el.style.transform = `translateY(${-y}px)`
    }
  }, [contentRef])

  return useMemo(() => ({ targetY, maxScroll, applyScroll }), [applyScroll])
}

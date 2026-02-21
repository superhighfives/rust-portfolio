import { useEffect, useRef, useCallback, type RefObject } from 'react'
import type { Rect } from '../components/WebGLCanvas'

export function useRectangleMeasure(
  placeholderRefs: RefObject<(HTMLElement | null)[]>
): RefObject<Rect[]> {
  const rectsRef = useRef<Rect[]>([])

  const measure = useCallback(() => {
    const placeholders = placeholderRefs.current
    if (!placeholders) return

    const rects: Rect[] = []
    for (const el of placeholders) {
      if (!el) continue
      rects.push({
        x: el.offsetLeft,
        y: el.offsetTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
      })
    }
    rectsRef.current = rects
  }, [placeholderRefs])

  useEffect(() => {
    measure()

    const placeholders = placeholderRefs.current
    if (!placeholders) return

    const ro = new ResizeObserver(measure)
    for (const el of placeholders) {
      if (el) ro.observe(el)
    }

    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, placeholderRefs])

  return rectsRef
}

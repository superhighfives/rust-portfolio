import { useEffect, useRef, type RefObject } from 'react'
import type { ScrollEngine } from '../../wasm/pkg/portfolio_wasm'

let wasmPromise: Promise<{
  createEngine: () => ScrollEngine
}> | null = null

function getWasm() {
  if (!wasmPromise) {
    wasmPromise = import('../../wasm/pkg/portfolio_wasm').then(async (mod) => {
      await mod.default()
      return {
        createEngine: () => new mod.ScrollEngine(),
      }
    })
  }
  return wasmPromise
}

export interface ScrollRef {
  targetY: RefObject<number>
  maxScroll: RefObject<number>
}

export function useScrollEngine(
  onFrame: (scrollCurrent: number, scrollVelocity: number) => void,
  scrollRef: ScrollRef
) {
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  // Store scrollRef in a ref so the effect doesn't re-run when the object changes
  const scrollRefStable = useRef(scrollRef)
  scrollRefStable.current = scrollRef

  useEffect(() => {
    let cancelled = false
    let engine: ScrollEngine | null = null
    let rafId = 0

    async function init() {
      const wasm = await getWasm()
      if (cancelled) return
      engine = wasm.createEngine()

      // Initialize at the current target so there's no easing on first frame
      const ref = scrollRefStable.current
      const initialY = ref.targetY.current
      engine.set_scroll_target(initialY)
      engine.set_scroll_current(initialY)
      engine.set_scroll_max(ref.maxScroll.current)

      // Fire first frame immediately so text/content is positioned before paint
      onFrameRef.current(initialY, 0)

      rafId = requestAnimationFrame(loop)
    }

    let lastScroll = -1

    function loop() {
      if (cancelled || !engine) return

      const ref = scrollRefStable.current

      try {
        engine.set_scroll_target(ref.targetY.current)
        engine.set_scroll_max(ref.maxScroll.current)
        engine.tick()

        const current = engine.scroll_current()

        // Only run expensive updates when scroll has actually changed
        if (Math.abs(current - lastScroll) > 0.5) {
          lastScroll = current
          onFrameRef.current(current, engine.scroll_velocity())
        }
      } catch {
        return
      }

      rafId = requestAnimationFrame(loop)
    }

    init()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      if (engine) {
        engine.free()
        engine = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

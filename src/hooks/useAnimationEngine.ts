import { useEffect, useRef } from 'react'
import type { AnimationEngine, InitOutput } from '../../wasm/pkg/portfolio_wasm'

// Singleton: ensure wasm is initialized exactly once, even under concurrent calls
let wasmPromise: Promise<{
  createEngine: (count: number, w: number, h: number) => AnimationEngine
  exports: InitOutput
}> | null = null

function getWasm() {
  if (!wasmPromise) {
    wasmPromise = import('../../wasm/pkg/portfolio_wasm').then(async (mod) => {
      const exports = await mod.default()
      return {
        createEngine: (count: number, w: number, h: number) =>
          new mod.AnimationEngine(count, w, h),
        exports,
      }
    })
  }
  return wasmPromise
}

export function useAnimationEngine(
  particleCount: number,
  onFrame: (positions: Float32Array, velocities: Float32Array, count: number) => void
) {
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  useEffect(() => {
    let cancelled = false
    let engine: AnimationEngine | null = null
    let wasmExports: InitOutput | null = null
    let rafId = 0
    let lastTime = 0
    const mouse = { x: -9999, y: -9999 }

    async function init() {
      const wasm = await getWasm()

      if (cancelled) return

      engine = wasm.createEngine(
        particleCount,
        window.innerWidth,
        window.innerHeight
      )
      wasmExports = wasm.exports

      rafId = requestAnimationFrame(loop)
    }

    function loop(time: number) {
      if (cancelled || !engine || !wasmExports) return

      const dt = lastTime ? (time - lastTime) / 1000 : 1 / 60
      lastTime = time

      try {
        engine.update(dt, mouse.x, mouse.y)

        const count = engine.len()
        const posPtr = engine.positions_ptr()
        const velPtr = engine.velocities_ptr()

        const positions = new Float32Array(wasmExports.memory.buffer, posPtr, count * 2)
        const velocities = new Float32Array(wasmExports.memory.buffer, velPtr, count * 2)

        onFrameRef.current(positions, velocities, count)
      } catch {
        // Engine was freed between the check and the call — stop the loop
        return
      }

      rafId = requestAnimationFrame(loop)
    }

    function handleResize() {
      try {
        engine?.resize(window.innerWidth, window.innerHeight)
      } catch {
        // Engine was freed — ignore
      }
    }

    function handleMouseMove(e: MouseEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)

    init()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)

      if (engine) {
        engine.free()
        engine = null
      }
      wasmExports = null
    }
  }, [particleCount])
}

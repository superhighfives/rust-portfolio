import { useEffect, useRef, useCallback, useState } from 'react'
import type { AnimationEngine, InitOutput } from '../../wasm/pkg/portfolio_wasm'

interface EngineState {
  engine: AnimationEngine
  wasm: InitOutput
}

export function useAnimationEngine(
  particleCount: number,
  onFrame: (positions: Float32Array, velocities: Float32Array, count: number) => void
) {
  const engineRef = useRef<EngineState | null>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const [ready, setReady] = useState(false)

  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  // Initialize Wasm module
  useEffect(() => {
    let cancelled = false

    async function init() {
      const mod = await import('../../wasm/pkg/portfolio_wasm')
      const wasmExports = await mod.default()

      if (cancelled) return

      const engine = new mod.AnimationEngine(
        particleCount,
        window.innerWidth,
        window.innerHeight
      )

      engineRef.current = { engine, wasm: wasmExports }
      setReady(true)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [particleCount])

  // Animation loop
  useEffect(() => {
    if (!ready || !engineRef.current) return

    const { engine, wasm } = engineRef.current

    function loop(time: number) {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 1 / 60
      lastTimeRef.current = time

      engine.update(dt, mouseRef.current.x, mouseRef.current.y)

      const count = engine.len()
      const posPtr = engine.positions_ptr()
      const velPtr = engine.velocities_ptr()

      // Zero-copy: read directly from Wasm linear memory
      const positions = new Float32Array(wasm.memory.buffer, posPtr, count * 2)
      const velocities = new Float32Array(wasm.memory.buffer, velPtr, count * 2)

      onFrameRef.current(positions, velocities, count)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [ready])

  // Handle resize
  useEffect(() => {
    if (!ready || !engineRef.current) return

    function handleResize() {
      engineRef.current?.engine.resize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [ready])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX
    mouseRef.current.y = e.clientY
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return { ready }
}

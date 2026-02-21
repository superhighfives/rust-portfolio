import { useRef, useCallback } from 'react'
import WebGLCanvas from './components/WebGLCanvas'
import Portfolio from './components/Portfolio'
import BatteryIndicator from './components/BatteryIndicator'
import { useVirtualScroll } from './hooks/useVirtualScroll'
import { useScrollEngine } from './hooks/useScrollEngine'
import { useRectangleMeasure } from './hooks/useRectangleMeasure'
import { useTextAnimation } from './hooks/useTextAnimation'
import './App.css'

const RECT_COUNT = 7

export default function App() {
  const contentRef = useRef<HTMLElement>(null)
  const placeholderRefs = useRef<(HTMLElement | null)[]>(Array(RECT_COUNT).fill(null))
  const scrollCurrentRef = useRef(0)

  const scroll = useVirtualScroll(contentRef)
  const rectanglesRef = useRectangleMeasure(placeholderRefs)
  const textAnim = useTextAnimation(contentRef)

  const onFrame = useCallback((scrollCurrent: number, _scrollVelocity: number) => {
    scrollCurrentRef.current = scrollCurrent

    // Position HTML content
    scroll.applyScroll(scrollCurrent)

    // Animate text
    textAnim.update(scrollCurrent)

    // Draw WebGL rectangles
    const canvas = document.querySelector('canvas')
    if (canvas && (canvas as any).__draw) {
      ;(canvas as any).__draw()
    }
  }, [scroll, textAnim])

  useScrollEngine(onFrame, scroll)

  return (
    <>
      <BatteryIndicator />
      <WebGLCanvas scrollCurrentRef={scrollCurrentRef} rectanglesRef={rectanglesRef} />
      <Portfolio ref={contentRef} placeholderRefs={placeholderRefs} />
    </>
  )
}

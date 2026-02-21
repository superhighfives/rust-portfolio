import { useRef, useCallback, type RefObject } from 'react'

const STAGGER = 0.06       // delay per word (as fraction of revealRange)
const REVEAL_RANGE = 400   // px range over which the reveal happens
const TRIGGER_OFFSET = 0.7 // trigger when section is 70% down viewport
const WORD_Y_OFFSET = 20   // px vertical offset for unrevealed words

interface SectionData {
  words: HTMLElement[]
  el: HTMLElement
}

export function useTextAnimation(contentRef: RefObject<HTMLElement | null>) {
  const sectionsRef = useRef<SectionData[]>([])

  const refresh = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    const animated = el.querySelectorAll('[data-animated]')
    sectionsRef.current = Array.from(animated).map(section => ({
      el: section as HTMLElement,
      words: Array.from(section.querySelectorAll('.word')) as HTMLElement[],
    }))
  }, [contentRef])

  const update = useCallback((_scrollCurrent: number) => {
    const sections = sectionsRef.current
    if (sections.length === 0) {
      refresh()
      if (sectionsRef.current.length === 0) return
    }

    const viewportH = window.innerHeight
    const triggerY = viewportH * TRIGGER_OFFSET

    // Batch reads: get all section positions first (avoids layout thrashing)
    const progresses: number[] = []
    for (const { el } of sectionsRef.current) {
      const top = el.getBoundingClientRect().top
      progresses.push(1 - (top - triggerY) / REVEAL_RANGE)
    }

    // Batch writes: update all word styles
    for (let s = 0; s < sectionsRef.current.length; s++) {
      const { words } = sectionsRef.current[s]
      const progress = progresses[s]

      for (let i = 0; i < words.length; i++) {
        const wordProgress = (progress - i * STAGGER) * 3
        const opacity = Math.min(Math.max(wordProgress, 0), 1)
        const y = (1 - opacity) * WORD_Y_OFFSET

        words[i].style.opacity = String(opacity)
        words[i].style.transform = `translateY(${y}px)`
      }
    }
  }, [refresh])

  return { update, refresh }
}

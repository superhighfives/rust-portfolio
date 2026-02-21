import { forwardRef, useCallback, type RefObject } from 'react'
import AnimatedText from './AnimatedText'

interface PortfolioProps {
  placeholderRefs: RefObject<(HTMLElement | null)[]>
}

const Portfolio = forwardRef<HTMLElement, PortfolioProps>(function Portfolio({ placeholderRefs }, ref) {
  const setPlaceholderRef = useCallback((index: number) => (el: HTMLElement | null) => {
    if (placeholderRefs.current) {
      placeholderRefs.current[index] = el
    }
  }, [placeholderRefs])

  return (
    <main className="portfolio" ref={ref}>
      {/* Grid lines overlay */}
      <div className="grid-lines">
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="grid-col" />
        ))}
      </div>

      {/* Hero */}
      <section className="section hero">
        <div className="col-left hero-left">
          <h1><AnimatedText text="Creative Developer" as="span" /></h1>
          <span className="meta">PORTFOLIO — 2026</span>
        </div>
        <div className="col-center rect-placeholder" ref={setPlaceholderRef(0)} />
        <div className="col-right hero-right">
          <span className="meta">AVAILABLE FOR SELECT PROJECTS</span>
        </div>
      </section>

      {/* Project: Wasm Physics */}
      <section className="section project">
        <div className="col-left">
          <h2><AnimatedText text="Wasm Physics" as="span" /></h2>
          <span className="meta">SIMULATION ENGINE — 2026</span>
        </div>
        <div className="col-center rect-placeholder" ref={setPlaceholderRef(1)} />
        <div className="col-right">
          <AnimatedText
            text="Real-time spring dynamics and particle simulation running at 60fps, computed entirely in Rust compiled to WebAssembly with zero-copy memory sharing."
            as="p"
          />
          <span className="meta">RUST · WEBASSEMBLY · 60FPS</span>
        </div>
      </section>

      {/* Project: WebGL Renderer */}
      <section className="section project">
        <div className="col-left">
          <h2><AnimatedText text="WebGL Renderer" as="span" /></h2>
          <span className="meta">GRAPHICS ENGINE — 2026</span>
        </div>
        <div className="col-center rect-placeholder" ref={setPlaceholderRef(2)} />
        <div className="col-right">
          <AnimatedText
            text="Custom WebGL2 rendering pipeline with instanced geometry, GPU-accelerated compositing, and shader-driven visual effects."
            as="p"
          />
          <span className="meta">WEBGL2 · GLSL · TYPESCRIPT</span>
        </div>
      </section>

      {/* Feature: Cascade-style */}
      <section className="section feature">
        <div className="feature-title">
          <h2><AnimatedText text="Motion with purpose and precision" as="span" /></h2>
        </div>
        <div className="feature-rect rect-placeholder rect-wide" ref={setPlaceholderRef(3)} />
        <div className="feature-desc">
          <AnimatedText
            text="Springs that feel real, gestures that respond instantly, and scroll animations that just work. Momentum calculations in Rust give us perfect fluidity at every frame."
            as="p"
          />
          <span className="meta">TYPESCRIPT · WASM · &lt;4KB</span>
        </div>
      </section>

      {/* Project: Edge Deploy */}
      <section className="section project">
        <div className="col-left">
          <h2><AnimatedText text="Edge Deploy" as="span" /></h2>
          <span className="meta">INFRASTRUCTURE — 2026</span>
        </div>
        <div className="col-center rect-placeholder" ref={setPlaceholderRef(4)} />
        <div className="col-right">
          <AnimatedText
            text="Static assets deployed to Cloudflare's global edge network for sub-50ms load times worldwide. Zero cold starts, instant invalidation."
            as="p"
          />
          <span className="meta">CLOUDFLARE · WORKERS · WRANGLER</span>
        </div>
      </section>

      {/* Dark section */}
      <section className="section dark-section">
        <div className="dark-content">
          <h2><AnimatedText text="Animate everything" as="span" /></h2>
          <AnimatedText
            text="Spring dynamics and momentum for every interaction. No more guessing at cubic-bezier values."
            as="p"
          />
          <span className="meta dark-meta">OPEN SOURCE</span>
        </div>
      </section>

      {/* About */}
      <section className="section about-section">
        <div className="about-title">
          <h2>
            <AnimatedText
              text="Crafting interfaces at the intersection of design and engineering"
              as="span"
            />
          </h2>
        </div>
        <div className="about-rect rect-placeholder rect-wide" ref={setPlaceholderRef(5)} />
        <div className="about-desc">
          <AnimatedText
            text="I believe the best digital products feel inevitable — as though they couldn't have been made any other way. My work focuses on performance-first architecture, fluid motion, and the small details that separate good from exceptional."
            as="p"
          />
          <span className="meta">SAN FRANCISCO, CA</span>
        </div>
      </section>

      {/* Footer */}
      <section className="section footer-section">
        <div className="col-left">
          <h2><AnimatedText text="Let's Build Together" as="span" /></h2>
          <span className="meta">GET IN TOUCH</span>
        </div>
        <div className="col-center rect-placeholder" ref={setPlaceholderRef(6)} />
        <div className="col-right footer-right">
          <span className="meta">HELLO@CHARLIE.DEV</span>
          <span className="meta">@CHARLIE</span>
        </div>
      </section>
    </main>
  )
})

export default Portfolio

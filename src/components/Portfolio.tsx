export default function Portfolio() {
  return (
    <main className="portfolio">
      <section className="hero">
        <h1>Hey, I'm Charlie.</h1>
        <p className="subtitle">
          Creative developer building at the intersection of design and engineering.
        </p>
      </section>

      <section className="about">
        <h2>About</h2>
        <p>
          I craft performant, interactive experiences for the web. This site itself is
          powered by Rust compiled to WebAssembly — handling physics simulations for
          the particle field you see behind this text — with WebGL rendering the
          visuals, and plain HTML/CSS for the content you're reading now.
        </p>
      </section>

      <section className="projects">
        <h2>Projects</h2>
        <ul className="project-list">
          <li>
            <h3>Wasm Physics Engine</h3>
            <p>
              Real-time spring dynamics and particle simulation running at 60fps,
              computed entirely in Rust/WebAssembly.
            </p>
          </li>
          <li>
            <h3>WebGL Renderer</h3>
            <p>
              Custom WebGL2 particle renderer with soft glow shaders, zero-copy
              memory sharing between Wasm and GPU.
            </p>
          </li>
          <li>
            <h3>Edge Deployment</h3>
            <p>
              Static site deployed to Cloudflare's global edge network for
              sub-50ms load times worldwide.
            </p>
          </li>
        </ul>
      </section>

      <section className="contact">
        <h2>Get in touch</h2>
        <p>
          Interested in working together?{' '}
          <a href="mailto:hello@example.com">Drop me a line</a>.
        </p>
      </section>
    </main>
  )
}

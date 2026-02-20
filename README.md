# Rust Portfolio

A creative developer portfolio powered by Rust/WebAssembly particle physics and WebGL2 rendering, deployed to Cloudflare Workers.

**Demo:** https://rust-portfolio.superhighfives.workers.dev/

## Stack

- **Rust → WebAssembly** — Spring-based particle physics (1500 particles at 60fps)
- **WebGL2** — GPU-accelerated rendering with additive blending and velocity-reactive shaders
- **React + TypeScript + Vite** — UI and build tooling
- **Cloudflare Workers** — Edge deployment via static assets

## Development

```sh
npm install
npm run dev        # Vite + cargo-watch for WASM hot-reload
```

## Deploy

```sh
npm run deploy     # Build + deploy to Cloudflare Workers
```

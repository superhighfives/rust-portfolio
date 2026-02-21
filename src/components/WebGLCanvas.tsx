import { useRef, useEffect, useCallback, type RefObject } from 'react'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const VERTEX_SHADER = `#version 300 es
  in vec2 a_quad;
  in vec4 a_rect;
  in float a_anim;

  uniform float u_scroll;
  uniform vec2 u_resolution;

  out vec2 v_uv;
  flat out int v_anim;

  void main() {
    v_uv = a_quad;
    v_anim = int(a_anim);

    vec2 pos = a_rect.xy + a_quad * a_rect.zw;
    pos.y -= u_scroll;

    vec2 clip = (pos / u_resolution) * 2.0 - 1.0;
    clip.y *= -1.0;

    gl_Position = vec4(clip, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `#version 300 es
  precision mediump float;

  in vec2 v_uv;
  flat in int v_anim;

  uniform float u_scroll_pos;

  out vec4 outColor;

  void main() {
    vec2 uv = v_uv;
    float s = u_scroll_pos * 0.003;

    vec3 cream  = vec3(0.98, 0.95, 0.92);
    vec3 rose   = vec3(0.85, 0.55, 0.50);
    vec3 peach  = vec3(0.95, 0.70, 0.55);
    vec3 mauve  = vec3(0.70, 0.50, 0.60);
    vec3 sand   = vec3(0.92, 0.85, 0.72);
    vec3 slate  = vec3(0.55, 0.52, 0.58);
    vec3 blush  = vec3(0.90, 0.75, 0.72);

    vec3 color;

    if (v_anim == 0) {
      // Plasma — layered sines
      float v1 = sin(uv.x * 4.0 + s * 2.0);
      float v2 = sin(uv.y * 3.0 + s * 1.3);
      float v3 = sin((uv.x + uv.y) * 3.5 - s * 1.7);
      float val = (v1 + v2 + v3) / 3.0 * 0.5 + 0.5;
      color = mix(mauve, peach, val);

    } else if (v_anim == 1) {
      // Warped stripes — sine distortion
      float warp = sin(uv.y * 5.0 + s * 0.6) * 0.15;
      float stripe = sin((uv.x + warp) * 8.0 + s * 0.9) * 0.5 + 0.5;
      color = mix(slate, sand, stripe);

    } else if (v_anim == 2) {
      // Ripples — concentric rings
      vec2 center = vec2(0.5 + sin(s * 0.8) * 0.2, 0.5 + cos(s * 0.6) * 0.2);
      float dist = length(uv - center);
      float ripple = sin(dist * 18.0 - s * 4.0) * 0.5 + 0.5;
      ripple = ripple * ripple;
      color = mix(rose, cream, ripple);

    } else if (v_anim == 3) {
      // Spiral
      vec2 c = uv - 0.5;
      float angle = atan(c.y, c.x) + s * 2.5;
      float r = length(c);
      float spiral = sin(angle * 3.0 + r * 12.0 - s * 1.5) * 0.5 + 0.5;
      color = mix(mauve, blush, spiral);

    } else if (v_anim == 4) {
      // Grid
      vec2 g = fract(uv * 5.0 + vec2(s * 0.4, s * 0.6));
      float gx = smoothstep(0.0, 0.08, g.x) * smoothstep(0.0, 0.08, 1.0 - g.x);
      float gy = smoothstep(0.0, 0.08, g.y) * smoothstep(0.0, 0.08, 1.0 - g.y);
      float grid = 1.0 - gx * gy;
      float pulse = sin(uv.x * 4.0 + uv.y * 3.0 + s * 2.5) * 0.5 + 0.5;
      color = mix(slate, peach, grid * 0.7 + pulse * 0.3);

    } else if (v_anim == 5) {
      // Moiré interference
      float a = sin(uv.x * 12.0 + s * 0.7) * 0.5 + 0.5;
      float b = sin(uv.y * 10.0 - s * 0.5) * 0.5 + 0.5;
      float c = sin((uv.x * 8.0 + uv.y * 8.0) + s * 0.9) * 0.5 + 0.5;
      float val = (a + b + c) / 3.0;
      color = mix(rose, sand, val);

    } else {
      // Diagonal sweep
      float sweep = uv.x * 0.6 + uv.y * 0.4;
      float wave = sin(sweep * 8.0 - s * 3.0) * 0.5 + 0.5;
      float detail = sin(uv.x * 12.0 + uv.y * 8.0 + s * 1.2) * 0.15;
      float val = wave + detail;
      color = mix(mauve, cream, val);
    }

    outColor = vec4(color, 1.0);
  }
`

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error: ${info}`)
  }
  return shader
}

function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`Program link error: ${info}`)
  }
  return program
}

interface GLState {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  vao: WebGLVertexArrayObject
  rectBuffer: WebGLBuffer
  animBuffer: WebGLBuffer
  scrollLoc: WebGLUniformLocation
  resLoc: WebGLUniformLocation
  scrollPosLoc: WebGLUniformLocation
}

interface WebGLCanvasProps {
  scrollCurrentRef: RefObject<number>
  rectanglesRef: RefObject<Rect[]>
}

export default function WebGLCanvas({ scrollCurrentRef, rectanglesRef }: WebGLCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glStateRef = useRef<GLState | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false })!

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    const program = createProgram(gl, vs, fs)

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)

    // Unit quad: 2 triangles covering (0,0)→(1,1)
    const quadVerts = new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1,
    ])
    const quadBuffer = gl.createBuffer()!
    const quadLoc = gl.getAttribLocation(program, 'a_quad')
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(quadLoc)
    gl.vertexAttribPointer(quadLoc, 2, gl.FLOAT, false, 0, 0)

    // Per-instance rectangle data (x, y, w, h)
    const rectBuffer = gl.createBuffer()!
    const rectLoc = gl.getAttribLocation(program, 'a_rect')
    gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer)
    gl.enableVertexAttribArray(rectLoc)
    gl.vertexAttribPointer(rectLoc, 4, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(rectLoc, 1)

    // Per-instance animation type
    const animBuffer = gl.createBuffer()!
    const animLoc = gl.getAttribLocation(program, 'a_anim')
    gl.bindBuffer(gl.ARRAY_BUFFER, animBuffer)
    gl.enableVertexAttribArray(animLoc)
    gl.vertexAttribPointer(animLoc, 1, gl.FLOAT, false, 0, 0)
    gl.vertexAttribDivisor(animLoc, 1)

    gl.bindVertexArray(null)

    const scrollLoc = gl.getUniformLocation(program, 'u_scroll')!
    const resLoc = gl.getUniformLocation(program, 'u_resolution')!
    const scrollPosLoc = gl.getUniformLocation(program, 'u_scroll_pos')!

    glStateRef.current = { gl, program, vao, rectBuffer, animBuffer, scrollLoc, resLoc, scrollPosLoc }

    function resize() {
      const dpr = devicePixelRatio
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const draw = useCallback(() => {
    const state = glStateRef.current
    if (!state) return

    const { gl, program, vao, rectBuffer, animBuffer, scrollLoc, resLoc, scrollPosLoc } = state
    const rects = rectanglesRef.current
    const scrollCurrent = scrollCurrentRef.current

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    if (rects.length === 0) return

    gl.useProgram(program)
    gl.uniform1f(scrollLoc, scrollCurrent)
    gl.uniform2f(resLoc, window.innerWidth, window.innerHeight)
    gl.uniform1f(scrollPosLoc, scrollCurrent)

    // Upload rectangle positions
    const rectData = new Float32Array(rects.length * 4)
    for (let i = 0; i < rects.length; i++) {
      rectData[i * 4] = rects[i].x
      rectData[i * 4 + 1] = rects[i].y
      rectData[i * 4 + 2] = rects[i].w
      rectData[i * 4 + 3] = rects[i].h
    }

    // Upload animation types (each rectangle gets a unique effect)
    const animData = new Float32Array(rects.length)
    for (let i = 0; i < rects.length; i++) {
      animData[i] = i % 7
    }

    gl.bindVertexArray(vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, rectData, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, animBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, animData, gl.DYNAMIC_DRAW)

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, rects.length)
    gl.bindVertexArray(null)
  }, [rectanglesRef, scrollCurrentRef])

  // Expose draw for external RAF loop
  const drawRef = useRef(draw)
  drawRef.current = draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      ;(canvas as any).__draw = () => drawRef.current()
    }
  })

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

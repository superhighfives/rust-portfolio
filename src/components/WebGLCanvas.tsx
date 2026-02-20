import { useRef, useEffect, useCallback } from 'react'
import { useAnimationEngine } from '../hooks/useAnimationEngine'

const PARTICLE_COUNT = 1500

const VERTEX_SHADER = `#version 300 es
  in vec2 a_position;
  in float a_velocity;
  uniform vec2 u_resolution;

  out float v_velocity;

  void main() {
    // Convert pixel coords to clip space (-1 to 1)
    vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
    clipSpace.y *= -1.0; // Flip Y for screen coords

    gl_Position = vec4(clipSpace, 0.0, 1.0);

    // Pass velocity to fragment shader
    v_velocity = a_velocity;

    // Point size varies with velocity — bigger and more dramatic
    gl_PointSize = 3.0 + a_velocity * 12.0;
  }
`

const FRAGMENT_SHADER = `#version 300 es
  precision mediump float;

  in float v_velocity;
  out vec4 outColor;

  void main() {
    // Soft circle
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.0, dist);
    // Shift from cool blue at rest to hot white/pink when moving fast
    float brightness = 0.4 + v_velocity * 0.8;
    vec3 coolColor = vec3(0.3, 0.4, 0.9);   // blue at rest
    vec3 hotColor = vec3(1.0, 0.7, 0.9);     // hot pink/white when fast
    vec3 color = mix(coolColor, hotColor, v_velocity);
    outColor = vec4(color, alpha * brightness);
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
  posBuffer: WebGLBuffer
  velBuffer: WebGLBuffer
  posLoc: number
  velLoc: number
  resLoc: WebGLUniformLocation
  vao: WebGLVertexArrayObject
}

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glStateRef = useRef<GLState | null>(null)

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false })!

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    const program = createProgram(gl, vs, fs)

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)

    const posBuffer = gl.createBuffer()!
    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const velBuffer = gl.createBuffer()!
    const velLoc = gl.getAttribLocation(program, 'a_velocity')
    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer)
    gl.enableVertexAttribArray(velLoc)
    gl.vertexAttribPointer(velLoc, 1, gl.FLOAT, false, 0, 0)

    gl.bindVertexArray(null)

    const resLoc = gl.getUniformLocation(program, 'u_resolution')!

    glStateRef.current = { gl, program, posBuffer, velBuffer, posLoc, velLoc, resLoc, vao }

    function resize() {
      canvas.width = window.innerWidth * devicePixelRatio
      canvas.height = window.innerHeight * devicePixelRatio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Frame callback: upload positions to GPU and draw
  const onFrame = useCallback((positions: Float32Array, velocities: Float32Array, count: number) => {
    const state = glStateRef.current
    if (!state) return

    const { gl, program, posBuffer, velBuffer, resLoc, vao } = state

    // Compute velocity magnitudes for each particle
    const velMagnitudes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const vx = velocities[i * 2]
      const vy = velocities[i * 2 + 1]
      velMagnitudes[i] = Math.min(Math.sqrt(vx * vx + vy * vy) / 5, 1.0)
    }

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE) // Additive blending for glow

    gl.useProgram(program)
    gl.uniform2f(resLoc, window.innerWidth, window.innerHeight)

    gl.bindVertexArray(vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, velMagnitudes, gl.DYNAMIC_DRAW)

    gl.drawArrays(gl.POINTS, 0, count)
    gl.bindVertexArray(null)
  }, [])

  useAnimationEngine(PARTICLE_COUNT, onFrame)

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  )
}

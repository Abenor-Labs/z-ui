'use client'

import * as React from 'react'

const VERT = `attribute vec2 a_position;
varying vec2 v_uv;
void main(){ v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`

/**
 * Two soft lights over the page's own ground colour.
 *
 * The floor is #0f0c09 exactly — --color-chassis, the warm near-black the rest
 * of the site sits on — so this can be composited at full opacity and the hero
 * still starts from the page's own ground. The lights
 * are then free to have real range — dimming the whole canvas instead, as the
 * original spec did, costs the glow far more than it costs the floor and leaves
 * a gradient that measures a couple of RGB steps.
 *
 * Aspect correction on the distances, or the falloff is an ellipse on a wide
 * viewport and the light looks smeared sideways.
 */
const FRAG = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_uv;

void main(){
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  vec2 mouse = u_mouse / u_resolution;

  float t = u_time * 0.32;
  vec2 p1 = vec2(0.34 + 0.16 * cos(t),        0.62 + 0.14 * sin(t));
  vec2 p2 = vec2(0.72 + 0.13 * cos(t + 2.1),  0.34 + 0.12 * sin(t + 2.1));

  float d1 = distance(vec2(uv.x * aspect, uv.y), vec2(p1.x * aspect, p1.y));
  float d2 = distance(vec2(uv.x * aspect, uv.y), vec2(p2.x * aspect, p2.y));
  float dm = distance(vec2(uv.x * aspect, uv.y), vec2(mouse.x * aspect, mouse.y));

  // --color-chassis #0f0c09 as 0..1, byte for byte. The old floor was a hair
  // blue (b > r) where the page ground is warm (r > g > b), which showed as a
  // seam wherever the lights fell off to nothing and the canvas met the page.
  vec3 color = vec3(0.059, 0.047, 0.035);

  // A warm key and a sand fill. These are light colours, not surface colours:
  // the key sits on the tungsten side of --color-control #7e7161, the fill
  // between --color-control and Silkscreen Sand, so the two still separate by
  // temperature the way they used to separate by hue and never read as one
  // blob. Warm light carries far more luminance per unit than the indigo did,
  // so the multipliers come down with it — at peak the key lifts the ground
  // about one Panel Grey step, to roughly #382f24, which is the milled amount.
  color += pow(smoothstep(0.78, 0.0, d1), 2.2) * vec3(1.00, 0.86, 0.66) * 0.16;
  color += pow(smoothstep(0.64, 0.0, d2), 2.4) * vec3(0.92, 0.86, 0.76) * 0.11;
  // The pointer light is the hottest and the least chromatic of the three — a
  // warm white, the lamp in the user's hand. Not mint: it is drawn at the
  // canvas centre before the pointer has ever moved, so by the Moving Part Rule
  // it is on screen at rest and cannot carry the accent.
  color += pow(smoothstep(0.42, 0.0, dm), 2.2) * vec3(1.00, 0.93, 0.83) * 0.13;

  // The headline sits in the upper left. Pull the ceiling down across that
  // corner so the lights stay a background and never contest the type.
  float text = smoothstep(0.75, 0.15, uv.x) * smoothstep(0.15, 0.72, uv.y);
  color *= 1.0 - 0.42 * text;

  // Dither. Eight-bit output across a gradient this wide bands visibly, and a
  // little noise is cheaper than a higher bit depth.
  float n = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  color += (n - 0.5) * 0.016;

  gl_FragColor = vec4(color, 1.0);
}`

/**
 * The hero ground: two soft light sources, fixed, plus one that follows the
 * pointer.
 *
 * `u_time` used to drive p1/p2 around a slow orbit on every frame — motion
 * nobody touched, which DESIGN.md forbids by name regardless of how gentle it
 * is. It is now pinned to a single value, so p1/p2 sit at one fixed position
 * and the only thing that still moves is the pointer light, redrawn on
 * `pointermove` rather than on a running clock. Rendered at two-thirds
 * resolution: it is a low-frequency gradient, so nothing about it survives
 * being sampled finer, and the fill cost drops accordingly.
 */
export function ShaderBackground({ className }: { className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const gl =
      canvas.getContext('webgl', { antialias: false, depth: false, alpha: false }) ??
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)

    // No WebGL is not an error worth reporting; the section reads fine without it.
    if (!gl) return

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)
      if (!s) return null
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
    }

    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    // Two-thirds resolution. The image is all low-frequency falloff, so nothing
    // in it survives being sampled finer, but half-res was soft enough to read
    // as a blur once the lights had real contrast.
    const sync = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * 0.66))
      const h = Math.max(1, Math.round(canvas.clientHeight * 0.66))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    // Pinned. p1/p2 in the shader are a function of u_time alone, so a fixed
    // value is a fixed light position — the exact value doesn't matter, only
    // that it never advances on its own.
    const FROZEN_TIME = 4.2

    const mouse = { x: 0.5, y: 0.5 }
    let raf = 0
    let visible = false

    const draw = () => {
      sync()
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(uTime, FROZEN_TIME)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform2f(uMouse, mouse.x * canvas.width, mouse.y * canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // One frame per real change (pointer moved, canvas resized, canvas came
    // into view), not one frame forever. There is no clock left to drive an
    // idle loop, and coalescing into a single rAF keeps rapid pointermove
    // events from queuing up redundant paints.
    const requestDraw = () => {
      if (raf || !visible || document.hidden) return
      raf = requestAnimationFrame(() => {
        raf = 0
        draw()
      })
    }

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      mouse.x = (e.clientX - r.left) / r.width
      mouse.y = 1 - (e.clientY - r.top) / r.height
      requestDraw()
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      if (visible) requestDraw()
    })
    io.observe(canvas)

    const ro = new ResizeObserver(() => {
      // Resizing reallocates the drawing buffer, which clears it.
      requestDraw()
    })
    ro.observe(canvas)

    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('visibilitychange', requestDraw)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', requestDraw)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
      // Deliberately not `WEBGL_lose_context.loseContext()`. Losing a context is
      // permanent for the canvas element: a later `getContext` hands back the
      // same dead object rather than a fresh one. Under StrictMode's double
      // effect invocation that kills the background on mount, and it would do
      // the same on any remount. Deleting the resources is the whole job.
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={className} />
}

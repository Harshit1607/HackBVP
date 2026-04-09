'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { SensingFrame } from '@/lib/types'

interface WifiVisualizationProps {
  frame: SensingFrame | null
  connected: boolean
}

const PERSON_ROOTS: Array<{ x: number, z: number }> = [
  { x: 0.0, z: 0.0 },
  { x: 2.0, z: 0.5 },
  { x: -1.5, z: 1.0 },
]

const HEAT_RES = 32

const SKELETON_EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6],
  [5, 7], [7, 9],
  [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
]

function buildSkeletonKeypoints(
  rootX: number,
  rootZ: number,
  breathScale: number,
  walkPhase: number = 0,
  angle: number = 0
): THREE.Vector3[] {
  const s = breathScale
  const wp = walkPhase

  const stride = 0.25
  const armSwing = 0.3

  const lLegSwing = Math.sin(wp) * stride
  const rLegSwing = Math.sin(wp + Math.PI) * stride
  const lArmSwing = Math.sin(wp + Math.PI) * armSwing
  const rArmSwing = Math.sin(wp) * armSwing
  const lKnee = Math.max(0, Math.sin(wp + 0.5)) * 0.3
  const rKnee = Math.max(0, Math.sin(wp + Math.PI + 0.5)) * 0.3

  const localKeypoints = [
    new THREE.Vector3(0, 1.75 * s, 0),
    new THREE.Vector3(-0.07, 1.72 * s, 0),
    new THREE.Vector3(0.07, 1.72 * s, 0),
    new THREE.Vector3(-0.12, 1.68 * s, 0),
    new THREE.Vector3(0.12, 1.68 * s, 0),
    new THREE.Vector3(-0.22, 1.45 * s, lArmSwing * 0.2),
    new THREE.Vector3(0.22, 1.45 * s, rArmSwing * 0.2),
    new THREE.Vector3(-0.35, 1.1 * s, lArmSwing),
    new THREE.Vector3(0.35, 1.1 * s, rArmSwing),
    new THREE.Vector3(-0.38, 0.78 * s, lArmSwing * 1.2),
    new THREE.Vector3(0.38, 0.78 * s, rArmSwing * 1.2),
    new THREE.Vector3(-0.14, 0.95 * s, 0),
    new THREE.Vector3(0.14, 0.95 * s, 0),
    new THREE.Vector3(-0.16, 0.52 * s, lLegSwing + lKnee * 0.2),
    new THREE.Vector3(0.16, 0.52 * s, rLegSwing + rKnee * 0.2),
    new THREE.Vector3(-0.16, 0.04, lLegSwing),
    new THREE.Vector3(0.16, 0.04, rLegSwing),
  ]

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return localKeypoints.map(p => {
    const rx = p.x * cos + p.z * sin
    const rz = -p.x * sin + p.z * cos
    return new THREE.Vector3(rx + rootX, p.y, rz + rootZ)
  })
}

export default function WifiVisualization({ frame, connected }: WifiVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<SensingFrame | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const orbitRef = useRef({
    targetTheta: 0.3,
    currentTheta: 0.3,
    targetPhi: 0.45,
    currentPhi: 0.45,
    targetRadius: 9,
    currentRadius: 9,
    isOrbiting: false
  })
  const lastStateRef = useRef({ lastX: 0, lastY: 0, active: false })
  const lastPinchDistRef = useRef(0)

  useEffect(() => {
    frameRef.current = frame
  }, [frame])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    let themeObserver: MutationObserver | null = null
    const checkLight = () => document.documentElement.getAttribute('data-theme') === 'light'

    // ── Scene objects (closure vars) ──────────────────────────────────
    let scene: THREE.Scene
    let ground: THREE.Mesh
    let waveSpheres: THREE.Mesh[] = []
    let node: THREE.Mesh
    let figureData: any[] = []
    let grid: THREE.GridHelper
    let heatMesh: THREE.Points
    let heatGeo: THREE.BufferGeometry

    const syncThemeColors = () => {
      const styles = getComputedStyle(document.documentElement)
      const parse = (v: string) => {
        const m = styles.getPropertyValue(v).match(/\d+/g)
        return m ? (parseInt(m[0]) << 16) | (parseInt(m[1]) << 8) | parseInt(m[2]) : 0x000000
      }
      const bg = parse('--color-bg-primary')
      const surface = parse('--color-surface-secondary')
      const earth = parse('--color-acc-earth')
      const water = parse('--color-acc-water')
      const text = parse('--color-text-primary')
      const isLight = checkLight()

      scene.background = new THREE.Color(bg)
      ;(ground.material as THREE.MeshLambertMaterial).color.setHex(isLight ? bg : surface)

      const gridMat = grid.material as THREE.LineBasicMaterial
      gridMat.color.setHex(text)
      gridMat.opacity = isLight ? 0.08 : 0.05
      gridMat.transparent = true

      const finalEarth = isLight ? 0x000000 : earth
      const finalWater = water

      waveSpheres.forEach(s => {
        const sMat = s.material as THREE.MeshBasicMaterial
        sMat.color.setHex(finalWater)
        sMat.opacity = isLight ? 0.4 : 0.8
      })

      const nodeMat = node.material as THREE.MeshLambertMaterial
      nodeMat.color.setHex(finalWater)
      nodeMat.emissive.setHex(finalWater)
      nodeMat.emissiveIntensity = isLight ? 0.1 : 1.2

      figureData.forEach(fd => {
        fd.joints.forEach((j: THREE.Mesh) => {
          const jMat = j.material as THREE.MeshStandardMaterial
          jMat.color.setHex(finalEarth)
          jMat.emissive.setHex(finalEarth)
          jMat.emissiveIntensity = isLight ? 0 : 1.0
        })
        fd.bones.forEach((b: THREE.Line) => {
          const bMat = b.material as THREE.LineBasicMaterial
          bMat.color.setHex(finalEarth)
          bMat.opacity = 1.0
        })
      })
    }

    // ── Initialization ────────────────────────────────────────────────
    scene = new THREE.Scene()
    const aspect = container.clientWidth / container.clientHeight
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth; const h = container.clientHeight
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h)
    })
    ro.observe(container)

    // Ground & Grid
    ground = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshLambertMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    grid = new THREE.GridHelper(14, 20, 0x2d3748, 0x1e2024)
    grid.position.y = 0.002
    scene.add(grid)

    // WiFi node + expanding spheres
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const waveGeo = new THREE.IcosahedronGeometry(1, 2)
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(waveGeo, new THREE.MeshBasicMaterial({
        wireframe: true, transparent: true, depthWrite: false, clippingPlanes: [clipPlane]
      }))
      s.position.set(-3, 0.5, -2)
      s.userData.phase = i / 3
      scene.add(s)
      waveSpheres.push(s)
    }
    renderer.localClippingEnabled = true
    node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), new THREE.MeshLambertMaterial())
    node.position.set(-3, 0.5, -2)
    node.castShadow = true
    scene.add(node)

    // Skeleton figures
    figureData = PERSON_ROOTS.map(() => {
      const group = new THREE.Group(); scene.add(group)
      const joints: THREE.Mesh[] = []
      const bones: THREE.Line[] = []
      for (let i = 0; i < 17; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshStandardMaterial())
        group.add(m); joints.push(m)
      }
      SKELETON_EDGES.forEach(() => {
        const l = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ transparent: true }))
        group.add(l); bones.push(l)
      })
      return { group, joints, bones }
    })

    // Heatmap (floor points)
    heatGeo = new THREE.BufferGeometry()
    const heatPositions = new Float32Array(HEAT_RES * HEAT_RES * 3)
    const heatColors = new Float32Array(HEAT_RES * HEAT_RES * 3)
    let hIdx = 0
    for (let xi = 0; xi < HEAT_RES; xi++) {
      for (let zi = 0; zi < HEAT_RES; zi++) {
        heatPositions[hIdx * 3 + 0] = (xi / (HEAT_RES - 1)) * 10 - 5
        heatPositions[hIdx * 3 + 1] = 0.015
        heatPositions[hIdx * 3 + 2] = (zi / (HEAT_RES - 1)) * 10 - 5
        hIdx++
      }
    }
    heatGeo.setAttribute('position', new THREE.BufferAttribute(heatPositions, 3))
    heatGeo.setAttribute('color', new THREE.BufferAttribute(heatColors, 3))
    heatMesh = new THREE.Points(heatGeo, new THREE.PointsMaterial({
      size: 0.45, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false
    }))
    scene.add(heatMesh)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const dl = new THREE.DirectionalLight(0xffffff, 1.5)
    dl.position.set(5, 10, 5); dl.castShadow = true; scene.add(dl)

    syncThemeColors()
    themeObserver = new MutationObserver(syncThemeColors)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const clock = new THREE.Clock()
    const lastAngles = new Array(PERSON_ROOTS.length).fill(0)
    let smoothedIntensity = 0.8
    const smoothedBpms = new Array(PERSON_ROOTS.length).fill(15)
    const smoothedHrs = new Array(PERSON_ROOTS.length).fill(70)
    const breathPhases = PERSON_ROOTS.map(() => 0)

    // ── Render Loop ───────────────────────────────────────────────────
    const animate = () => {
      requestAnimationFrame(animate)
      const dt = clock.getDelta()
      const t_clock = clock.getElapsedTime()
      const fr = frameRef.current

      // ── Backend data extraction ──────────────────────────────────
      const rawAmps: number[] = fr?.raw_amplitude ?? []
      const breathBPM: number = fr?.vitals?.breathing_bpm ?? 15
      const hrBPM: number = fr?.vitals?.heart_rate_bpm ?? 70
      const personCount = connected ? Math.min(fr?.presence?.person_count ?? 0, PERSON_ROOTS.length) : 0

      // Interpolate global intensity from CSI variance for smooth heatmap & movement
      if (rawAmps.length > 0) {
        const mean = rawAmps.reduce((a, b) => a + b, 0) / rawAmps.length
        const variance = rawAmps.reduce((a, b) => a + (b - mean) ** 2, 0) / rawAmps.length
        const targetInt = Math.min(2.0, 0.6 + Math.sqrt(variance) * 6)
        smoothedIntensity += (targetInt - smoothedIntensity) * Math.min(1.0, dt * 8)
      }

      // ── WiFi wave spheres – amplitude modulated ──────────────────
      waveSpheres.forEach(s => {
        const lt = ((t_clock / 4.0) + s.userData.phase) % 1
        s.scale.setScalar(0.3 + lt * 5.5)
        ;(s.material as THREE.MeshBasicMaterial).opacity = (1 - lt) * 0.85 * Math.max(0.5, smoothedIntensity)
      })

      node.rotation.y += dt * 0.5

      // ── Skeleton figures – breathing & heartbeat synced ──────────
      figureData.forEach((data, i) => {
        if (i < personCount) {
          data.group.visible = true

          // Interpolate BPM for smooth phase transitions
          smoothedBpms[i] += (breathBPM - smoothedBpms[i]) * Math.min(1.0, dt * 5)
          smoothedHrs[i] += (hrBPM - smoothedHrs[i]) * Math.min(1.0, dt * 5)

          // Advance breathing phase accumulator (independent per figure)
          breathPhases[i] += dt * (smoothedBpms[i] / 60) * Math.PI * 2
          const hrPhase = t_clock * (smoothedHrs[i] / 60) * Math.PI * 2

          // Breathing: subtle chest/torso expansion
          const breathDepth = rawAmps.length > 0
            ? Math.min(0.06, (Math.max(...rawAmps) - 1.0) * 0.12)
            : 0.025
          const bScale = 1.0 + Math.sin(breathPhases[i]) * breathDepth

          // Heartbeat: subtle y-axis micro-judder
          const hScale = Math.sin(hrPhase) * 0.004

          // Movement drift driven by smoothed Intensity
          const moveIntensity = Math.max(0, (smoothedIntensity - 0.7) * 1.5)
          const driftX = PERSON_ROOTS[i].x + Math.sin(t_clock * 0.5 + i) * moveIntensity * 1.2
          const driftZ = PERSON_ROOTS[i].z + Math.cos(t_clock * 0.4 + i * 2) * moveIntensity * 1.2
          
          // Face the direction of movement (or the node if static)
          const lookTargetX = moveIntensity > 0.1 ? driftX + Math.cos(t_clock * 0.5 + i) : -3
          const lookTargetZ = moveIntensity > 0.1 ? driftZ - Math.sin(t_clock * 0.4 + i * 2) : -2
          const angle = Math.atan2(-(driftX - lookTargetX), -(driftZ - lookTargetZ))
          lastAngles[i] = angle

          // Walk phase scales with movement intensity
          const walkPhase = t_clock * moveIntensity * 4.0
          const kps = buildSkeletonKeypoints(driftX, driftZ, bScale, walkPhase, angle)

          data.joints.forEach((m: THREE.Mesh, j: number) => {
            m.position.copy(kps[j])
            if (j <= 12) m.position.y += hScale
            ;(m.material as THREE.MeshStandardMaterial).transparent = false
            ;(m.material as THREE.MeshStandardMaterial).depthWrite = true
          })
          SKELETON_EDGES.forEach(([a, b], j) => {
            data.bones[j].geometry.setFromPoints([kps[a], kps[b]])
            ;(data.bones[j].geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
          })
        } else {
          data.group.visible = false
        }
      })

      // ── Heatmap – CSI energy projected onto floor ────────────────
      const colors = heatGeo.attributes.color.array as Float32Array
      const positions = heatGeo.attributes.position.array as Float32Array
      const isLight = checkLight()
      let cIdx = 0
      for (let xi = 0; xi < HEAT_RES; xi++) {
        for (let zi = 0; zi < HEAT_RES; zi++) {
          const px = (xi / (HEAT_RES - 1)) * 10 - 5
          const pz = (zi / (HEAT_RES - 1)) * 10 - 5

          // Node contribution
          let h = Math.max(0, 1 - Math.sqrt((px + 3) ** 2 + (pz + 2) ** 2) / 5) * 0.2

          // Person presence contributions
          for (let pIdx = 0; pIdx < personCount; pIdx++) {
            h += Math.max(0, 1 - Math.sqrt((px - PERSON_ROOTS[pIdx].x) ** 2 + (pz - PERSON_ROOTS[pIdx].z) ** 2) / 2.5) * 1.5
          }
          h = Math.min(1, h)

          // CSI wave ripple: subcarrier mapped onto floor radially from node
          let wifiRipple = 0
          if (rawAmps.length > 0) {
            const distNode = Math.sqrt((px + 3) ** 2 + (pz + 2) ** 2)
            const sc = Math.floor(distNode * 3) % rawAmps.length
            const amp = rawAmps[sc] ?? 1.0
            wifiRipple = (amp - 1.0) * 0.6 * Math.max(0, 1 - distNode / 9) * smoothedIntensity
          }

          // Keep points flat on ground
          positions[cIdx * 3 + 1] = 0.015

          if (isLight) {
            colors[cIdx * 3 + 0] = 0.1 + (h + Math.abs(wifiRipple)) * 0.85
            colors[cIdx * 3 + 1] = 0.2 * (1 - h)
            colors[cIdx * 3 + 2] = 0.5 * (1 - h)
          } else {
            colors[cIdx * 3 + 0] = h + Math.abs(wifiRipple) * 0.7
            colors[cIdx * 3 + 1] = 0.9 - h * 0.7
            colors[cIdx * 3 + 2] = 1 - h * 0.8 + wifiRipple * 0.5
          }
          cIdx++
        }
      }
      heatGeo.attributes.color.needsUpdate = true
      heatGeo.attributes.position.needsUpdate = true

      // ── Orbit camera ─────────────────────────────────────────────
      const orbit = orbitRef.current
      if (!orbit.isOrbiting) orbit.targetTheta += dt * 0.05

      const damping = 0.12
      orbit.currentTheta += (orbit.targetTheta - orbit.currentTheta) * damping
      orbit.currentPhi += (orbit.targetPhi - orbit.currentPhi) * damping
      orbit.currentRadius += (orbit.targetRadius - orbit.currentRadius) * damping

      const cp = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbit.currentPhi))
      camera.position.set(
        orbit.currentRadius * Math.sin(cp) * Math.sin(orbit.currentTheta),
        orbit.currentRadius * Math.cos(cp),
        orbit.currentRadius * Math.sin(cp) * Math.cos(orbit.currentTheta)
      )
      camera.lookAt(0, 0.5, 0)

      renderer.render(scene, camera)
    }
    animate()

    // ── Input Handlers ────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      lastStateRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
      orbitRef.current.isOrbiting = true
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!lastStateRef.current.active) return
      const dx = e.clientX - lastStateRef.current.lastX
      const dy = e.clientY - lastStateRef.current.lastY
      orbitRef.current.targetTheta -= dx * 0.005
      orbitRef.current.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitRef.current.targetPhi - dy * 0.005))
      lastStateRef.current.lastX = e.clientX
      lastStateRef.current.lastY = e.clientY
    }
    const onMouseUp = () => { lastStateRef.current.active = false }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastStateRef.current = { active: true, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY }
        orbitRef.current.isOrbiting = true
      }
      if (e.touches.length === 2) {
        e.preventDefault()
        lastStateRef.current.active = false
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && lastStateRef.current.active) {
        const dx = e.touches[0].clientX - lastStateRef.current.lastX
        const dy = e.touches[0].clientY - lastStateRef.current.lastY
        orbitRef.current.targetTheta -= dx * 0.005
        orbitRef.current.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitRef.current.targetPhi - dy * 0.005))
        lastStateRef.current.lastX = e.touches[0].clientX
        lastStateRef.current.lastY = e.touches[0].clientY
      }
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const d = Math.sqrt(dx * dx + dy * dy)
        if (lastPinchDistRef.current > 0) {
          orbitRef.current.targetRadius = Math.max(3, Math.min(16, orbitRef.current.targetRadius * (lastPinchDistRef.current / d)))
        }
        lastPinchDistRef.current = d
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      orbitRef.current.targetRadius = Math.max(3, Math.min(16, orbitRef.current.targetRadius + e.deltaY * 0.005))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        orbitRef.current.targetTheta = 0.3
        orbitRef.current.targetPhi = 0.45
        orbitRef.current.targetRadius = 9
      }
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)

    return () => {
      ro.disconnect()
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      if (themeObserver) themeObserver.disconnect()
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [connected])

  return (
    <div ref={containerRef} className="wifi-viz-container relative overflow-hidden w-full h-full touch-none shadow-inner" style={{ background: 'var(--color-bg-primary)' }}>

      {/* Fullscreen Button */}
      <button
        onClick={() => {
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
        }}
        className="absolute top-8 right-8 z-20 flex items-center justify-center w-32 h-32 border border-accent-metal/40 bg-base-white/80 backdrop-blur-sm hover:bg-base-stone-20 transition-all duration-500 cursor-pointer group rounded-full overflow-hidden"
        title={isFullscreen ? 'Exit' : 'Scale'}
      >
        <div className="absolute inset-0 bg-accent-earth scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 opacity-20" />
        {isFullscreen ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-base-black relative z-10">
            <path d="M5 1H1v4M9 1h4v4M5 13H1V9M9 13h4V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-base-black relative z-10">
            <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Fullscreen Overlay */}
      {isFullscreen && frame && (
        <div className="absolute bottom-12 left-12 z-10 flex flex-col gap-10 pointer-events-none">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-8 bg-base-white/80 px-10 py-5 backdrop-blur-sm border border-accent-metal/20">
              <span className={`w-6 h-6 rounded-full ${connected ? 'bg-accent-earth' : 'bg-accent-metal'}`} />
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-medium">
                {connected ? 'Live' : 'Offline'} · {frame.source}
              </span>
            </div>
          </div>
          <div className="flex items-stretch gap-1">
            <div className="flex flex-col gap-4 bg-base-white/85 backdrop-blur-sm px-16 py-12 border border-accent-metal/20 border-r-0">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal" style={{ fontWeight: 300, fontSize: '0.9rem' }}>Breathing</span>
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-base-black tabular-nums" style={{ fontSize: '2.6rem', fontWeight: 400 }}>
                  {frame.vitals.breathing_bpm?.toFixed(1) ?? '—'}
                </span>
                <span className="text-accent-metal" style={{ fontSize: '1.0rem' }}>bpm</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 bg-base-white/85 backdrop-blur-sm px-16 py-12 border border-accent-metal/20 border-r-0">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal" style={{ fontWeight: 300, fontSize: '0.9rem' }}>Heart Rate</span>
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-base-black tabular-nums" style={{ fontSize: '2.6rem', fontWeight: 400 }}>
                  {frame.vitals.heart_rate_bpm?.toFixed(0) ?? '—'}
                </span>
                <span className="text-accent-metal" style={{ fontSize: '1.0rem' }}>bpm</span>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4 bg-base-white/85 backdrop-blur-sm px-16 py-12 border border-accent-metal/20">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal" style={{ fontWeight: 300, fontSize: '0.9rem' }}>Presence</span>
              <span className={`inline-flex items-center gap-6 px-10 py-5 rounded-full text-caption-30 uppercase tracking-wider font-medium w-fit
                ${frame.presence.occupied ? 'bg-accent-wood/15 text-accent-wood' : 'bg-base-stone-50 text-base-stone-100'}`}>
                <span className={`w-4 h-4 rounded-full ${frame.presence.occupied ? 'bg-accent-wood' : 'bg-base-stone-100'}`} />
                {frame.presence.occupied ? `${frame.presence.person_count} ${frame.presence.person_count === 1 ? 'person' : 'persons'}` : 'Empty'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-24 left-24 pointer-events-none z-10 selection:bg-none">
        <span className="text-caption-30 text-accent-metal uppercase tracking-[0.2em] font-sans block opacity-60">Uplink active</span>
        <span className="text-[1.1rem] text-base-brown uppercase mt-4 block font-sans opacity-40">Pinch zoom · Orbit drag · Reset (R)</span>
      </div>

      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080809] z-20 pointer-events-none">
          <div className="flex flex-col items-center gap-16">
            <div className="size-24 border border-accent-metal/20 border-t-accent-earth rounded-full animate-spin" />
            <span className="font-serif italic text-caption-30 text-accent-metal uppercase tracking-widest">Awaiting Signal</span>
          </div>
        </div>
      )}
    </div>
  )
}

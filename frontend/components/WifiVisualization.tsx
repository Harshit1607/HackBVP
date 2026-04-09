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

const SKELETON_EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 4],           // face
  [5, 6],                              // shoulders
  [5, 7], [7, 9],                        // left arm
  [6, 8], [8, 10],                       // right arm
  [5, 11], [6, 12], [11, 12],              // torso
  [11, 13], [13, 15],                    // left leg
  [12, 14], [14, 16],                    // right leg
]

function buildSkeletonKeypoints(
  rootX: number,
  rootZ: number,
  breathScale: number
): THREE.Vector3[] {
  const s = breathScale
  return [
    new THREE.Vector3(rootX, 1.75 * s, rootZ),  //  0 nose
    new THREE.Vector3(rootX - 0.07, 1.72 * s, rootZ),  //  1 left eye
    new THREE.Vector3(rootX + 0.07, 1.72 * s, rootZ),  //  2 right eye
    new THREE.Vector3(rootX - 0.12, 1.68 * s, rootZ),  //  3 left ear
    new THREE.Vector3(rootX + 0.12, 1.68 * s, rootZ),  //  4 right ear
    new THREE.Vector3(rootX - 0.22, 1.45 * s, rootZ),  //  5 left shoulder
    new THREE.Vector3(rootX + 0.22, 1.45 * s, rootZ),  //  6 right shoulder
    new THREE.Vector3(rootX - 0.38, 1.1 * s, rootZ),  //  7 left elbow
    new THREE.Vector3(rootX + 0.38, 1.1 * s, rootZ),  //  8 right elbow
    new THREE.Vector3(rootX - 0.42, 0.78 * s, rootZ),  //  9 left wrist
    new THREE.Vector3(rootX + 0.42, 0.78 * s, rootZ),  // 10 right wrist
    new THREE.Vector3(rootX - 0.14, 0.95 * s, rootZ),  // 11 left hip
    new THREE.Vector3(rootX + 0.14, 0.95 * s, rootZ),  // 12 right hip
    new THREE.Vector3(rootX - 0.16, 0.52 * s, rootZ),  // 13 left knee
    new THREE.Vector3(rootX + 0.16, 0.52 * s, rootZ),  // 14 right knee
    new THREE.Vector3(rootX - 0.16, 0.04, rootZ),    // 15 left ankle
    new THREE.Vector3(rootX + 0.16, 0.04, rootZ),    // 16 right ankle
  ]
}

export default function WifiVisualization({ frame, connected }: WifiVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<SensingFrame | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // High-performance orbit state with damping (target vs current)
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

  const sceneStateRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    waveSpheres: THREE.Mesh[]
    heatMesh: THREE.Points
    figureData: Array<{
       group: THREE.Group
       joints: THREE.Mesh[]
       bones: THREE.Line[]
    }>
    node: THREE.Mesh
    clock: THREE.Clock
  } | null>(null)

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

    // SETUP
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x080809)
    const aspect = container.clientWidth / container.clientHeight
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100)
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.localClippingEnabled = true
    container.appendChild(renderer.domElement)

    // ResizeObserver (Fix 4a)
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(container)

    // Floor
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x121216,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Grid
    const grid = new THREE.GridHelper(14, 20, 0x2d3748, 0x1e2024)
    grid.position.y = 0.002
    const gridMat = grid.material as THREE.LineBasicMaterial
    gridMat.opacity = 0.4; gridMat.transparent = true
    scene.add(grid)

    // Waves (Fix 3: Mesh Visibility Up)
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const waveSpheres: THREE.Mesh[] = []
    const sourcePos = new THREE.Vector3(-3, 0.5, -2)
    const waveGeo = new THREE.IcosahedronGeometry(1, 2)
    
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00f2ff,
        wireframe: true,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        clippingPlanes: [clipPlane],
      })
      const s = new THREE.Mesh(waveGeo, mat)
      s.position.copy(sourcePos); s.userData.phase = i / 3
      scene.add(s); waveSpheres.push(s)
    }

    // Source Node (Fix 3: Larger + Emissive)
    const nodeGeo = new THREE.IcosahedronGeometry(0.22, 1)
    const nodeMat = new THREE.MeshLambertMaterial({ 
      color: 0x00f2ff,
      emissive: 0x00f2ff,
      emissiveIntensity: 1.2
    })
    const node = new THREE.Mesh(nodeGeo, nodeMat)
    node.position.copy(sourcePos)
    node.castShadow = true
    scene.add(node)

    // Heatmap
    const HEAT_RES = 20
    const heatGeo = new THREE.BufferGeometry()
    const heatPositions = new Float32Array(HEAT_RES * HEAT_RES * 3)
    const heatColors = new Float32Array(HEAT_RES * HEAT_RES * 3)
    let hIdx = 0
    for (let xi = 0; xi < HEAT_RES; xi++) {
      for (let zi = 0; zi < HEAT_RES; zi++) {
        heatPositions[hIdx * 3 + 0] = (xi / (HEAT_RES - 1)) * 10 - 5
        heatPositions[hIdx * 3 + 1] = 0.012
        heatPositions[hIdx * 3 + 2] = (zi / (HEAT_RES - 1)) * 10 - 5
        hIdx++
      }
    }
    heatGeo.setAttribute('position', new THREE.BufferAttribute(heatPositions, 3))
    heatGeo.setAttribute('color', new THREE.BufferAttribute(heatColors, 3))
    const heatMesh = new THREE.Points(heatGeo, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }))
    scene.add(heatMesh)

    // Figures
    const figureData = PERSON_ROOTS.map(() => {
      const group = new THREE.Group(); scene.add(group)
      const joints: THREE.Mesh[] = []; const bones: THREE.Line[] = []
      const mat = new THREE.MeshStandardMaterial({ color: 0xdfff11, emissive: 0xdfff11, emissiveIntensity: 1 })
      for (let i = 0; i < 17; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), mat); group.add(m); joints.push(m) }
      SKELETON_EDGES.forEach(() => { const l = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xdfff11, transparent: true, opacity: 0.8 })); group.add(l); bones.push(l) })
      group.visible = false
      return { group, joints, bones }
    })

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dl = new THREE.DirectionalLight(0xffffff, 1.5); dl.position.set(5, 10, 5); dl.castShadow = true; scene.add(dl)

    const clock = new THREE.Clock()
    sceneStateRef.current = { scene, camera, renderer, waveSpheres, heatMesh, figureData, node, clock }

    // RENDER LOOP
    const animate = () => {
      const state = sceneStateRef.current
      if (!state) return
      requestAnimationFrame(animate)
      const dt = clock.getDelta()
      const t_clock = clock.getElapsedTime()
      const fr = frameRef.current
      const count = connected ? Math.min(fr?.presence.person_count ?? 0, PERSON_ROOTS.length) : 0
      const bScale = 1 + Math.sin(t_clock * ((fr?.vitals.breathing_bpm ?? 15) / 60) * Math.PI * 2) * 0.02

      const amplitudeIntensity = fr?.amplitude ?? 0.8

      // Wave expansion (4s cycle - Fix 3)
      state.waveSpheres.forEach(s => {
        const lt = ((t_clock / 4.0) + s.userData.phase) % 1
        s.scale.setScalar(0.3 + lt * 5.5) // Start visible
        ;(s.material as THREE.MeshBasicMaterial).opacity = (1 - lt) * 0.85 * Math.max(0.6, amplitudeIntensity)
      })

      state.node.rotation.y += dt * 0.5

      figureData.forEach((data, i) => {
        if (i < count) {
          data.group.visible = true
          const kps = buildSkeletonKeypoints(PERSON_ROOTS[i].x, PERSON_ROOTS[i].z, bScale)
          data.joints.forEach((m, j) => {
            m.position.copy(kps[j])
            const jMat = m.material as THREE.MeshStandardMaterial
            jMat.transparent = false; jMat.depthWrite = true
          })
          SKELETON_EDGES.forEach(([a, b], j) => { data.bones[j].geometry.setFromPoints([kps[a], kps[b]]); data.bones[j].geometry.attributes.position.needsUpdate = true })
        } else { data.group.visible = false }
      })

      // Heatmap update
      const colors = heatGeo.attributes.color.array as Float32Array
      let cIdx = 0
      for (let xi = 0; xi < HEAT_RES; xi++) {
        for (let zi = 0; zi < HEAT_RES; zi++) {
          const px = (xi / (HEAT_RES - 1)) * 10 - 5; const pz = (zi / (HEAT_RES - 1)) * 10 - 5
          let h = Math.max(0, 1 - Math.sqrt((px + 3) ** 2 + (pz + 2) ** 2) / 5) * 0.2
          for (let pIdx = 0; pIdx < count; pIdx++) h += Math.max(0, 1 - Math.sqrt((px - PERSON_ROOTS[pIdx].x) ** 2 + (pz - PERSON_ROOTS[pIdx].z) ** 2) / 2.5) * 1.5
          h = Math.min(1, h)
          colors[cIdx*3+0] = h; colors[cIdx*3+1] = 0.9 - h*0.7; colors[cIdx*3+2] = 1 - h*0.8; cIdx++
        }
      }
      heatGeo.attributes.color.needsUpdate = true

      // SMOOTH DAMPING (Fix: Ultra smooth orbit)
      const orbit = orbitRef.current
      if (!orbit.isOrbiting) orbit.targetTheta += dt * 0.05 // Gentle auto-rotation
      
      const damping = 0.12 // Smoothing factor
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

    // INTERACTION HANDLERS (Pointer API for multi-modal support)
    const onMouseDown = (e: MouseEvent) => { 
      lastStateRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
      orbitRef.current.isOrbiting = true 
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!lastStateRef.current.active) return
      const dx = e.clientX - lastStateRef.current.lastX; const dy = e.clientY - lastStateRef.current.lastY
      orbitRef.current.targetTheta -= dx * 0.005
      orbitRef.current.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitRef.current.targetPhi - dy * 0.005))
      lastStateRef.current.lastX = e.clientX; lastStateRef.current.lastY = e.clientY
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
        const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDistRef.current = Math.sqrt(dx*dx + dy*dy)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && lastStateRef.current.active) {
        const dx = e.touches[0].clientX - lastStateRef.current.lastX; const dy = e.touches[0].clientY - lastStateRef.current.lastY
        orbitRef.current.targetTheta -= dx * 0.005
        orbitRef.current.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitRef.current.targetPhi - dy * 0.005))
        lastStateRef.current.lastX = e.touches[0].clientX; lastStateRef.current.lastY = e.touches[0].clientY
      }
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY
        const d = Math.sqrt(dx*dx + dy*dy)
        if (lastPinchDistRef.current > 0) orbitRef.current.targetRadius = Math.max(3, Math.min(16, orbitRef.current.targetRadius * (lastPinchDistRef.current / d)))
        lastPinchDistRef.current = d
      }
    }
    const onWheel = (e: WheelEvent) => { 
      e.preventDefault()
      orbitRef.current.targetRadius = Math.max(3, Math.min(16, orbitRef.current.targetRadius + e.deltaY * 0.005)) 
    }

    container.addEventListener('mousedown', onMouseDown); window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('touchstart', onTouchStart, { passive: false }); container.addEventListener('touchmove', onTouchMove, { passive: false }); container.addEventListener('wheel', onWheel, { passive: false })

    const onKey = (e: KeyboardEvent) => { 
      if (e.key.toLowerCase() === 'r') {
        orbitRef.current.targetTheta = 0.3
        orbitRef.current.targetPhi = 0.45
        orbitRef.current.targetRadius = 9
      }
    }
    window.addEventListener('keydown', onKey)
    
    return () => {
      ro.disconnect()
      container.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('touchstart', onTouchStart); container.removeEventListener('touchmove', onTouchMove); container.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      renderer.dispose(); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [connected])

  return (
    <div ref={containerRef} className="wifi-viz-container relative overflow-hidden w-full h-full bg-[#080809] touch-none shadow-inner">
      
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

      {/* Fullscreen Overlay (Fix 4b) */}
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

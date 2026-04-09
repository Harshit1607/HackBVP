'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WifiVisualization from '@/components/WifiVisualization'
import AmplitudeChart from '@/components/AmplitudeChart'
import PoseCanvas from '@/components/PoseCanvas'
import { ColDividers } from '@/components/ColDividers'
import { SectionWrapper } from '@/components/SectionWrapper'
import { SectionGrid } from '@/components/SectionGrid'
import { useSensingStream } from '@/hooks/useSensingStream'
import { useReveal } from '@/hooks/useReveal'
import Link from 'next/link'
import SourceDropdown from '@/components/SourceDropdown'
import ReplayPicker from '@/components/ReplayPicker'

function SubcarrierBars({ amplitudes }: { amplitudes: number[] }) {
  if (amplitudes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center border border-dashed border-accent-metal/30">
        <span className="text-caption-30 text-accent-metal/50 uppercase tracking-widest font-light">Awaiting signal</span>
      </div>
    )
  }
  const min = Math.min(...amplitudes)
  const max = Math.max(...amplitudes)
  const mean = amplitudes.reduce((a,b)=>a+b,0)/amplitudes.length
  const range = max - min || 1
  const W = 240, H = 200
  const barW = (W / 56) * 0.7
  const gap   = (W / 56) * 0.3

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      {amplitudes.map((amp, i) => {
        const norm = (amp - min) / range           // 0..1
        const dev  = (amp - mean) / (range / 2)   // -1..1
        const barH = norm * (H - 8)
        const x = i * (W / 56)
        const y = H - barH
        // Color: below mean = accent-water, above = accent-fire
        const r = dev > 0 ? Math.round(74 + (151-74)*dev) : 74
        const g = dev > 0 ? Math.round(98 + (103-98)*dev) : 98
        const b = dev > 0 ? Math.round(111 + (81-111)*dev) : 111
        return (
          <rect
            key={i}
            x={x + gap/2}
            y={y}
            width={barW}
            height={barH}
            fill={`rgb(${r},${g},${b})`}
            opacity={0.8}
          />
        )
      })}
      {/* Mean line */}
      <line
        x1={0} y1={H - ((mean-min)/range)*(H-8)}
        x2={W} y2={H - ((mean-min)/range)*(H-8)}
        stroke="rgb(193,194,189)" strokeWidth="0.5" strokeDasharray="3 2"
      />
    </svg>
  )
}

function RadialGauge({
  label, value, color
}: {
  label: string
  value: number   // 0..1
  color: string   // css rgb string
}) {
  const R = 36, CX = 44, CY = 44
  const circumference = Math.PI * R  // half circle
  const progress = value * circumference
  const pct = Math.round(value * 100)

  return (
    <div className="flex flex-col items-center gap-10">
      <svg viewBox="0 0 88 52" className="w-full" style={{ maxWidth: '11rem' }}>
        {/* Track arc — subtle white track on dark */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.19,1,0.22,1)' }}
        />
        {/* Center value — white on dark */}
        <text x={CX} y={CY - 4} textAnchor="middle"
          fontFamily="'Instrument Serif', serif"
          fontSize="18" fill="rgba(255,255,255,0.9)" fontWeight="400">
          {pct}
        </text>
        {/* % label — muted white */}
        <text x={CX} y={CY + 10} textAnchor="middle"
          fontFamily="'Instrument Sans', sans-serif"
          fontSize="7" fill="rgba(255,255,255,0.35)" letterSpacing="1">
          %
        </text>
      </svg>
      <span className="text-caption-30 uppercase tracking-widest font-light text-center"
        style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
    </div>
  )
}

function CocoSkeletonDiagram() {
  // Normalized 0..1 positions of 17 COCO keypoints
  // Mapped to a 100×200 viewport, feet at bottom, head at top
  const KP: [number, number][] = [
    [50,  12],  // 0 nose
    [44,  10],  // 1 left eye
    [56,  10],  // 2 right eye
    [38,  13],  // 3 left ear
    [62,  13],  // 4 right ear
    [30,  38],  // 5 left shoulder
    [70,  38],  // 6 right shoulder
    [18,  68],  // 7 left elbow
    [82,  68],  // 8 right elbow
    [12,  96],  // 9 left wrist
    [88,  96],  // 10 right wrist
    [35,  98],  // 11 left hip
    [65,  98],  // 12 right hip
    [32, 144],  // 13 left knee
    [68, 144],  // 14 right knee
    [30, 190],  // 15 left ankle
    [70, 190],  // 16 right ankle
  ]

  const EDGES = [
    [0,1],[0,2],[1,3],[2,4],
    [5,6],[5,7],[7,9],[6,8],[8,10],
    [5,11],[6,12],[11,12],
    [11,13],[13,15],[12,14],[14,16],
  ]

  return (
    <svg viewBox="0 0 100 200" className="w-full h-full" style={{ maxHeight: '36rem' }}>
      <style>{`
        @keyframes joint-pulse {
          0%, 100% { opacity: 0.5; r: 2.2; }
          50%       { opacity: 1.0; r: 3.0; }
        }
        .joint { animation: joint-pulse 2.8s ease-in-out infinite; }
        .joint:nth-child(2n)  { animation-delay: 0.4s; }
        .joint:nth-child(3n)  { animation-delay: 0.9s; }
        .joint:nth-child(5n)  { animation-delay: 1.4s; }
      `}</style>

      {/* Skeleton edges */}
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={KP[a][0]} y1={KP[a][1]}
          x2={KP[b][0]} y2={KP[b][1]}
          stroke="rgb(151,103,81)"
          strokeWidth="0.8"
          opacity="0.5"
        />
      ))}

      {/* Joints */}
      {KP.map(([x, y], i) => (
        <circle
          key={i}
          className="joint"
          cx={x} cy={y} r="2.2"
          fill="rgb(151,103,81)"
        />
      ))}

      {/* Scan line — animates top to bottom */}
      <line x1="0" y1="0" x2="100" y2="0" stroke="rgb(74,98,111)" strokeWidth="0.4" opacity="0.6">
        <animate
          attributeName="y1" from="0" to="200"
          dur="3s" repeatCount="indefinite" />
        <animate
          attributeName="y2" from="0" to="200"
          dur="3s" repeatCount="indefinite" />
      </line>

    </svg>
  )
}

export default function Dashboard() {
  const { frame, connected, fps, connectionStatus, sourceType, setSourceType } = useSensingStream()
  const [displayFrame, setDisplayFrame] = useState<any>(null)
  const [active, setActive] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const sourceButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<{top: number, left: number, width: number} | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [replayPickerOpen, setReplayPickerOpen] = useState(false)
  
  const [frameCount, setFrameCount] = useState(0)
  const [eventLog, setEventLog] = useState<Array<{ status: string; time: string }>>([])
  
  // Waveform Stability: Phase accumulation prevents "snapping" during BPM updates
  const breathingPhaseRef = useRef(0)
  const lastWaveTimeRef = useRef(Date.now() / 1000)
  
  useReveal()

  const latestFrameRef = useRef(frame)
  useEffect(() => { latestFrameRef.current = frame }, [frame])

  // Display throttling: The hero section vitals update slowly (every 2.5s) 
  // to remain legible, while the visualization stays high-frequency.
  useEffect(() => {
    const interval = setInterval(() => {
      if (latestFrameRef.current) {
        setDisplayFrame(latestFrameRef.current)
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Update phase on every frame change (200ms)
  useEffect(() => {
    const now = Date.now() / 1000
    const dt = now - lastWaveTimeRef.current
    const bpm = frame?.vitals.breathing_bpm ?? 15
    breathingPhaseRef.current += dt * (bpm / 60)
    lastWaveTimeRef.current = now
  }, [frame])
  // Monitor Fullscreen State for HUD activation
  useEffect(() => {
    const handleFS = () => setIsFullScreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFS)
    return () => document.removeEventListener('fullscreenchange', handleFS)
  }, [])

  const copyValue = (key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1800)
    })
  }

  useEffect(() => {
    if (frame) setFrameCount(c => c + 1)
  }, [frame])

  useEffect(() => {
    const time = new Date().toLocaleTimeString()
    setEventLog(prev => [
      { status: connectionStatus, time },
      ...prev,
    ].slice(0, 6))
  }, [connectionStatus])

  useEffect(() => {
    setActive(true)
  }, [])

  return (
    <div className="relative overflow-x-hidden selection:bg-accent-earth/20 selection:text-base-brown">
      {/* HERO SECTION - Exact 1:3 split from reference (Untouched as per instructions, only minor imports added) */}
      <div className="border-b border-accent-metal/20">
        <div className="relative isolate size-full bg-base-white transition-colors duration-1000 ease-out">
          <ColDividers />
          
          <section className="grid grid-cols-1 lg:grid-cols-4 translate-x-[0.15rem]
                          lg:h-[calc(100svh-var(--header-height))] 
                          lg:max-h-[calc(100svh-var(--header-height))]
                          lg:overflow-hidden">
            
            {/* INFORMATION COLUMN (1/4) — Fix 2: breathing space + hierarchy + interactions */}
            <div 
              ref={sidebarRef}
              className="order-2 lg:order-1 col-span-1
                            border-r border-accent-metal/20
                            flex flex-col
                            px-0 pt-12 pb-8
                            lg:h-[calc(100svh-var(--header-height))]
                            lg:overflow-visible
                            gap-0">

              {/* ── ZONE 1: Identity — top ── */}
              <div className="flex flex-col gap-4 px-12 pb-12 border-b border-accent-metal/10">
                {/* Micro Diagnostics Component — Reactive to Live Signal (Stabilized height) */}
                <div className="flex items-end gap-4 h-8 mb-2 overflow-hidden">
                  <div className="flex items-end gap-2 h-full">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-[2px] transition-all duration-300 
                          ${connected ? 'bg-accent-wood' : 'bg-accent-metal/20'}`} 
                        style={{ 
                          opacity: connected ? 0.3 + (frame?.amplitude ?? 0) * 0.7 : 0.1,
                          height: connected ? `${40 + Math.sin((frame?.timestamp ?? 0) * 10 + i) * 30}%` : '50%',
                        }} 
                      />
                    ))}
                  </div>
                  <span className="text-[0.6rem] text-accent-metal tracking-tighter uppercase font-mono pb-1">
                    {connected ? 'sys.vitals_active' : 'sys.err_offline'}
                  </span>
                </div>

                {/* H1 — L1 heading */}
                <h1 className="font-serif text-title-20 text-base-black reveal" style={{ fontWeight: 400 }}>
                  WiFi Presence
                </h1>

                {/* Techy Intermediate Zone — Dynamic CSI Spatial Data */}
                <div className="flex items-center gap-12 py-2 reveal">
                  <div className="flex items-center gap-4">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" 
                      className={connected ? 'text-accent-fire' : 'text-accent-metal/30'}>
                      <rect x="0.5" y="0.5" width="13" height="13" stroke="currentColor" strokeOpacity="0.2"/>
                      <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.2" 
                        className={connected ? 'animate-pulse' : ''} />
                    </svg>
                    <span className="text-[0.6rem] font-mono text-accent-metal/60 uppercase tracking-tighter">
                      node.{sourceType?.toUpperCase()}_0{(frame?.timestamp ?? 0) % 9 | 0}
                    </span>
                  </div>
                  <div className="h-[1px] flex-1 bg-accent-metal/10" />
                  <div className="flex gap-6 tabular-nums">
                    <span className="text-[0.55rem] font-mono text-accent-metal/40 uppercase tracking-tighter">
                      LAT: {(40.7128 + Math.sin(frame?.timestamp ?? 0) * 0.0001).toFixed(6)}
                    </span>
                    <span className="text-[0.55rem] font-mono text-accent-metal/40 uppercase tracking-tighter">
                      LON: {(-74.0060 + Math.cos(frame?.timestamp ?? 0) * 0.0001).toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Subtitle */}
                <p className="text-caption-30 uppercase tracking-[0.2em] text-accent-metal font-light reveal">
                  Precision Signal Intelligence
                </p>
              </div>

              {/* ── ZONE 2: Source Dropdown ── */}
              <div className="relative py-6 px-12 border-b border-accent-metal/10 reveal group/src">
                <button 
                  ref={sourceButtonRef}
                  data-source-trigger="true"
                  onClick={() => setSourceMenuOpen(!sourceMenuOpen)}
                  className="flex items-center justify-between w-full group/btn"
                >
                  <div className="flex items-center gap-8">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${connected ? 'bg-accent-fire/70 ripple' : 'bg-accent-metal/30'}`} />
                    <span className="text-caption-30 uppercase tracking-widest text-accent-fire font-light group-hover/btn:text-accent-fire/80 transition-colors">
                      {sourceType === 'mock' && 'Simulated Stream'}
                      {sourceType === 'socket' && 'Hardware (WS:8001)'}
                      {sourceType === 'replay' && 'Replay Buffer'}
                      {!sourceType && (frame?.source ?? 'Awaiting selection')}
                    </span>
                  </div>
                  <svg 
                    width="10" height="10" viewBox="0 0 10 10" fill="none" 
                    className={`text-accent-metal/40 transition-transform duration-500 ${sourceMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Source Dropdown Portal — renders into document.body, fully opaque & outside reveal context */}
              <SourceDropdown
                open={sourceMenuOpen}
                anchorRef={sidebarRef}
                sourceType={sourceType}
                onSelect={(id) => {
                  if (id === 'replay') {
                    setReplayPickerOpen(true)
                  } else {
                    setSourceType(id as any)
                  }
                }}
                onClose={() => setSourceMenuOpen(false)}
              />

              <AnimatePresence>
                {replayPickerOpen && (
                  <ReplayPicker 
                    open={replayPickerOpen}
                    onClose={() => setReplayPickerOpen(false)}
                    onSelect={async (filename) => {
                      try {
                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
                        const res = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(filename)}/play`, { method: 'POST' })
                        if (res.ok) {
                          setSourceType('socket')
                          setReplayPickerOpen(false)
                        }
                      } catch (err) {
                        console.error('Failed to start replay', err)
                      }
                    }}
                  />
                )}
              </AnimatePresence>

              {/* ── ZONE 3: Data rows ── */}
              <div className="flex flex-col flex-1 reveal">
                {/* Each row here also needs padding since the parent is px-0 */}
                <style jsx>{`
                  .data-row-px { padding-left: 3rem; padding-right: 3rem; }
                `}</style>

                {/* ── Breathing row ── */}
                <div className="group relative flex flex-col py-10 data-row-px border-t border-accent-metal/15 transition-all duration-500 hover:bg-base-stone-20/50 cursor-pointer"
                  onClick={() => {
                    const val = displayFrame?.vitals.breathing_bpm?.toFixed(1) ?? '—'
                    navigator.clipboard.writeText(val).then(() => {
                      setCopiedKey('breathing')
                      setTimeout(() => setCopiedKey(null), 1800)
                    })
                  }}>
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-caption-30 uppercase tracking-widest text-accent-metal">Breathing</span>
                    <span className="text-[0.6rem] font-mono text-accent-metal/60">CONF: {((displayFrame?.vitals?.breathing_confidence ?? 0) * 100).toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 mb-6">
                    <div className="flex items-baseline gap-4 pointer-events-none">
                      <span className="text-title-10 font-serif text-base-black tabular-nums transition-colors duration-500 group-hover:text-accent-wood">
                        {copiedKey === 'breathing' ? 'Copied' : (displayFrame?.vitals.breathing_bpm?.toFixed(1) ?? '—')}
                      </span>
                      <span className="text-[0.9rem] text-accent-metal uppercase">bpm</span>
                    </div>
                    {/* Synchronized Respiraton Monitor — Phase-locked and smoothed */}
                    <svg width="48" height="24" className="opacity-40 group-hover:opacity-100 transition-opacity">
                      <path 
                        d={(() => {
                          const pts = 80 // Increased resolution for visual smoothness
                          const currentPhase = breathingPhaseRef.current
                          let p = "M0 12"
                          for (let i = 0; i <= pts; i++) {
                            const x = (i / pts) * 48
                            const wave = Math.sin((currentPhase * Math.PI * 2) + (i / pts) * Math.PI * 1.5)
                            const y = 12 + wave * (4 + (frame?.amplitude ?? 0) * 8)
                            p += ` L ${x} ${y}`
                          }
                          return p
                        })()} 
                        stroke="currentColor" strokeWidth="1.5" fill="none" className="text-accent-metal"
                      />
                    </svg>
                  </div>

                  <div className="h-[3px] w-full flex gap-[2px]">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-full flex-1 transition-colors duration-700 ${(i + 1) / 10 <= (displayFrame?.vitals?.breathing_confidence ?? 0) ? 'bg-accent-wood' : 'bg-accent-metal/10'}`} 
                      />
                    ))}
                  </div>
                </div>

                {/* ── Heart Rate row ── */}
                <div className="group relative flex flex-col py-10 data-row-px border-t border-accent-metal/15 transition-all duration-500 hover:bg-base-stone-20/50 cursor-pointer"
                  onClick={() => {
                    const val = displayFrame?.vitals.heart_rate_bpm?.toFixed(0) ?? '—'
                    navigator.clipboard.writeText(val).then(() => {
                      setCopiedKey('heart')
                      setTimeout(() => setCopiedKey(null), 1800)
                    })
                  }}>
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-caption-30 uppercase tracking-widest text-accent-metal">Heart Rate</span>
                    <span className="text-[0.6rem] font-mono text-accent-metal/60">SENS: S-BAND_GHz</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 mb-6">
                    <div className="flex items-baseline gap-4 pointer-events-none">
                      <span className="text-title-10 font-serif text-base-black tabular-nums transition-colors duration-500 group-hover:text-accent-earth">
                        {copiedKey === 'heart' ? 'Copied' : (displayFrame?.vitals.heart_rate_bpm?.toFixed(0) ?? '—')}
                      </span>
                      <span className="text-[0.9rem] text-accent-metal uppercase">bpm</span>
                    </div>
                    <div className="flex gap-2 h-12 items-end">
                      <div className={`w-[2px] h-6 ${connected ? 'bg-accent-earth' : 'bg-accent-metal/20'} animate-pulse`} />
                      <div className={`w-[2px] h-10 ${connected ? 'bg-accent-earth/60' : 'bg-accent-metal/20'} animate-pulse delay-100`} />
                      <div className={`w-[2px] h-4 ${connected ? 'bg-accent-earth/40' : 'bg-accent-metal/20'} animate-pulse delay-200`} />
                    </div>
                  </div>

                  <div className="h-[3px] w-full flex gap-[2px]">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-full flex-1 transition-colors duration-700 ${(i + 1) / 10 <= (displayFrame?.vitals?.hr_confidence ?? 0) ? 'bg-accent-earth' : 'bg-accent-metal/10'}`} 
                      />
                    ))}
                  </div>
                </div>

                {/* ── Presence row ── */}
                <div className="group relative flex flex-col py-10 data-row-px border-t border-accent-metal/15 transition-all duration-500 hover:bg-base-stone-20/50 cursor-pointer"
                  onClick={() => {
                    const val = displayFrame?.presence.person_count.toString() ?? '0'
                    navigator.clipboard.writeText(val).then(() => {
                      setCopiedKey('presence')
                      setTimeout(() => setCopiedKey(null), 1800)
                    })
                  }}>
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-caption-30 uppercase tracking-widest text-accent-metal">Presence</span>
                    <span className="text-[0.6rem] font-mono text-accent-metal/60">TRACK: 20Hz_MON</span>
                  </div>
                  
                  <div className="mt-8 mb-8 flex items-center justify-between pointer-events-none">
                    <span className={`inline-flex items-center gap-6 text-caption-30 uppercase tracking-wider font-medium
                      ${displayFrame?.presence.occupied ? 'text-accent-fire' : 'text-base-stone-100'}`}>
                      <span className={`w-3 h-3 rounded-full ${displayFrame?.presence.occupied ? 'bg-accent-fire animate-pulse' : 'bg-base-stone-100'}`} />
                      {copiedKey === 'presence' ? 'Copied' : (displayFrame?.presence.occupied ? `${displayFrame?.presence.person_count} Detected` : 'Scanning...')}
                    </span>
                    <span className="text-[0.7rem] font-mono text-accent-metal tracking-widest">ACTIVE</span>
                  </div>

                  <div className="h-[3px] w-full flex gap-[2px]">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-full flex-1 transition-colors duration-700 ${(i + 1) / 10 <= (displayFrame?.presence.confidence ?? 0) ? 'bg-accent-fire' : 'bg-accent-metal/10'}`} 
                      />
                    ))}
                  </div>
                </div>

                {/* ── Stabilized Confidence Metric Cluster — Seamless Editorial Design ── */}
                <div className="flex items-center justify-between py-8 data-row-px border-t border-accent-metal/10">
                  <div className="flex flex-col items-center">
                    <span className="text-[0.45rem] font-mono text-accent-metal uppercase tracking-[0.2em] mb-2 opacity-60">Respiration</span>
                    <span className="text-title-30 font-serif text-base-black tabular-nums transition-colors duration-500">
                      {((displayFrame?.vitals?.breathing_confidence ?? 0) * 100).toFixed(1)}<span className="text-[0.6rem] font-sans ml-1 text-accent-metal">%</span>
                    </span>
                  </div>
                  <div className="h-10 w-[1px] bg-accent-metal/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-[0.45rem] font-mono text-accent-metal uppercase tracking-[0.2em] mb-2 opacity-60">Pulse</span>
                    <span className="text-title-30 font-serif text-base-black tabular-nums transition-colors duration-500">
                      {((displayFrame?.vitals?.hr_confidence ?? 0) * 100).toFixed(1)}<span className="text-[0.6rem] font-sans ml-1 text-accent-metal">%</span>
                    </span>
                  </div>
                  <div className="h-10 w-[1px] bg-accent-metal/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-[0.45rem] font-mono text-accent-metal uppercase tracking-[0.2em] mb-2 opacity-60">Occupancy</span>
                    <span className="text-title-30 font-serif text-base-black tabular-nums transition-colors duration-500">
                      {((displayFrame?.presence.confidence ?? 0) * 100).toFixed(1)}<span className="text-[0.6rem] font-sans ml-1 text-accent-metal">%</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

              {/* ── CENTRAL VISUALIZATION (3/4) ── */}
              <div className="order-1 lg:order-2 col-span-1 lg:col-span-3 h-[60vh] lg:h-full relative overflow-hidden group/viz">
                <WifiVisualization frame={frame} connected={connected} />
                
                {/* ── FULLSCREEN HUD OVERLAYS ── */}
                {isFullScreen && (
                  <div className="absolute inset-0 pointer-events-none z-50 p-12 animate-in fade-in duration-700">
                    {/* Corner TL: Signal Stream Stats */}
                    <div className="absolute top-12 left-12 flex flex-col gap-2 border-l border-t border-accent-fire/40 p-6 bg-base-black/5 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent-fire animate-pulse" />
                        <span className="text-[0.6rem] font-mono text-accent-fire tracking-widest uppercase">LIVE_SIGNAL_STREAM</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[0.5rem] font-mono text-accent-metal uppercase">Bitrate: 4.2 MBPS</span>
                        <span className="text-[0.5rem] font-mono text-accent-metal uppercase">Packet_Loss: 0.002%</span>
                        <span className="text-[0.5rem] font-mono text-accent-metal uppercase">Latency: 12ms</span>
                      </div>
                    </div>

                    {/* Corner TR: System Chrono */}
                    <div className="absolute top-12 right-12 text-right flex flex-col gap-2 border-r border-t border-accent-metal/40 p-6">
                      <span className="text-[0.6rem] font-mono text-accent-metal tracking-widest uppercase">NODE_UPTIME</span>
                      <span className="text-title-30 font-serif text-base-black">04:12:08</span>
                      <div className="flex justify-end gap-2 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-1 h-4 bg-accent-metal/20 overflow-hidden">
                            <div className="w-full h-full bg-accent-wood animate-bounce" style={{ animationDelay: `${i * 150}ms`, height: '60%' }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Corner BL: Spatial Radar */}
                    <div className="absolute bottom-12 left-12 flex flex-col gap-4">
                      <div className="relative w-32 h-32 rounded-full border border-accent-metal/20 overflow-hidden bg-base-stone-20/10">
                        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(196,80,60,0.2))] animate-[spin_4s_linear_infinite]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-accent-metal/10" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-accent-metal/10" />
                        <div className="absolute top-[40%] left-[60%] w-2 h-2 rounded-full bg-accent-fire blur-[2px] animate-pulse" />
                      </div>
                      <span className="text-[0.5rem] font-mono text-accent-metal uppercase tracking-[0.3em]">Spatial_Mapping_01</span>
                    </div>

                    {/* Corner BR: Asset Identification */}
                    <div className="absolute bottom-12 right-12 text-right">
                      <div className="flex flex-col gap-1 mb-4">
                        <span className="text-[0.6rem] font-serif italic text-base-black">Bipedal_Subject_A1</span>
                        <span className="text-[0.5rem] font-mono text-accent-metal uppercase tracking-widest leading-none">Status: Tracking_Confirmed</span>
                      </div>
                      <div className="w-48 h-[1px] bg-accent-metal/10 relative">
                         <div className="absolute right-0 top-0 h-full w-12 bg-accent-fire/40" />
                      </div>
                    </div>

                    {/* Center Targeting HUD */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-64 h-64 border border-white/5 rounded-full flex items-center justify-center">
                        <div className="absolute inset-x-0 w-full h-[1px] bg-white/10" />
                        <div className="absolute inset-y-0 w-[1px] h-full bg-white/10" />
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-fire/60" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-fire/60" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-fire/60" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-fire/60" />
                        
                        <div className="flex flex-col items-center gap-1 opacity-40">
                          <span className="text-[0.5rem] font-mono text-accent-metal uppercase">Lock_Acq</span>
                          <span className="text-[0.6rem] font-mono text-accent-fire animate-pulse font-bold">100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <style jsx global>{`
                  canvas { outline: none; }
                `}</style>
              </div>
          </section>
        </div>
      </div>

      {/* SECTION 2 — RAW SIGNAL */}
      <SectionWrapper topSpacing="md">
        <SectionGrid>
          <div className="col-span-1 border-r border-accent-metal/20 px-8 pt-48 pb-48 flex flex-col justify-between">
            {/* Section identity */}
            <div className="flex flex-col gap-16">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
                02 — Raw Signal
              </span>
              <h2 className="font-serif text-title-20 text-base-black reveal" style={{ fontWeight: 400 }}>
                Channel<br />State<br />Information
              </h2>
              <p className="text-body-20 text-base-brown font-light leading-relaxed reveal">
                56-subcarrier amplitude sampled at 20 Hz across the 2.4 GHz band.
              </p>
            </div>

            {/* Live subcarrier stat block — bottom of col-1 */}
            <div className="flex flex-col gap-0 border-t border-accent-metal/20 mt-32 reveal">
              {[
                { label: 'Subcarriers', value: '56' , serif: true },
                { label: 'Sample Rate', value: '20 Hz', serif: false },
                { label: 'Band',        value: '2.4 GHz', serif: false },
              ].map(({ label, value, serif }) => (
                <div key={label} className="flex items-baseline justify-between py-12 border-b border-accent-metal/10">
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">{label}</span>
                  <span className={serif
                    ? 'font-serif text-title-10 text-base-black'
                    : 'text-body-20 text-base-black font-light'
                  } style={{ fontWeight: 400 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 border-r border-accent-metal/20 px-8 pt-48 pb-48 flex flex-col gap-24">
            <div className="flex flex-col gap-12">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
                Amplitude · Last 200 Frames
              </span>
              <p className="text-body-20 text-base-brown font-light reveal">
                Averaged subcarrier amplitude over the rolling window. Peaks correspond 
                to motion events; the baseline drift encodes breathing micro-movement.
              </p>
            </div>

            {/* Chart */}
            <div className="reveal">
              <AmplitudeChart frame={frame} />
            </div>

            {/* Live min / max / avg — computed from latest frame */}
            <div className="grid grid-cols-3 border-t border-accent-metal/20 reveal">
              {[
                { label: 'Min', getValue: (f: any) => Math.min(...f.raw_amplitude).toFixed(3) },
                { label: 'Avg', getValue: (f: any) => (f.raw_amplitude.reduce((a:any,b:any)=>a+b,0)/f.raw_amplitude.length).toFixed(3) },
                { label: 'Max', getValue: (f: any) => Math.max(...f.raw_amplitude).toFixed(3) },
              ].map(({ label, getValue }, i) => (
                <div key={label}
                  className={`flex flex-col gap-6 py-16 px-8 ${i < 2 ? 'border-r border-accent-metal/20' : ''}`}>
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">{label}</span>
                  <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                    {frame ? getValue(frame) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 px-8 pt-48 pb-48 flex flex-col gap-16">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
              Subcarrier Map
            </span>

            {/* 56-bar SVG subcarrier visualizer */}
            <div className="flex-1 reveal" style={{ minHeight: '24rem' }}>
              <SubcarrierBars amplitudes={frame?.raw_amplitude ?? []} />
            </div>

            <p className="text-caption-30 text-accent-metal/60 font-light reveal">
              Each bar = 1 subcarrier. Height = amplitude. Color = deviation from mean.
            </p>
          </div>
        </SectionGrid>
      </SectionWrapper>

      {/* SECTION 3 — SYSTEM & SENSOR STATUS */}
      <SectionWrapper topSpacing="md">
        <SectionGrid>
          <div className="col-span-1 border-r border-accent-metal/20 px-8 pt-48 pb-48 flex flex-col justify-between">
            <div className="flex flex-col gap-16">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
                03 — System
              </span>
              <h2 className="font-serif text-title-20 text-base-black reveal" style={{ fontWeight: 400 }}>
                Sensor<br />Status
              </h2>
              <p className="text-body-20 text-base-brown font-light leading-relaxed reveal">
                Live frame pipeline health, source metadata, and signal confidence breakdown.
              </p>
            </div>

            {/* Total frames received counter */}
            <div className="flex flex-col gap-8 border-t border-accent-metal/20 pt-16 reveal">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">
                Frames Received
              </span>
              <span className="font-serif text-title-20 text-base-black" style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                {frameCount.toLocaleString()}
              </span>
              <span className="text-caption-30 text-accent-metal/50 font-light">Since page load</span>
            </div>
          </div>

          <div className="col-span-1 border-r border-accent-metal/20 px-8 pt-48 pb-48 flex flex-col gap-24">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
              Frame Metadata
            </span>

            <div className="flex flex-col border-t border-accent-metal/20 reveal">
              {[
                {
                  label: 'Frame ID',
                  value: frame?.frame_id ? frame.frame_id.slice(0, 8) + '…' : '—',
                  mono: true,
                },
                {
                  label: 'Timestamp',
                  value: frame ? new Date(frame.timestamp * 1000).toLocaleTimeString() : '—',
                  mono: true,
                },
                {
                  label: 'Source',
                  value: frame?.source ?? '—',
                  mono: false,
                  pill: true,
                  pillColor: frame?.source === 'esp32'
                    ? 'bg-accent-water/15 text-accent-water'
                    : frame?.source === 'replay'
                    ? 'bg-accent-wood/15 text-accent-wood'
                    : 'bg-accent-fire/15 text-accent-fire',
                },
                {
                  label: 'Stream Rate',
                  value: fps > 0 ? `${fps} fps` : '—',
                  mono: true,
                },
                {
                  label: 'Connection',
                  value: connectionStatus,
                  mono: false,
                  statusColor: connectionStatus === 'connected'
                    ? 'text-accent-wood'
                    : connectionStatus === 'reconnecting'
                    ? 'text-accent-fire'
                    : 'text-accent-metal',
                },
              ].map(({ label, value, mono, pill, pillColor, statusColor }) => (
                <div key={label} className="flex items-center justify-between py-14 border-b border-accent-metal/10 gap-8">
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light shrink-0">{label}</span>
                  {pill ? (
                    <span className={`inline-flex items-center gap-5 px-8 py-3 rounded-full text-caption-30 uppercase font-medium ${pillColor}`}>
                      <span className="w-[0.35rem] h-[0.35rem] rounded-full" style={{ background: 'currentColor' }} />
                      {value}
                    </span>
                  ) : (
                    <span className={`${mono ? 'font-mono text-body-20' : 'text-body-20 font-light'} ${statusColor ?? 'text-base-black'} text-right`}>
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 border-r border-accent-metal/20 px-8 pt-48 pb-48 flex flex-col gap-32">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
              Confidence
            </span>

            <div className="flex flex-col gap-32 reveal">
              <RadialGauge
                label="Breathing"
                value={frame?.vitals.breathing_confidence ?? 0}
                color="rgb(74,98,111)"
              />
              <RadialGauge
                label="Heart Rate"
                value={frame?.vitals.hr_confidence ?? 0}
                color="rgb(74,98,111)"
              />
              <RadialGauge
                label="Presence"
                value={frame?.presence.confidence ?? 0}
                color="rgb(112,116,85)"
              />
            </div>
          </div>

          <div className="col-span-1 px-8 pt-48 pb-48 flex flex-col gap-24">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
              Event Log
            </span>

            <div className="flex flex-col gap-0 border-t border-accent-metal/20 reveal">
              {eventLog.length === 0 ? (
                <div className="py-16">
                  <span className="text-caption-30 text-accent-metal/40 font-light font-mono">
                    No events yet…
                  </span>
                </div>
              ) : eventLog.map((ev, i) => (
                <div key={i}
                  className="flex items-center justify-between py-12 border-b border-accent-metal/10"
                  style={{ opacity: 1 - i * 0.14 }}>
                  <span className={`text-caption-30 uppercase tracking-widest font-light
                    ${ev.status === 'connected' ? 'text-accent-wood'
                    : ev.status === 'reconnecting' ? 'text-accent-fire'
                    : 'text-accent-metal'}`}>
                    {ev.status}
                  </span>
                  <span className="text-caption-30 text-accent-metal/50 font-mono">{ev.time}</span>
                </div>
              ))}
            </div>

            {/* Live FPS bar — techy secondary element */}
            <div className="flex flex-col gap-8 reveal">
              <div className="flex items-center justify-between">
                <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">
                  Frame Rate
                </span>
                <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400 }}>
                  {fps > 0 ? fps : '—'}
                  <span className="text-caption-30 text-accent-metal ml-4 font-sans font-light">fps</span>
                </span>
              </div>
              {/* FPS bar — target 20 fps */}
              <div className="h-[1px] w-full bg-base-stone-50">
                <div
                  className="h-full bg-accent-water transition-all duration-500"
                  style={{ width: `${Math.min(100, (fps / 20) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-caption-30 text-accent-metal/40 font-light">0</span>
                <span className="text-caption-30 text-accent-metal/40 font-light">20 Hz target</span>
              </div>
            </div>
          </div>
        </SectionGrid>
      </SectionWrapper>

      {/* SECTION 4 — POSE ESTIMATION */}
      <SectionWrapper topSpacing="md">
        <SectionGrid>
          <div className="col-span-2 border-r border-accent-metal/20 pt-48 pb-48 reveal">
            <PoseCanvas />
          </div>

          <div className="col-span-1 border-r border-accent-metal/20 px-8 pt-48 pb-48 flex flex-col gap-24">
            <div className="flex flex-col gap-16">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
                04 — Pose
              </span>
              <h2 className="font-serif text-title-20 text-base-black reveal" style={{ fontWeight: 400 }}>
                Pose<br />Estimation
              </h2>
              <p className="text-body-20 text-base-brown font-light leading-relaxed reveal">
                Full-body skeleton inference from CSI perturbation. No camera. No wearable.
              </p>
            </div>

            <div className="flex flex-col border-t border-accent-metal/20 reveal">
              {[
                { label: 'Standard',    value: 'COCO',     serif: false },
                { label: 'Keypoints',   value: '17',        serif: true  },
                { label: 'Connections', value: '16',        serif: true  },
                { label: 'Update Rate', value: '20 Hz',     serif: false },
                { label: 'Through-Wall',value: 'Yes',     serif: false },
                { label: 'Hardware',    value: 'ESP32-S3',  serif: false },
              ].map(({ label, value, serif }) => (
                <div key={label} className="flex items-baseline justify-between py-14 border-b border-accent-metal/10">
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">{label}</span>
                  <span className={serif
                    ? 'font-serif text-title-10 text-base-black'
                    : 'text-body-20 text-base-black font-light'
                  } style={{ fontWeight: 400 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 px-8 pt-48 pb-48 flex flex-col gap-24">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
              COCO 17-Point
            </span>
            <div className="flex-1 reveal">
              <CocoSkeletonDiagram />
            </div>
            <p className="text-caption-30 text-accent-metal/50 font-light reveal">
              Skeleton topology used for CSI-based pose estimation.
              Joints pulse to indicate estimation activity.
            </p>
          </div>
        </SectionGrid>
      </SectionWrapper>

      {/* FOOTER */}
      <footer className="border-t border-accent-metal/20 mt-96">
        <div className="grid grid-cols-4 w-full divide-x divide-accent-metal/20">

          {/* Col 1 — Brand */}
          <div className="px-8 pt-48 pb-48 flex flex-col justify-between">
            <div className="flex flex-col gap-12">
              <span className="font-serif text-title-10 text-base-black reveal" style={{ fontWeight: 400 }}>
                RaVis
              </span>
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
                (WiFi Sensing)
              </span>
              <p className="text-body-20 text-base-brown font-light leading-relaxed reveal">
                Contactless human sensing via Channel State Information.
              </p>
            </div>
            <span className="text-caption-30 text-accent-metal/50 font-light reveal">
              © {new Date().getFullYear()} RaVis
            </span>
          </div>

          {/* Col 2 — Navigation */}
          <div className="px-8 pt-48 pb-48 flex flex-col gap-16">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
              Navigation
            </span>
            <div className="flex flex-col gap-0 border-t border-accent-metal/20 reveal">
              {[
                { label: 'Dashboard', href: '/' },
                { label: 'Sensing',   href: '/' },
                { label: 'Replay',    href: '/replay' },
              ].map(({ label, href }) => (
                <a key={label} href={href}
                  className="flex items-center justify-between py-14 border-b border-accent-metal/10
                            text-body-20 text-base-brown font-light
                            hover:text-base-black transition-colors duration-300 group">
                  {label}
                  <svg className="w-10 h-10 text-accent-metal/30 group-hover:text-accent-metal transition-colors"
                    viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Col 3 — Technology */}
          <div className="px-8 pt-48 pb-48 flex flex-col gap-16">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
              Technology
            </span>
            <div className="flex flex-col gap-0 border-t border-accent-metal/20 reveal">
              {[
                { label: 'ESP32-S3',   sub: 'Sensor Hardware' },
                { label: 'CSI',        sub: 'Channel State Info' },
                { label: 'FastAPI',    sub: 'Backend Runtime' },
                { label: 'Three.js',   sub: '3D Visualization' },
                { label: 'Next.js 14', sub: 'Frontend Framework' },
              ].map(({ label, sub }) => (
                <div key={label} className="flex items-center justify-between py-12 border-b border-accent-metal/10">
                  <span className="text-body-20 text-base-black font-light">{label}</span>
                  <span className="text-caption-30 text-accent-metal/60 font-light">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Col 4 — Links + Legal */}
          <div className="px-8 pt-48 pb-48 flex flex-col justify-between gap-32">
            <div className="flex flex-col gap-16">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light reveal">
                Resources
              </span>
              <div className="flex flex-col gap-0 border-t border-accent-metal/20 reveal">
                {[
                  { label: 'GitHub',        href: '#' },
                  { label: 'Documentation', href: '#' },
                  { label: 'API Reference', href: '#' },
                ].map(({ label, href }) => (
                  <a key={label} href={href}
                    className="flex items-center justify-between py-14 border-b border-accent-metal/10
                              text-body-20 text-base-brown font-light
                              hover:text-base-black transition-colors duration-300 group">
                    {label}
                    <svg className="w-10 h-10 text-accent-metal/30 group-hover:text-accent-metal transition-colors"
                      viewBox="0 0 16 16" fill="none">
                      <path d="M4 12L12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8 reveal">
              <span className="text-caption-30 text-accent-metal/40 font-light">
                Built for academic research.<br />Not for medical use.
              </span>
              <span className="text-caption-30 text-accent-metal/30 font-light">
                MIT License
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

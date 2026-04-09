'use client'

import React, { useEffect, useState } from 'react'
import WifiVisualization from '@/components/WifiVisualization'
import AmplitudeChart from '@/components/AmplitudeChart'
import PoseCanvas from '@/components/PoseCanvas'
import { ColDividers } from '@/components/ColDividers'
import { SectionWrapper } from '@/components/SectionWrapper'
import { SectionGrid } from '@/components/SectionGrid'
import { useSensingStream } from '@/hooks/useSensingStream'
import { useReveal } from '@/hooks/useReveal'
import Link from 'next/link'

export default function Dashboard() {
  const { frame, connected, fps, connectionStatus } = useSensingStream()
  const [active, setActive] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  useReveal()

  const copyValue = (key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1800)
    })
  }

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
            <div className="order-2 lg:order-1 col-span-1
                            border-r border-accent-metal/20
                            flex flex-col
                            px-12 pt-16 pb-16
                            lg:h-[calc(100svh-var(--header-height))]
                            lg:overflow-y-auto scrollbar-hide
                            gap-0">

              {/* ── ZONE 1: Identity — top ── */}
              <div className="flex flex-col gap-12 pb-24 border-b border-accent-metal/10">

                {/* Status bubble */}
                <div className="flex items-center gap-8 reveal">
                  <span className={`w-5 h-5 rounded-full flex-shrink-0 transition-colors duration-500
                    ${connected ? 'bg-accent-wood' : 'bg-accent-metal/40'}`} />
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">
                    {connected ? 'Live' : 'Offline'}
                  </span>
                </div>

                {/* H1 — L1 heading, the largest thing in the panel */}
                <h1 className="font-serif text-title-20 text-base-black reveal" style={{ fontWeight: 400 }}>
                  WiFi Presence<br />& Vital Signs
                </h1>

                {/* Description */}
                <p className="text-body-20 text-base-brown font-light leading-relaxed reveal">
                  Contactless sensing through walls.<br />No cameras. No wearables.
                </p>

              </div>

              {/* ── ZONE 2: Source — middle spacer ── */}
              <div className="py-20 border-b border-accent-metal/10 reveal">
                <div className="flex items-center gap-8">
                  <span className="w-4 h-4 rounded-full bg-accent-fire/70 flex-shrink-0" />
                  <span className="text-caption-30 uppercase tracking-widest text-accent-fire font-light">
                    {frame?.source ?? 'No signal'}
                  </span>
                </div>
              </div>

              {/* ── ZONE 3: Data rows — flex-1 fills remaining space ── */}
              <div className="flex flex-col flex-1 justify-end reveal">

                {/* ── Breathing row ── */}
                <div
                  className="group flex items-center justify-between
                             py-16 px-8 -mx-8
                             border-t border-accent-metal/10
                             rounded-sm cursor-pointer
                             hover:bg-base-stone-20 transition-colors duration-300"
                  onClick={() => copyValue('breathing', frame?.vitals.breathing_bpm?.toFixed(1) ?? '—')}
                  title="Click to copy"
                >
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">
                    Breathing
                  </span>
                  <div className="flex items-center gap-10">
                    {/* Confidence dots */}
                    <div className="flex items-center gap-3">
                      {[0.33, 0.66, 1.0].map((t, i) => (
                        <span key={i} className="block w-[0.35rem] h-[0.35rem] rounded-full transition-colors duration-500"
                          style={{ background: (frame?.vitals.breathing_confidence ?? 0) >= t ? 'var(--color-accent-water)' : 'var(--color-base-stone-50)' }}
                        />
                      ))}
                    </div>
                    {/* Value */}
                    <div className="flex items-baseline gap-5 min-w-[6rem] justify-end">
                      {copiedKey === 'breathing' ? (
                        <span className="text-caption-30 uppercase tracking-widest text-accent-wood font-light">Copied</span>
                      ) : (
                        <>
                          <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                            {frame?.vitals.breathing_bpm?.toFixed(1) ?? '—'}
                          </span>
                          <span className="text-caption-30 text-accent-metal">bpm</span>
                        </>
                      )}
                    </div>
                    {/* Copy icon — visible only on hover */}
                    <svg className="w-10 h-10 text-accent-metal/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                      viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  </div>
                </div>

                {/* ── Heart Rate row ── */}
                <div
                  className="group flex items-center justify-between
                             py-16 px-8 -mx-8
                             border-t border-accent-metal/10
                             rounded-sm cursor-pointer
                             hover:bg-base-stone-20 transition-colors duration-300"
                  onClick={() => copyValue('heartrate', frame?.vitals.heart_rate_bpm?.toFixed(0) ?? '—')}
                  title="Click to copy"
                >
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">
                    Heart Rate
                  </span>
                  <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                      {[0.33, 0.66, 1.0].map((t, i) => (
                        <span key={i} className="block w-[0.35rem] h-[0.35rem] rounded-full transition-colors duration-500"
                          style={{ background: (frame?.vitals.hr_confidence ?? 0) >= t ? 'var(--color-accent-water)' : 'var(--color-base-stone-50)' }}
                        />
                      ))}
                    </div>
                    <div className="flex items-baseline gap-5 min-w-[6rem] justify-end">
                      {copiedKey === 'heartrate' ? (
                        <span className="text-caption-30 uppercase tracking-widest text-accent-wood font-light">Copied</span>
                      ) : (
                        <>
                          <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                            {frame?.vitals.heart_rate_bpm?.toFixed(0) ?? '—'}
                          </span>
                          <span className="text-caption-30 text-accent-metal">bpm</span>
                        </>
                      )}
                    </div>
                    <svg className="w-10 h-10 text-accent-metal/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                      viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  </div>
                </div>

                {/* ── Presence row ── */}
                <div
                  className="group flex items-center justify-between
                             py-16 px-8 -mx-8
                             border-t border-accent-metal/10
                             rounded-sm cursor-pointer
                             hover:bg-base-stone-20 transition-colors duration-300"
                  onClick={() => copyValue('presence', frame?.presence.occupied
                    ? `${frame.presence.person_count} ${frame.presence.person_count === 1 ? 'person' : 'persons'}`
                    : 'Empty')}
                  title="Click to copy"
                >
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">
                    Presence
                  </span>
                  <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                      {[0.33, 0.66, 1.0].map((t, i) => (
                        <span key={i} className="block w-[0.35rem] h-[0.35rem] rounded-full transition-colors duration-500"
                          style={{ background: (frame?.presence.confidence ?? 0) >= t ? 'var(--color-accent-wood)' : 'var(--color-base-stone-50)' }}
                        />
                      ))}
                    </div>
                    {copiedKey === 'presence' ? (
                      <span className="text-caption-30 uppercase tracking-widest text-accent-wood font-light min-w-[6rem] text-right">Copied</span>
                    ) : (
                      <span className={`inline-flex items-center gap-5 px-8 py-3 rounded-full
                        text-caption-30 uppercase tracking-wider font-medium
                        ${frame?.presence.occupied ? 'bg-accent-wood/15 text-accent-wood' : 'bg-base-stone-50 text-accent-metal'}`}>
                        <span className={`w-[0.4rem] h-[0.4rem] rounded-full flex-shrink-0 ${frame?.presence.occupied ? 'bg-accent-wood' : 'bg-accent-metal/40'}`} />
                        {frame?.presence.occupied
                          ? `${frame.presence.person_count} ${frame.presence.person_count === 1 ? 'person' : 'persons'}`
                          : 'Empty'}
                      </span>
                    )}
                    <svg className="w-10 h-10 text-accent-metal/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                      viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  </div>
                </div>

                {/* ── Stream micro-row ── */}
                <div className="flex items-center justify-between py-12 border-t border-accent-metal/10 border-b border-accent-metal/10">
                  <span className="text-caption-30 uppercase tracking-widest text-accent-metal/50 font-light">
                    Stream
                  </span>
                  <div className="flex items-center gap-8">
                    <span className="text-caption-30 text-accent-metal/50 font-mono">
                      {fps > 0 ? `${fps} fps` : '—'}
                    </span>
                    <span className="text-accent-metal/30">·</span>
                    <span className={`text-caption-30 uppercase tracking-widest font-light
                      ${connectionStatus === 'connected' ? 'text-accent-wood' :
                        connectionStatus === 'reconnecting' ? 'text-accent-fire' : 'text-accent-metal/50'}`}>
                      {connectionStatus}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* VISUALIZATION COLUMN (3/4) */}
            <div className="relative order-1 lg:order-2 lg:col-span-3 lg:h-[calc(100svh-var(--header-height))] overflow-hidden">
              <WifiVisualization frame={frame} connected={connected} />
            </div>
          </section>
        </div>
      </div>

      {/* SECTION: AMPLITUDE SIGNAL */}
      <SectionWrapper topSpacing="md">
        <SectionGrid>
          <div className="px-4 lg:px-0 lg:pr-8 pb-32 lg:pb-0">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light block reveal">
              Raw Signal
            </span>
          </div>
          <div className="col-span-full lg:col-span-2 lg:col-start-2 px-4 lg:px-8">
            <div className="mb-32 reveal">
              <h2 className="font-serif text-title-20 text-base-black reveal" style={{ fontWeight: 400 }}>
                Channel State<br />Information
              </h2>
              <p className="text-body-20 text-base-brown reveal" style={{ fontWeight: 300 }}>
                Real-time amplitude across 56 WiFi subcarriers. Each frame captures 
                how the signal is perturbed by movement, breathing micro-motion, and 
                environmental reflection. The waveform below shows the averaged 
                subcarrier amplitude over the last 200 frames.
              </p>
              <div className="flex items-baseline gap-1 mt-16 reveal">
                <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400 }}>56</span>
                <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light ml-8">Subcarriers</span>
              </div>
            </div>
            <div className="border-t border-accent-metal/20 pt-16 reveal">
              <AmplitudeChart frame={frame} />
            </div>
            {frame?.raw_amplitude && (
              <div className="mt-16 flex items-center gap-32 border-t border-accent-metal/15 pt-16 reveal">
                {[
                  { label: 'Min', value: Math.min(...frame.raw_amplitude).toFixed(3) },
                  { label: 'Max', value: Math.max(...frame.raw_amplitude).toFixed(3) },
                  { label: 'Avg', value: (frame.raw_amplitude.reduce((a,b) => a+b, 0) / frame.raw_amplitude.length).toFixed(3) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-4">
                    <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">
                      {label}
                    </span>
                    <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionGrid>
      </SectionWrapper>

      {/* SECTION: SYSTEM STATUS */}
      <SectionWrapper topSpacing="md">
        <SectionGrid className="gap-y-96 lg:gap-y-0">
          <div className="order-2 lg:order-1 col-span-full lg:col-span-2 lg:pr-8">
            <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light block reveal">
              System
            </span>
            <h2 className="font-serif text-title-20 text-base-black reveal" style={{ fontWeight: 400, marginTop: '1.5rem', marginBottom: '2rem' }}>
              Sensor<br />Status
            </h2>
            
            <div className="flex flex-col border-t border-accent-metal/20 reveal">
              {/* Frame ID */}
              <div className="flex items-start justify-between py-16 border-b border-accent-metal/10 gap-16">
                <span className="text-caption-30 uppercase tracking-widest text-accent-metal shrink-0" style={{ fontWeight: 300 }}>
                  Frame ID
                </span>
                <span className="text-body-20 text-base-brown font-mono font-light text-right truncate">
                  {frame?.frame_id?.slice(0, 18) ?? '—'}…
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between py-16 border-b border-accent-metal/10">
                <span className="text-caption-30 uppercase tracking-widest text-accent-metal shrink-0" style={{ fontWeight: 300 }}>
                  Last Frame
                </span>
                <span className="text-body-20 text-base-brown font-mono font-light">
                  {frame ? new Date(frame.timestamp * 1000).toLocaleTimeString() : '—'}
                </span>
              </div>

              {/* Source */}
              <div className="flex items-center justify-between py-16 border-b border-accent-metal/10">
                <span className="text-caption-30 uppercase tracking-widest text-accent-metal" style={{ fontWeight: 300 }}>
                  Source
                </span>
                <span className={`inline-flex items-center gap-5 px-8 py-3 rounded-full text-caption-30 uppercase font-medium
                  ${frame?.source === 'esp32' ? 'bg-accent-water/15 text-accent-water' :
                    frame?.source === 'replay' ? 'bg-accent-wood/15 text-accent-wood' :
                    'bg-accent-fire/15 text-accent-fire'}`}>
                  <span className="w-4 h-4 rounded-full" style={{ background: 'currentColor' }} />
                  {frame?.source ?? 'None'}
                </span>
              </div>

              {/* Connection status */}
              <div className="flex items-center justify-between py-16 border-b border-accent-metal/10">
                <span className="text-caption-30 uppercase tracking-widest text-accent-metal" style={{ fontWeight: 300 }}>
                  Connection
                </span>
                <span className={`text-caption-30 uppercase tracking-widest font-medium
                  ${connectionStatus === 'connected' ? 'text-accent-wood' :
                    connectionStatus === 'reconnecting' ? 'text-accent-fire' : 'text-accent-metal'}`}>
                  {connectionStatus}
                </span>
              </div>

              {/* Stream FPS */}
              <div className="flex items-center justify-between py-16">
                <span className="text-caption-30 uppercase tracking-widest text-accent-metal" style={{ fontWeight: 300 }}>
                  Frame Rate
                </span>
                <div className="flex items-baseline gap-5">
                  <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400 }}>
                    {fps > 0 ? fps : '—'}
                  </span>
                  <span className="text-caption-30 text-accent-metal">fps</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 col-span-full lg:col-span-1 lg:col-start-4 px-4 lg:px-8">
            <div className="flex flex-col gap-0 border-t border-accent-metal/20 reveal">
              <span className="text-caption-30 uppercase tracking-widest text-accent-metal pb-16" style={{ fontWeight: 300 }}>
                Confidence
              </span>

              {[
                { label: 'Breathing', value: frame?.vitals.breathing_confidence, color: 'var(--color-accent-water)' },
                { label: 'Heart Rate', value: frame?.vitals.hr_confidence, color: 'var(--color-accent-water)' },
                { label: 'Presence',  value: frame?.presence.confidence, color: 'var(--color-accent-wood)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="py-16 border-b border-accent-metal/10">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-caption-30 text-accent-metal font-light">
                      {label}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400 }}>
                        {value != null ? Math.round(value * 100) : '—'}
                      </span>
                      {value != null && <span className="text-caption-30 text-accent-metal">%</span>}
                    </div>
                  </div>
                  {/* Full-width thin bar */}
                  <div className="h-[1px] w-full bg-base-stone-50">
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${Math.round((value ?? 0) * 100)}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionGrid>
      </SectionWrapper>

      {/* SECTION: POSE ESTIMATION */}
      <SectionWrapper topSpacing="md">
        <SectionGrid className="gap-y-96 lg:gap-y-0">
          <div className="order-2 lg:order-1 col-span-full lg:col-span-2 lg:pr-8">
            <PoseCanvas />
          </div>
          <div className="order-1 lg:order-2 col-span-full lg:col-span-1 lg:col-start-3 px-4 lg:px-8">
            <h2 className="font-serif text-title-20 text-base-black reveal" style={{ fontWeight: 400 }}>
              Pose<br />Estimation
            </h2>
          </div>
          <div className="order-3 col-span-full lg:col-span-1 lg:col-start-4 px-4 lg:px-8">
            <div className="flex flex-col gap-16 reveal">
              <p className="text-body-20 text-base-brown font-light leading-relaxed">
                When ESP32-S3 hardware is connected, RuView estimates full-body 
                skeleton pose from CSI perturbation patterns — no camera, no wearable.
              </p>
              <div className="flex flex-col gap-0 border-t border-accent-metal/20 mt-8">
                {[
                  { label: 'Keypoints',  value: '17', type: 'number' },
                  { label: 'Standard',   value: 'COCO', type: 'text' },
                  { label: 'Update Rate', value: '20', unit: 'Hz', type: 'number' },
                  { label: 'Through-Wall', value: 'Yes', type: 'text' },
                ].map(({ label, value, unit, type }) => (
                  <div key={label} className="flex items-center justify-between py-12 border-b border-accent-metal/10">
                    <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-light">
                      {label}
                    </span>
                    <div className="flex items-baseline gap-4">
                      {type === 'number' ? (
                        <span className="font-serif text-title-10 text-base-black" style={{ fontWeight: 400 }}>
                          {value}
                        </span>
                      ) : (
                        <span className="text-body-20 text-base-black font-light">{value}</span>
                      )}
                      {unit && <span className="text-caption-30 text-accent-metal">{unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionGrid>
      </SectionWrapper>

      {/* FOOTER */}
      <SectionWrapper topSpacing="sm" className="pb-0 mb-0">
        <SectionGrid className="pb-0">
          <div className="hidden lg:block lg:col-span-1" />
          
          <div className="col-span-full lg:col-span-2 px-4 lg:px-8 flex flex-col items-center text-center pb-24">
            <div className="mb-32">
              <span className="font-serif text-title-20 text-base-black" style={{ fontWeight: 400 }}>RuView</span>
              <span className="text-caption-30 ml-12 uppercase tracking-widest text-accent-metal font-light">(WiFi)</span>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-32 gap-y-16 mb-48">
              {['Dashboard', 'Sensing', 'Replay', 'Docs'].map(item => (
                <Link key={item} href="#" className="text-body-20 text-base-brown font-light hover:text-base-black transition-colors duration-300">
                  {item}
                </Link>
              ))}
            </nav>

            <div className="flex gap-32 mb-48">
              <Link href="#" className="text-caption-30 uppercase tracking-widest text-accent-metal/60 font-light border-b border-accent-metal/20 pb-4">GITHUB</Link>
              <Link href="#" className="text-caption-30 uppercase tracking-widest text-accent-metal/60 font-light border-b border-accent-metal/20 pb-4">DOCUMENTATION</Link>
            </div>

            <div className="w-full h-48 bg-base-stone-20/50 flex items-center justify-center text-caption-30 text-accent-metal/60 uppercase tracking-widest font-light">
              © {new Date().getFullYear()} RuView (WiFi Sensing) — Science First
            </div>
          </div>
        </SectionGrid>
      </SectionWrapper>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionWrapper } from '@/components/SectionWrapper'
import { SectionGrid } from '@/components/SectionGrid'
import { useReveal } from '@/hooks/useReveal'
import { Clock, Database, Play, ChevronRight, HardDrive, RefreshCcw } from 'lucide-react'

interface Session {
  filename: string
  size_kb: number
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function ReplayPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useReveal()

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/sessions`)
      const data = await res.json()
      setSessions(data)
    } catch (err) {
      console.error('Failed to fetch sessions', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div className="bg-base-white min-h-screen">
      <SectionWrapper topSpacing="md">
        <SectionGrid>

          {/* Left Panel — Brand & Context */}
          <div className="col-span-1 border-r border-accent-metal/20 px-8 pt-48 pb-48 flex flex-col justify-between min-h-[40vh] lg:min-h-[80vh]">
            <div className="flex flex-col gap-32">
              <div className="flex flex-col gap-12">
                <span className="text-caption-30-fixed uppercase tracking-[0.3em] text-accent-metal font-medium reveal">
                  02 — Archive
                </span>
                <h1 className="font-serif text-title-10 text-base-black leading-tight reveal">
                  Replay Buffer <br /> Logic.
                </h1>
                <p className="text-body-20 text-base-brown font-light leading-relaxed mt-16 reveal">
                  Historical signal analysis. Select a recording sector to re-mount previous sensing environments.
                </p>
              </div>

              <div className="flex flex-col gap-16 border-t border-accent-metal/10 pt-32 reveal">
                <div className="flex items-center justify-between py-12 border-b border-accent-metal/5 text-caption-30 uppercase tracking-widest text-accent-metal">
                  <span>Repository</span>
                  <span className="text-accent-earth/60 font-mono lowercase">/recordings</span>
                </div>
                <div className="flex items-center justify-between py-12 border-b border-accent-metal/5 text-caption-30 uppercase tracking-widest text-accent-metal">
                  <span>Format</span>
                  <span className="font-mono">JSONL / 20HZ</span>
                </div>
              </div>
            </div>

            <Link href="/" className="group relative w-fit py-16 pr-64 border-b border-accent-metal/20 mt-64 inline-flex items-center overflow-hidden reveal">
              <div className="absolute inset-0 bg-accent-earth scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 opacity-5" />
              <span className="text-caption-30 uppercase tracking-[0.3em] text-base-brown flex items-center gap-12 font-medium group-hover:text-base-black transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4 -rotate-180 transition-transform group-hover:-translate-x-4">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                BACK TO LIVE
              </span>
            </Link>
          </div>

          {/* Right Panel — Session List */}
          <div className="col-span-3 px-8 lg:px-48 pt-48 pb-96">
            <div className="flex items-center justify-between mb-48 reveal">
              <div className="flex items-center gap-16">
                <div className="w-1.5 h-1.5 bg-accent-earth animate-pulse" />
                <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-mono">
                  {loading ? 'Scanning sectors...' : `${sessions.length} sectors indexed`}
                </span>
              </div>
              <button
                onClick={fetchSessions}
                className="p-12 hover:bg-base-stone-20 text-accent-metal hover:text-base-black transition-all group rounded-full border border-accent-metal/10"
              >
                <RefreshCcw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex flex-col border-t border-accent-metal/20 reveal">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-48 flex animate-pulse border-b border-accent-metal/10">
                    <div className="w-full h-12 bg-base-stone-20 rounded-sm" />
                  </div>
                ))
              ) : sessions.length === 0 ? (
                <div className="py-96 flex flex-col items-center justify-center text-center">
                  <Database className="w-16 h-16 text-accent-metal/10 mb-24" />
                  <span className="text-caption-30 text-accent-metal uppercase tracking-widest">Archive Empty</span>
                  <p className="text-body-30 text-accent-metal/40 mt-16 max-w-sm uppercase leading-relaxed">
                    No recordings detected in the backend storage directory. <br />
                    Start a live capture to populate the buffer.
                  </p>
                </div>
              ) : (
                sessions.map((session, i) => (
                  <div
                    key={session.filename}
                    className={`group flex items-center justify-between p-32 lg:p-48 border-b border-accent-metal/20 transition-all duration-500 hover:bg-base-stone-20/40 relative isolate ${playingId === session.filename ? 'bg-base-stone-20/80' : 'bg-transparent'}`}
                  >
                    <div className="flex items-start gap-48 flex-1">
                      <div className="flex flex-col items-center justify-center text-accent-metal/20 font-mono text-[0.8rem] pt-6">
                        <span>{String(i + 1).padStart(2, '0')}</span>
                        <div className="w-px h-24 bg-accent-metal/20 my-8" />
                      </div>

                      <div className="flex flex-col gap-12">
                        <div className="flex items-center gap-16">
                          <h3 className="font-serif text-title-10 text-base-black group-hover:text-accent-earth transition-colors">
                            {session.filename}
                          </h3>
                          {playingId === session.filename && (
                            <div className="flex items-center gap-8 px-12 py-4 bg-accent-fire/10 text-accent-fire text-caption-30 uppercase font-mono border border-accent-fire/20">
                              <div className="size-2 bg-accent-fire animate-pulse rounded-full" />
                              MOUNTED
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-24 text-caption-30 text-accent-metal uppercase tracking-[0.1em] font-mono">
                          <div className="flex items-center gap-8">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(session.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <span className="size-1 rounded-full bg-accent-metal/30" />
                          <div className="flex items-center gap-8">
                            <HardDrive className="w-3.5 h-3.5" />
                            {(session.size_kb / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-32">
                      <div className="hidden lg:flex items-center gap-4">
                        {['0.5', '1.0', '2.0'].map(speed => (
                          <button key={speed} className="px-10 py-6 text-caption-30 font-mono text-accent-metal/40 hover:text-accent-earth transition-colors border border-transparent hover:border-accent-earth/20">
                            {speed}×
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setPlayingId(playingId === session.filename ? null : session.filename)}
                        className="relative px-32 py-16 bg-base-black text-white text-caption-30 font-medium tracking-widest overflow-hidden transition-all active:scale-95"
                      >
                        <div className={`absolute inset-0 transition-all duration-700 ${playingId === session.filename ? 'bg-accent-fire' : 'bg-accent-water scale-x-0 origin-left group-hover:scale-x-100'}`} />
                        <span className="relative z-10 flex items-center gap-12 font-mono">
                          {playingId === session.filename ? 'UNMOUNT' : 'MOUNT'}
                          <div className={`size-1.5 rounded-full ${playingId === session.filename ? 'bg-white animate-pulse' : 'bg-accent-metal group-hover:bg-white'}`} />
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </SectionGrid>
      </SectionWrapper>
    </div>
  )
}

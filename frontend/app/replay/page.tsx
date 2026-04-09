'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { SectionWrapper } from '@/components/SectionWrapper'
import { SectionGrid } from '@/components/SectionGrid'
import { useReveal } from '@/hooks/useReveal'

const SESSIONS = [
  { id: '1', filename: '2026-04-06_12-45_sensing_session.json', size: '128KB', date: '6 APR 2026' },
  { id: '2', filename: '2026-04-06_14-30_sensing_session.json', size: '256KB', date: '6 APR 2026' },
  { id: '3', filename: '2026-04-05_09-15_overnight_log.json', size: '1.2MB', date: '5 APR 2026' },
]

export default function ReplayPage() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  useReveal()

  return (
    <div className="bg-base-white">
      <SectionWrapper topSpacing="md">
        <SectionGrid className="gap-y-96 lg:gap-y-0">
          
          {/* Left Panel - Col 1 */}
          <div className="lg:col-span-1 lg:border-r lg:border-accent-metal/20 lg:pr-32 flex flex-col justify-between">
            <div>
              <span className="text-caption-30 text-accent-metal uppercase reveal">Session Browser</span>
              <h1 className="mt-16 font-serif text-title-20 lg:text-title-10 reveal">
                Replay recorded <br /> sensing sessions.
              </h1>
              <p className="mt-24 text-body-30 text-base-brown reveal">
                Scroll through historical CSI data recordings to analyze previous sensing environments.
              </p>
            </div>
            
            <Link href="/" className="group relative w-fit py-12 pr-48 border-b border-accent-metal/40 mt-64 inline-flex items-center overflow-hidden">
               <div className="btn-fill bg-base-stone-50" />
               <span className="text-caption-30-fixed text-base-brown flex items-center gap-8 font-sans">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 -rotate-180">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  BACK TO DASHBOARD
               </span>
            </Link>
          </div>

          {/* Right Session List - Col 2-4 */}
          <div className="lg:col-span-3 lg:pl-48">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
              {SESSIONS.map((session) => (
                <div 
                  key={session.id} 
                  className={`group cursor-pointer border border-accent-metal/20 p-24 transition-colors duration-500 hover:bg-base-stone-20/40 relative isolate overflow-hidden reveal ${playingId === session.id ? 'bg-base-stone-50 border-accent-metal' : 'bg-white'}`}
                >
                  <div className="flex justify-between items-start">
                     <div className="flex flex-col gap-4">
                        <span className="text-caption-30 text-accent-metal font-sans">{session.date} — {session.size}</span>
                        <h3 className="font-serif text-title-10 mt-8 group-hover:text-base-brown transition-colors">
                          {session.filename}
                        </h3>
                     </div>
                     <div className="px-8 py-4 rounded-full bg-accent-fire/10 text-accent-fire text-caption-30 font-bold font-sans">
                        JSON LOG
                     </div>
                  </div>

                  <div className="mt-48 flex items-center justify-between">
                     <div className="flex items-center gap-12">
                        {['0.5×', '1.0×', '2.0×'].map(speed => (
                          <button key={speed} className="px-8 py-4 rounded bg-base-stone-20 text-caption-30 hover:bg-accent-metal/40 transition-colors font-sans">{speed}</button>
                        ))}
                     </div>
                     
                     <button 
                      onClick={() => setPlayingId(session.id === playingId ? null : session.id)}
                      className="relative px-24 py-12 bg-base-black text-white text-caption-30 font-bold overflow-hidden"
                     >
                       <div className={`btn-fill ${playingId === session.id ? 'bg-accent-fire' : 'bg-accent-water'}`} />
                       <span className="relative z-10 flex items-center gap-8 font-sans">
                          {playingId === session.id ? 'STOP' : 'PLAY'}
                          <div className={`size-2 rounded-full ${playingId === session.id ? 'bg-white animate-pulse' : 'bg-accent-fire'}`} />
                       </span>
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionGrid>
      </SectionWrapper>
    </div>
  )
}

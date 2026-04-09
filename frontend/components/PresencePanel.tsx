'use client'

import React from 'react'
import type { StreamState } from '../hooks/useSensingStream'

const PresencePanel: React.FC<{ state: StreamState }> = ({ state }) => {
  const { frame } = state
  const presence = frame?.presence
  const occupied = presence?.occupied ?? false

  return (
    <div className={`relative flex h-full min-h-[220px] w-full items-center justify-center border border-signal/15 transition-all duration-700 ${
      occupied ? 'bg-[#22c55e]/5' : 'bg-panel'
    }`}>
      <div className="flex flex-col items-center">
        <span className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[#7a818e]">
          Sensing Status
        </span>
        
        <h2 className={`mb-4 text-5xl font-bold tracking-tighter uppercase ${
          occupied ? 'text-[#22c55e] animate-pulse' : 'text-[#5a616e]'
        }`}>
          {occupied ? 'Occupied' : 'Empty'}
        </h2>

        {occupied && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-[#22c55e]/10 px-4 py-1 border border-[#22c55e]/20">
              <span className="font-mono text-xs font-semibold text-[#22c55e] uppercase tracking-widest">
                {presence?.person_count} {presence?.person_count === 1 ? 'Person' : 'Persons'} Detected
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-1 w-32 bg-base overflow-hidden">
                <div 
                  className="h-full bg-[#22c55e] transition-all duration-1000 ease-out"
                  style={{ width: `${(presence?.confidence ?? 0) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-[#22c55e]/60 tracking-wider">
                {Math.round((presence?.confidence ?? 0) * 100)}% CONFIDENCE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 h-2 w-2 border-t border-l border-signal/40" />
      <div className="absolute top-0 right-0 h-2 w-2 border-t border-r border-signal/40" />
      <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-signal/40" />
      <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-signal/40" />
    </div>
  )
}

export default PresencePanel

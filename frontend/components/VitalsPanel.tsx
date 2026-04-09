'use client'

import React from 'react'
import type { StreamState } from '../hooks/useSensingStream'

const VitalsPanel: React.FC<{ state: StreamState }> = ({ state }) => {
  const { frame, connected } = state
  const vitals = frame?.vitals

  const isCollecting = !vitals || (vitals.breathing_bpm === null && vitals.heart_rate_bpm === null)

  return (
    <div className="relative flex h-full min-h-[220px] w-full items-center justify-around border-signal/15 bg-panel p-8 text-white">
      {isCollecting ? (
        <div className="animate-pulse text-signal-dim font-mono text-xl uppercase tracking-widest">
          {connected ? 'Collecting data...' : 'Waiting for connection...'}
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 divide-x divide-signal/10">
          {/* Breathing */}
          <div className="flex flex-col items-center px-6">
            <span className="mb-2 font-mono text-xs uppercase tracking-widest text-[#7a818e]">
              Breathing
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-7xl font-bold text-signal">
                {vitals?.breathing_bpm?.toFixed(1) ?? '—'}
              </span>
              <span className="font-mono text-sm text-[#5a616e]">BPM</span>
            </div>
            
            <div className="mt-6 w-full max-w-[140px] flex flex-col gap-1.5">
              <div className="h-[4px] w-full bg-base overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    vitals?.breathing_confidence && vitals.breathing_confidence < 0.6 
                      ? 'bg-alert' 
                      : 'bg-signal'
                  }`}
                  style={{ width: `${(vitals?.breathing_confidence ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-[10px] uppercase font-mono text-[#5a616e] text-right">
                CONF: {Math.round((vitals?.breathing_confidence ?? 0) * 100)}%
              </span>
            </div>
          </div>

          {/* Heart Rate */}
          <div className="flex flex-col items-center px-6">
            <span className="mb-2 font-mono text-xs uppercase tracking-widest text-[#7a818e]">
              Heart Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-7xl font-bold text-signal">
                {vitals?.heart_rate_bpm?.toFixed(1) ?? '—'}
              </span>
              <span className="font-mono text-sm text-[#5a616e]">BPM</span>
            </div>

            <div className="mt-6 w-full max-w-[140px] flex flex-col gap-1.5">
              <div className="h-[4px] w-full bg-base overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    vitals?.hr_confidence && vitals.hr_confidence < 0.6 
                      ? 'bg-alert' 
                      : 'bg-signal'
                  }`}
                  style={{ width: `${(vitals?.hr_confidence ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-[10px] uppercase font-mono text-[#5a616e] text-right">
                CONF: {Math.round((vitals?.hr_confidence ?? 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 h-2 w-2 border-t border-l border-signal/40" />
      <div className="absolute top-0 right-0 h-2 w-2 border-t border-r border-signal/40" />
      <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-signal/40" />
      <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-signal/40" />
    </div>
  )
}

export default VitalsPanel

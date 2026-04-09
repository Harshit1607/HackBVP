'use client'

import React from 'react'
import { useSensingStream } from '../hooks/useSensingStream'

const StatusBar: React.FC = () => {
  const { connected, source, fps } = useSensingStream()

  return (
    <div className="flex h-10 w-full items-center justify-between px-6 bg-base border-b border-signal/20 select-none z-50">
      <div className="flex items-center gap-3">
        <div className="relative h-2 w-2">
          <div 
            className={`h-full w-full rounded-full transition-colors duration-500 ${
              connected ? 'bg-signal' : 'bg-alert'
            }`} 
          />
          {connected && (
            <div className="absolute inset-0 bg-signal rounded-full animate-ping opacity-60" />
          )}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[#7a818e] font-sans">
          STATUS: <span className={connected ? 'text-signal' : 'text-alert'}>{connected ? 'LINK—ESTABLISHED' : 'LINK—DROPPED'}</span>
        </span>
      </div>

      <div className="text-[10px] uppercase tracking-[0.3em] font-sans text-signal/80 font-bold">
        {source}
      </div>

      <div className="text-[10px] font-mono text-[#7a818e] w-24 text-right">
        {connected ? `${fps.toFixed(1)} FPS` : '— FPS'}
      </div>
    </div>
  )
}

export default StatusBar

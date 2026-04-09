'use client'

import React from 'react'
import { useSensingStream } from '../hooks/useSensingStream'
import VitalsPanel from '../components/VitalsPanel'
import PresencePanel from '../components/PresencePanel'
import AmplitudeChart from '../components/AmplitudeChart'
import PoseCanvas from '../components/PoseCanvas'

export default function Dashboard() {
  const state = useSensingStream()
  const { frame } = state

  return (
    <div className="flex flex-col h-full bg-base p-4">
      <div className="flex flex-col gap-px bg-signal/10 border border-signal/15 h-full overflow-y-auto">
        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-signal/10">
          <div className="bg-base h-full">
            <VitalsPanel state={state} />
          </div>
          <div className="bg-base h-full">
            <PresencePanel state={state} />
          </div>
        </div>

        {/* Second row (Amplitude Chart) */}
        <div className="bg-base p-0 w-full min-h-[120px]">
          <AmplitudeChart frame={frame} />
        </div>

        {/* Third row (Pose Estimation) */}
        <div className="bg-base p-0 w-full min-h-[120px]">
          <PoseCanvas />
        </div>

        {/* Footer/Meta row */}
        <div className="flex-1 bg-base min-h-[40px] flex items-center px-4 justify-between font-mono text-[9px] uppercase tracking-widest text-[#5a616e]">
          <div className="flex items-center gap-4">
            <span className="text-signal/30">ID: {frame?.frame_id ?? '---'}</span>
            <span className="text-signal/30">TS: {frame?.timestamp.toFixed(6) ?? '0.000000'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>SENSING ENGINE ACTIVE</span>
            <div className="h-1 w-1 rounded-full bg-signal/40 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

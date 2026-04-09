'use client'

import React from 'react'
import type { SensingFrame } from '@/lib/types'

interface VitalsPanelProps {
  frame: SensingFrame | null
  connected: boolean
}

export default function VitalsPanel({ frame, connected }: VitalsPanelProps) {
  const breathingValue = frame?.vitals?.breathing_bpm
  const heartRateValue = frame?.vitals?.heart_rate_bpm
  
  const MetricRow = ({ label, value, unit }: { label: string, value: number | null | undefined, unit: string }) => (
    <div className="border-t border-accent-metal/20 py-20 px-4 lg:px-0 first:border-t-0">
      <div className="flex items-baseline justify-between">
        <span className="text-caption-30 uppercase tracking-widest text-accent-metal font-sans" style={{ fontWeight: 300 }}>
          {label}
        </span>
        <div className="flex items-baseline gap-8">
          <span className="font-serif text-title-20 text-base-black tabular-nums leading-none" style={{ fontWeight: 400 }}>
            {value ? value.toFixed(1) : '—'}
          </span>
          <span className="text-caption-30 text-accent-metal font-sans">{unit}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col">
      <MetricRow label="Breathing Rate" value={breathingValue} unit="bpm" />
      <MetricRow label="Heart Rate" value={heartRateValue} unit="bpm" />
      <div className="border-b border-accent-metal/20" />
    </div>
  )
}

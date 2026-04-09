'use client'

import React from 'react'
import type { SensingFrame } from '@/lib/types'

interface PresencePanelProps {
  frame: SensingFrame | null
  connected: boolean
}

export default function PresencePanel({ frame, connected }: PresencePanelProps) {
  const occupied = frame?.presence?.occupied ?? false
  const personCount = frame?.presence?.person_count ?? 0
  const confidence = frame?.presence?.confidence ?? 0

  return (
    <div className="flex flex-col">
      {/* Presence status as oversized tag chip row */}
      <div className="border-t border-accent-metal/20 py-12 px-4 lg:px-0">
        <div className="flex items-center justify-between">
          <span className="text-caption-30 uppercase text-base-brown font-sans">Status</span>
          <span className={`inline-flex h-26 items-center gap-8 px-8 text-caption-30 font-medium uppercase
            ${occupied
              ? 'bg-accent-wood/20 text-accent-wood'
              : 'bg-base-stone-20 text-base-stone-100'
            }`}>
            <span className={`block size-5 ${occupied ? 'bg-accent-wood' : 'bg-base-stone-100'}`} />
            {occupied ? 'Occupied' : 'Empty'}
          </span>
        </div>
      </div>

      {/* Person count row */}
      <div className="border-t border-accent-metal/20 py-12 px-4 lg:px-0">
        <div className="flex items-center justify-between">
          <span className="text-caption-30 uppercase text-base-brown font-sans">Count</span>
          <span className="font-serif text-title-10 text-base-black">
            {personCount} <span className="text-caption-30 text-accent-metal font-sans">
              {personCount === 1 ? 'person' : 'persons'}
            </span>
          </span>
        </div>
      </div>

      {/* Confidence row */}
      <div className="border-t border-b border-accent-metal/20 py-12 px-4 lg:px-0">
        <div className="flex items-center justify-between">
          <span className="text-caption-30 uppercase text-base-brown font-sans">Confidence</span>
          <span className="font-serif text-title-10 text-base-black tabular-nums">
            {Math.round(confidence * 100)}
            <span className="text-caption-30 text-accent-metal font-sans">%</span>
          </span>
        </div>
        <div className="mt-6 h-[0.2rem] w-full bg-base-stone-20">
          <div
            className="h-full bg-accent-earth transition-all duration-700"
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

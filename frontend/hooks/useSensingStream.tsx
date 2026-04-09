'use client'

import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import type { SensingFrame } from '../lib/types'
import { MOCK_FRAME } from '../lib/mockData'

export interface StreamState {
  frame: SensingFrame | null
  connected: boolean
  fps: number
  source: string
  connectionStatus: 'connected' | 'reconnecting' | 'idle'
  sourceType: 'mock' | 'socket' | 'replay'
  setSourceType: (type: 'mock' | 'socket' | 'replay') => void
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/sensing'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

const SensingContext = createContext<StreamState | undefined>(undefined)

export function SensingProvider({ children }: { children: React.ReactNode }) {
  const [sourceType, setSourceType] = useState<'mock' | 'socket' | 'replay'>(USE_MOCK ? 'mock' : 'socket')
  const [state, setState] = useState<Omit<StreamState, 'sourceType' | 'setSourceType'>>({
    frame: null,
    connected: false,
    fps: 0,
    source: 'none',
    connectionStatus: 'idle',
  })

  // FPS calculation buffer
  const frameTimestamps = useRef<number[]>([])

  useEffect(() => {
    setState((prev: Omit<StreamState, 'sourceType' | 'setSourceType'>) => ({ ...prev, frame: null, connected: false, fps: 0, connectionStatus: 'idle' }))
    frameTimestamps.current = []

    if (sourceType === 'mock') {
      console.log('RuView: Using mock data stream')
      const interval = setInterval(() => {
        const now = Date.now()
        const t = now / 1000
        const amplitude = 0.5 + Math.sin(t * 1.2) * 0.15 + Math.random() * 0.04
        const breathing = 15.2 + Math.sin(t * 0.15) * 2.1 + (Math.random() - 0.5) * 0.4
        const heartRate = 72.0 + Math.sin(t * 0.08) * 3.5 + (Math.random() - 0.5) * 0.8

        const frame: SensingFrame = {
          ...MOCK_FRAME,
          timestamp: now / 1000,
          frame_id: `mock-${now}`,
          amplitude,
          vitals: {
            breathing_bpm: breathing,
            heart_rate_bpm: heartRate,
            breathing_confidence: 0.88 + Math.random() * 0.1,
            hr_confidence: 0.92 + Math.random() * 0.05,
            confidence: 0.9 + Math.random() * 0.1,
          },
          presence: { ...MOCK_FRAME.presence, confidence: 0.94 + Math.random() * 0.04 }
        }
        
        frameTimestamps.current.push(now)
        frameTimestamps.current = frameTimestamps.current.filter((ts: number) => now - ts < 2000)
        const fps = frameTimestamps.current.length / 2

        setState({
          frame,
          connected: true,
          fps,
          source: 'Simulated Stream',
          connectionStatus: 'connected',
        })
      }, 200)
      return () => clearInterval(interval)
    }

    if (sourceType === 'socket') {
      let socket: WebSocket | null = null
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null

      const connect = () => {
        console.log('RuView: Connecting to sensing stream...')
        socket = new WebSocket(WS_URL)

        socket.onopen = () => {
          setState((prev: Omit<StreamState, 'sourceType' | 'setSourceType'>) => ({ ...prev, connected: true, connectionStatus: 'connected', source: 'Live WebSocket' }))
          if (reconnectTimer) clearTimeout(reconnectTimer)
        }

        socket.onmessage = (event) => {
          try {
            const frame: SensingFrame = JSON.parse(event.data)
            const now = Date.now()
            frameTimestamps.current.push(now)
            frameTimestamps.current = frameTimestamps.current.filter((t: number) => now - t < 2000)
            const fps = frameTimestamps.current.length / 2

            setState({
              frame,
              connected: true,
              fps,
              source: frame.source === 'simulator' ? 'Remote Simulator' : 'Live Hardware',
              connectionStatus: 'connected',
            })
          } catch (err) { console.error('Failed to parse frame', err) }
        }

        socket.onclose = () => {
          setState((prev: Omit<StreamState, 'sourceType' | 'setSourceType'>) => ({ ...prev, connected: false, fps: 0, source: 'Offline', connectionStatus: 'reconnecting' }))
          reconnectTimer = setTimeout(connect, 2000)
        }

        socket.onerror = () => { socket?.close() }
      }

      connect()
      return () => {
        if (socket) { socket.onclose = null; socket.close() }
        if (reconnectTimer) clearTimeout(reconnectTimer)
      }
    }

    if (sourceType === 'replay') {
      setState((prev: Omit<StreamState, 'sourceType' | 'setSourceType'>) => ({ ...prev, connected: true, source: 'Replay Buffer', connectionStatus: 'idle' }))
    }
  }, [sourceType])

  return (
    <SensingContext.Provider value={{ ...state, sourceType, setSourceType }}>
      {children}
    </SensingContext.Provider>
  )
}

export function useSensingStream(): StreamState {
  const context = useContext(SensingContext)
  if (context === undefined) {
    throw new Error('useSensingStream must be used within a SensingProvider')
  }
  return context
}

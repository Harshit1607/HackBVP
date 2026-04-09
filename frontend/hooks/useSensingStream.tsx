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
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/sensing'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

const SensingContext = createContext<StreamState | undefined>(undefined)

export function SensingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StreamState>({
    frame: null,
    connected: false,
    fps: 0,
    source: 'none',
    connectionStatus: 'idle',
  })

  // FPS calculation buffer
  const frameTimestamps = useRef<number[]>([])

  useEffect(() => {
    if (USE_MOCK) {
      console.log('RuView: Using mock data stream')
      const interval = setInterval(() => {
        const now = Date.now()
        const amplitude = 0.5 + Math.sin(now * 0.005) * 0.2 + Math.random() * 0.05

        const frame: SensingFrame = {
          ...MOCK_FRAME,
          timestamp: now / 1000,
          frame_id: `mock-${now}`,
          amplitude: amplitude,
        }
        
        frameTimestamps.current.push(now)
        frameTimestamps.current = frameTimestamps.current.filter(t => now - t < 2000)
        const fps = frameTimestamps.current.length / 2

        setState({
          frame,
          connected: true,
          fps,
          source: 'Live — simulator',
          connectionStatus: 'connected',
        })
      }, 50) // 20Hz

      return () => clearInterval(interval)
    }

    let socket: WebSocket | null = null
    let reconnectTimer: NodeJS.Timeout | null = null

    const connect = () => {
      console.log('RuView: Connecting to sensing stream...')
      socket = new WebSocket(WS_URL)

      socket.onopen = () => {
        console.log('RuView: Connected')
        setState(prev => ({ ...prev, connected: true, connectionStatus: 'connected' }))
        if (reconnectTimer) clearTimeout(reconnectTimer)
      }

      socket.onmessage = (event) => {
        try {
          const frame: SensingFrame = JSON.parse(event.data)
          const now = Date.now()
          
          // FPS Calculation
          frameTimestamps.current.push(now)
          frameTimestamps.current = frameTimestamps.current.filter(t => now - t < 2000)
          const fps = frameTimestamps.current.length / 2

          let displaySource = 'Live'
          if (frame.source === 'simulator') displaySource = 'Live — simulator'
          else if (frame.source === 'replay') displaySource = 'Replay'
          else if (frame.source === 'esp32') displaySource = 'Live — ESP32'

          setState({
            frame,
            connected: true,
            fps,
            source: displaySource,
            connectionStatus: 'connected',
          })
        } catch (err) {
          console.error('Failed to parse frame', err)
        }
      }

      socket.onclose = () => {
        console.log('RuView: Disconnected')
        setState(prev => ({ ...prev, connected: false, fps: 0, source: 'Disconnected', connectionStatus: 'reconnecting' }))
        reconnectTimer = setTimeout(connect, 2000)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      if (socket) {
        socket.onclose = null
        socket.close()
      }
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [])

  return (
    <SensingContext.Provider value={state}>
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

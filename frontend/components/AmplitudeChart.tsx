'use client'

import React, { useEffect, useRef } from 'react'
import type { SensingFrame } from '../lib/types'

interface AmplitudeChartProps {
  frame: SensingFrame | null
}

const AmplitudeChart: React.FC<AmplitudeChartProps> = ({ frame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bufferRef = useRef<number[][]>([])
  const requestRef = useRef<number>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Buffer management
  useEffect(() => {
    if (frame?.raw_amplitude) {
      bufferRef.current.push(frame.raw_amplitude)
      if (bufferRef.current.length > 200) {
        bufferRef.current.shift()
      }
      
      // Schedule draw
      if (!requestRef.current) {
        requestRef.current = requestAnimationFrame(draw)
      }
    }
  }, [frame])

  const draw = () => {
    requestRef.current = undefined
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const buffer = bufferRef.current
    if (buffer.length === 0) return

    // Flatten or use latest? "Rolling canvas waveform" usually implies a history. 
    // Here we'll draw the latest frame's raw_amplitude spread across the width.
    const data = buffer[buffer.length - 1]
    if (!data) return

    // Find min/max for normalization
    let min = Math.min(...data)
    let max = Math.max(...data)
    const range = max - min || 1

    ctx.beginPath()
    ctx.strokeStyle = '#00d4aa'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'

    const step = width / (data.length - 1)
    
    data.forEach((val, i) => {
      const x = i * step
      const y = height - ((val - min) / range) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })

    ctx.stroke()
    
    // Add subtle glow
    ctx.shadowBlur = 4
    ctx.shadowColor = '#00d4aa'
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  // Handle resizing
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (canvasRef.current) {
          canvasRef.current.width = entry.contentRect.width
          canvasRef.current.height = entry.contentRect.height
          draw()
        }
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative h-[120px] w-full border border-signal/15 bg-panel/50 overflow-hidden">
      <div className="absolute top-2 left-3 z-10 font-mono text-[9px] uppercase tracking-widest text-signal/40">
        Raw Signal Amplitude
      </div>
      <canvas ref={canvasRef} className="h-full w-full" />
      
      {/* Grid lines background */}
      <div className="absolute inset-0 pointer-events-none opacity-5" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0,212,170,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} 
      />
    </div>
  )
}

export default AmplitudeChart

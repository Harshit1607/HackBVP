'use client'

import React, { useEffect, useRef } from 'react'
import type { SensingFrame } from '@/lib/types'

interface AmplitudeChartProps {
  frame: SensingFrame | null
}

export default function AmplitudeChart({ frame }: AmplitudeChartProps) {
  const amplitude = frame?.amplitude ?? null
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const dataPoints = useRef<number[]>(new Array(150).fill(0))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      // Background and grid lines
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(30, 32, 36, 0.5)'
      ctx.lineWidth = 1
      for (let i = 1; i < 4; i++) {
        const y = (h / 4) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Buffer management: only push if amplitude is not null
      if (amplitude !== null) {
        dataPoints.current.push(amplitude)
      } else {
        dataPoints.current.push(0)
      }
      if (dataPoints.current.length > 150) dataPoints.current.shift()

      // Waveform Draw
      ctx.beginPath()
      ctx.strokeStyle = 'rgb(0 242 255)' // Neon Cyan
      ctx.lineWidth = 2
      const step = w / (dataPoints.current.length - 1)
      
      dataPoints.current.forEach((p, idx) => {
        const x = idx * step
        const normalized = (p + 1) / 2
        const y = h - (normalized * h)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Tech Gradient Fill
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, 'rgba(0, 242, 255, 0.1)')
      grad.addColorStop(1, 'rgba(0, 242, 255, 0)')
      ctx.fillStyle = grad
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.fill()

      if (amplitude === null) {
        ctx.font = '1.2rem "Instrument Serif", serif'
        ctx.fillStyle = 'rgb(148 163 184)' // Sub-slate
        ctx.textAlign = 'center'
        ctx.fillText('Awaiting signal...', w / 2, h / 2)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current!)
  }, [amplitude])

  return (
    <div className="relative h-[12rem] w-full border-t border-accent-metal/20 mt-32">
       <span className="absolute -top-16 left-0 text-caption-30 text-accent-metal">AMPLITUDE SIGNAL — CHANNEL A</span>
      <canvas ref={canvasRef} className="size-full" />
    </div>
  )
}

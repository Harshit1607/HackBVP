'use client'

import { useEffect, useRef, useState, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

const OPTIONS = [
  { id: 'mock',   label: 'Simulated Stream',   desc: 'Synthetic bipedal vitals',  colorClass: 'text-accent-earth', dotClass: 'bg-accent-earth' },
  { id: 'socket', label: 'Hardware (WS:8001)', desc: 'Live ESP32-S3 throughput', colorClass: 'text-accent-water', dotClass: 'bg-accent-water' },
  { id: 'replay', label: 'Replay Buffer',       desc: 'Cached packet analysis',   colorClass: 'text-accent-fire',  dotClass: 'bg-accent-fire'   },
]

interface Props {
  open: boolean
  /** The sidebar container — used for width + top calculation */
  anchorRef: RefObject<HTMLDivElement | null>
  sourceType: string
  onSelect: (id: string) => void
  onClose: () => void
}

export default function SourceDropdown({ open, anchorRef, sourceType, onSelect, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pos, setPos] = useState({ top: 0, width: 0 })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    const zoneBtn = anchorRef.current.querySelector('button[data-source-trigger]')
    let top = r.top + 60
    if (zoneBtn) {
      const btnR = zoneBtn.getBoundingClientRect()
      top = btnR.bottom
    }
    setPos({ top, width: r.right }) 
  }, [open, anchorRef])

  if (!mounted) return null

  return createPortal(
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9990]"
          onClick={onClose}
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="src-dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 z-[9999] bg-[#080809]/95 backdrop-blur-xl border-b border-r border-accent-metal/20 shadow-2xl overflow-hidden"
            style={{
              top: pos.top,
              width: pos.width,
            }}
          >
            {OPTIONS.map((opt) => {
              const isActive = sourceType === opt.id
              const isHovered = hoveredId === opt.id
              const showColor = isActive || isHovered

              return (
                <button
                  key={opt.id}
                  onMouseEnter={() => setHoveredId(opt.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={(e) => { e.stopPropagation(); onSelect(opt.id); onClose() }}
                  className="flex flex-col w-full px-16 py-14 text-left transition-all duration-300 border-b border-accent-metal/10 last:border-b-0 relative group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-earth scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <span
                      className={`text-caption-30 uppercase tracking-[0.25em] font-medium transition-colors duration-500
                        ${showColor ? opt.colorClass : 'text-accent-metal/40'}
                      `}
                    >
                      {opt.label}
                    </span>
                    {isActive && (
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${opt.dotClass} shadow-[0_0_8px_currentColor]`} />
                    )}
                  </div>
                  <span
                    className={`text-[0.6rem] font-mono mt-4 uppercase tracking-[0.1em] transition-colors duration-500
                      ${showColor ? opt.colorClass : 'text-accent-metal/20'}
                    `}
                  >
                    {opt.desc}
                  </span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}

'use client'

import { useEffect, useRef, useState, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

const OPTIONS = [
  { id: 'mock',   label: 'Simulated Stream',   desc: 'Synthetic bipedal vitals',  colorClass: 'text-accent-earth', dotClass: 'bg-accent-earth' },
  { id: 'socket', label: 'Hardware (WS:8000)', desc: 'Live ESP32-S3 throughput', colorClass: 'text-accent-water', dotClass: 'bg-accent-water' },
  { id: 'replay', label: 'Replay Buffer',       desc: 'Cached packet analysis',   colorClass: 'text-accent-wood',  dotClass: 'bg-accent-wood'  },
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

  // Recompute position every time the menu opens
  useEffect(() => {
    if (!open || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    // We want the dropdown to sit just below Zone 2 (the trigger button row).
    // Zone 2 is roughly at top ~200px from the sidebar top, but easier: just use the
    // sidebar bottom minus available height, OR use a data attribute on Zone 2.
    // Simplest: scan for the button border-b in the sidebar children.
    // Actually: pass the btn row's bottom from its own ref via a data attr on the sidebar.
    // EASIEST fallback: sidebar top + ~17% of sidebar height covers the Zone2 border-b.

    // Get Zone 2 element: it has border-b right below its button child
    // We tagged the sidebar on the parent; let's find the button inside it
    const zoneBtn = anchorRef.current.querySelector('button[data-source-trigger]')
    let top = r.top + 60 // fallback: ~top of sidebar + the zone 2 row
    if (zoneBtn) {
      const btnR = zoneBtn.getBoundingClientRect()
      top = btnR.bottom
    }

    setPos({ top, width: r.right }) // left is always 0 (left edge of window)
  }, [open, anchorRef])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Full-screen click-away */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9990 }}
          onClick={onClose}
        />
      )}

      {/* Dropdown rendered directly in body — fully escapes parent opacity/transform */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="src-dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              top:  pos.top,
              left: 0,
              width: pos.width,
              zIndex: 9999,
              // Use the exact CSS var — inline style is never affected by parent opacity
              backgroundColor: 'var(--color-bg-primary)',
              borderBottom: '1px solid rgba(148,163,184,0.15)',
              borderRight:  '1px solid rgba(148,163,184,0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
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
                  className="flex flex-col w-full px-12 py-10 text-left transition-colors duration-200 border-b border-accent-metal/10 last:border-b-0 relative"
                  style={{ backgroundColor: 'var(--color-bg-primary)' }}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span
                      className={`text-caption-30 uppercase tracking-[0.25em] font-bold transition-colors duration-500
                        ${showColor ? opt.colorClass : 'text-accent-metal/40'}
                      `}
                    >
                      {opt.label}
                    </span>
                    {isActive && (
                      <span className={`w-2 h-2 rounded-full inline-block ${opt.dotClass} shadow-[0_0_8px_currentColor]`} />
                    )}
                  </div>
                  <span
                    className={`text-[0.6rem] font-mono mt-2 uppercase tracking-[0.1em] italic transition-colors duration-500
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

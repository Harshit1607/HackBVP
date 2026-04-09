import React from 'react'

export interface ColDividersProps {
  opacity?: number
}

export const ColDividers: React.FC<ColDividersProps> = ({ opacity = 1 }) => {
  return (
    <div className="pointer-events-none absolute inset-0 translate-x-[0.15rem]" style={{ opacity }}>
      <div className="hidden size-full grid-cols-4 lg:grid">
        <div className="relative h-full origin-top after:absolute after:inset-y-0 after:right-0 after:translate-x-full after:bg-accent-metal/20 after:w-[0.1rem]" style={{ transform: 'scaleY(1)' }}></div>
        <div className="relative h-full origin-top after:absolute after:inset-y-0 after:right-0 after:translate-x-full after:bg-accent-metal/20 after:w-[0.1rem]" style={{ transform: 'scaleY(1)' }}></div>
        <div className="relative h-full origin-top after:absolute after:inset-y-0 after:right-0 after:translate-x-full after:bg-accent-metal/20 after:w-[0.1rem]" style={{ transform: 'scaleY(1)' }}></div>
        <div></div>
      </div>
      <div className="grid size-full grid-cols-2 lg:hidden">
        <div className="relative h-full origin-top after:absolute after:inset-y-0 after:right-0 after:translate-x-full after:bg-accent-metal/20 after:w-[0.1rem]" style={{ transform: 'scaleY(1)' }}></div>
        <div></div>
      </div>
    </div>
  )
}

import React from 'react'

export function SectionGrid({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 translate-x-[0.15rem] ${className ?? ''}`}>
      {children}
    </div>
  )
}

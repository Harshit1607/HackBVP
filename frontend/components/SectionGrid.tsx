import React from 'react'

export function SectionGrid({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 w-full divide-x divide-accent-metal/20 ${className ?? ''}`}>
      {children}
    </div>
  )
}

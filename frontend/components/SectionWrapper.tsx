import React from 'react'
import { ColDividers } from './ColDividers'

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  id?: string
  topSpacing?: 'sm' | 'md' | 'lg'
}

export function SectionWrapper({ children, className, id, topSpacing = 'md' }: SectionWrapperProps) {
  const ptClass = {
    sm: 'pt-48 lg:pt-96',
    md: 'pt-96 lg:pt-240',
    lg: 'pt-96 lg:pt-240 pb-96 lg:pb-240',
  }[topSpacing]

  return (
    <div className={`overflow-x-clip ${className ?? ''}`} id={id}>
      <div className={`relative isolate size-full border-x lg:border-x-0 border-accent-metal/20 divide-accent-metal/20 ${ptClass}`}>
        <ColDividers />
        {children}
      </div>
    </div>
  )
}

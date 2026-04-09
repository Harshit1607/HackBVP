'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ColDividers } from '@/components/ColDividers'

interface ThemeLayoutProps {
  children: React.ReactNode
}

export default function ThemeLayout({ children }: ThemeLayoutProps) {
  const [theme, setTheme] = useState<'obsidian' | 'github' | 'light'>('obsidian')

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'obsidian') return 'github'
      if (prev === 'github') return 'light'
      return 'obsidian'
    })
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <>
      {/* HEADER (32px / 3.2rem) */}
      <header className="sticky top-0 z-4 border-b border-accent-metal/20 bg-base-white hidden lg:block w-full">
        <div className="relative isolate w-full">
          <ColDividers />
          <nav>
            <ul className="grid grid-cols-4 w-full translate-x-[0.15rem]" style={{ height: 'var(--header-height)' }}>
              {/* BRAND / THEME TOGGLE */}
              <li className="border-r border-accent-metal/20 flex items-stretch">
                <button 
                  onClick={cycleTheme}
                  className="nav-link flex items-center w-full relative overflow-hidden group text-left cursor-pointer"
                >
                  <span className="nav-link-overflow block w-full h-[var(--header-height)] overflow-hidden">
                    <span className="nav-link-inner flex flex-col w-full">
                      <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif text-base-black w-full">
                        RuView <span className="ml-4 opacity-40 font-mono text-[0.6rem]">{theme.toUpperCase()}</span>
                      </span>
                      <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif bg-accent-earth text-base-white w-full">
                        {theme === 'obsidian' ? 'Switch to GitHub' : theme === 'github' ? 'Switch to Light' : 'Return Obsidian'}
                      </span>
                    </span>
                  </span>
                </button>
              </li>

              {/* DASHBOARD */}
              <li className="border-r border-accent-metal/20 flex items-stretch">
                <Link href="/" className="nav-link flex items-center w-full relative overflow-hidden group">
                  <span className="nav-link-overflow block w-full h-[var(--header-height)] overflow-hidden">
                    <span className="nav-link-inner flex flex-col w-full">
                      <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif text-base-black w-full">
                        Dashboard
                      </span>
                      <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif bg-accent-earth text-base-white w-full">
                        Dashboard
                      </span>
                    </span>
                  </span>
                </Link>
              </li>

              {/* SENSING */}
              <li className="border-r border-accent-metal/20 flex items-stretch">
                <Link href="#" className="nav-link flex items-center w-full relative overflow-hidden group">
                  <span className="nav-link-overflow block w-full h-[var(--header-height)] overflow-hidden">
                    <span className="nav-link-inner flex flex-col w-full">
                      <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif text-base-black w-full">
                        Sensing
                      </span>
                      <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif bg-accent-water text-base-white w-full">
                        Sensing
                      </span>
                    </span>
                  </span>
                </Link>
              </li>

              {/* REPLAY */}
              <li className="flex items-stretch">
                <Link href="/replay" className="nav-link flex items-center w-full relative overflow-hidden group">
                  <span className="nav-link-overflow block w-full h-[var(--header-height)] overflow-hidden">
                    <span className="nav-link-inner flex flex-col w-full">
                      <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif text-base-black w-full">
                        Replay
                      </span>
                      <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif bg-accent-wood text-base-white w-full">
                        Replay
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="fixed inset-x-0 bottom-0 z-4 block px-8 pb-8 lg:hidden">
        <nav className="grid grid-cols-[1fr,8.8rem] border-x border-t border-accent-metal/20 bg-base-white">
          <Link href="/" className="block h-32 overflow-hidden border-b border-accent-metal/20 px-8 text-caption-30-fixed uppercase leading-[3.2rem]">
            <span className="font-medium">RuView</span> <span className="font-serif">(WiFi)</span>
          </Link>
          <button 
            onClick={cycleTheme}
            className="h-32 border-b border-l border-accent-metal/20 bg-base-white px-8 text-caption-30 uppercase"
          >
            {theme.toUpperCase()}
          </button>
        </nav>
      </header>

      {children}
    </>
  )
}

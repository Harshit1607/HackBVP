import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { SensingProvider } from '@/hooks/useSensingStream'
import { ColDividers } from '@/components/ColDividers'
import SmoothScroll from '@/components/SmoothScroll'
import Link from 'next/link'

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RuView | WiFi Sensing Platform',
  description: 'Precision environmental monitoring through signal analysis.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`bg-base-white text-base-black ${instrumentSans.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased font-sans">
        <SensingProvider>
          {/* HEADER (32px / 3.2rem) — Moved outside SmoothScroll for reliable sticky behavior */}
          <header className="sticky top-0 z-4 border-b border-accent-metal/20 bg-base-white hidden lg:block w-full">
            <div className="relative isolate w-full">
              <ColDividers />
              <nav>
                <ul className="grid grid-cols-4 w-full translate-x-[0.15rem]" style={{ height: 'var(--header-height)' }}>
                  {/* BRAND */}
                  <li className="border-r border-accent-metal/20 flex items-stretch">
                    <Link href="/" className="nav-link flex items-center w-full relative overflow-hidden group">
                      <span className="nav-link-overflow block w-full h-[var(--header-height)] overflow-hidden">
                        <span className="nav-link-inner flex flex-col w-full">
                          <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif text-base-black w-full">
                            RuView <span className="ml-4">(WiFi)</span>
                          </span>
                          <span className="nav-link-text flex items-center px-8 h-[var(--header-height)] text-caption-30-fixed uppercase font-serif bg-accent-earth text-base-white w-full">
                            RuView <span className="ml-4">(WiFi)</span>
                          </span>
                        </span>
                      </span>
                    </Link>
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

          {/* MOBILE HEADER (Bottom fixed) */}
          <header className="fixed inset-x-0 bottom-0 z-4 block px-8 pb-8 lg:hidden">
            <nav className="grid grid-cols-[1fr,8.8rem] border-x border-t border-accent-metal/20 bg-base-white">
              <Link href="/" className="block h-32 overflow-hidden border-b border-accent-metal/20 px-8 text-caption-30-fixed uppercase leading-[3.2rem]">
                <span className="font-medium">RuView</span> <span className="font-serif">(WiFi)</span>
              </Link>
              <button className="h-32 border-b border-l border-accent-metal/20 bg-base-white px-8 text-caption-30 uppercase">
                Menu
              </button>
            </nav>
          </header>

          <SmoothScroll>
            <main className="mx-auto max-w-[1920px]">
              {children}
            </main>
          </SmoothScroll>
        </SensingProvider>
      </body>
    </html>
  )
}

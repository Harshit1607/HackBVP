import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { SensingProvider } from '@/hooks/useSensingStream'
import SmoothScroll from '@/components/SmoothScroll'
import ThemeLayout from '@/components/ThemeLayout'

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
  title: 'RaVis | WiFi Sensing Platform',
  description: 'Precision environmental monitoring through signal analysis.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased font-sans">
        <SensingProvider>
          <ThemeLayout>
            <SmoothScroll>
              <main className="w-full">
                {children}
              </main>
            </SmoothScroll>
          </ThemeLayout>
        </SensingProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SensingProvider } from '../hooks/useSensingStream'
import StatusBar from '../components/StatusBar'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'RuView | Tactical Biometric Observatory',
  description: 'Pro-grade WiFi sensing for mission-critical presence monitoring.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${jetBrainsMono.variable} font-sans bg-base text-white antialiased overflow-x-hidden`}>
        <SensingProvider>
          <div className="flex flex-col h-screen overflow-hidden">
            <StatusBar />
            <main className="flex-1 overflow-auto bg-base">
              {children}
            </main>
          </div>
        </SensingProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { WaterSheetProvider } from '@/contexts/WaterSheetContext'
import RiverDetailSheet from '@/components/RiverDetailSheet'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CastWA — Washington State Fishing Guide',
  description: 'Find where to fish in Washington State. Species search, interactive map, and real-time regulations.',
  keywords: 'Washington fishing, WA fishing regulations, fishing map, WDFW, salmon fishing, trout fishing',
  openGraph: {
    title: 'CastWA — Washington State Fishing Guide',
    description: 'Find where to fish in Washington State',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-[#0c1a2e] text-blue-50 antialiased">
        <WaterSheetProvider>
        <nav className="sticky top-0 z-[1001] border-b border-water-700/30 bg-water-950/80 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl">🎣</span>
                <span className="text-xl font-bold text-white group-hover:text-water-300 transition-colors">
                  CastWA
                </span>
              </Link>
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-water-200 hover:text-white hover:bg-water-800/50 transition-colors"
                >
                  Search
                </Link>
                <Link
                  href="/map"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-water-200 hover:text-white hover:bg-water-800/50 transition-colors"
                >
                  Map
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="pb-14 md:pb-0">
          <main>{children}</main>
          <footer className="mt-16 border-t border-water-700/30 bg-water-950/50">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-water-400">
            <p>
              Regulations data sourced from{' '}
              <a href="https://wdfw.wa.gov" className="text-water-300 hover:text-white underline">
                WDFW
              </a>
              . Always verify current regulations before fishing.
            </p>
            <p className="mt-1">CastWA — Washington State Fishing Guide</p>
          </div>
        </footer>
        </div>

        {/* Bottom nav — mobile only */}
        <nav className="fixed bottom-0 left-0 right-0 z-[1001] flex h-14 items-center justify-around border-t border-water-700/30 bg-water-950/90 backdrop-blur-md md:hidden">
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 px-6 py-2 text-water-300 hover:text-white transition-colors"
          >
            <span className="text-xl">🔍</span>
            <span className="text-xs font-medium">Search</span>
          </Link>
          <Link
            href="/map"
            className="flex flex-col items-center gap-0.5 px-6 py-2 text-water-300 hover:text-white transition-colors"
          >
            <span className="text-xl">🗺️</span>
            <span className="text-xs font-medium">Map</span>
          </Link>
        </nav>

        {/* Universal water detail sheet — rendered once, globally */}
        <RiverDetailSheet />
        </WaterSheetProvider>
      </body>
    </html>
  )
}

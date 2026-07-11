import type { Metadata, Viewport } from "next"
import { Geist, Barlow_Condensed } from "next/font/google"
import "./globals.css"
import Providers from "./providers"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "CastWA — Washington Fishing Guide",
  description: "Your guide to fishing in Washington State — species, regulations, seasons, and more",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32",   type: "image/png" },
      { url: "/icon-192.png",   sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png",   sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
}

export const viewport: Viewport = {
  themeColor: "#08080f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${barlowCondensed.variable} antialiased`}
            style={{ background: "var(--bg)", color: "var(--text)" }}>
        {/* ⚠️ Legal Disclaimer Banner */}
        <div style={{
          background: '#7f1d1d',
          borderBottom: '2px solid #ef4444',
          padding: '5px 16px',
          textAlign: 'center',
          fontSize: '11px',
          lineHeight: '1.4',
          color: '#fecaca',
          fontFamily: 'var(--font-geist-sans)',
          zIndex: 9999,
          position: 'relative',
        }}>
          <strong style={{ color: '#fff' }}>⚠️ Reference only — always verify at</strong>
          {' '}<a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer" 
             style={{ color: '#fbbf24', textDecoration: 'underline' }}>
            WDFW.wa.gov
          </a>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

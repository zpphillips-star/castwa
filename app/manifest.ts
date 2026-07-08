import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CastWA — Washington Fishing Guide',
    short_name: 'CastWA',
    description: 'Species regulations, live river conditions, and an interactive map of WA waters',
    start_url: '/',
    display: 'standalone',
    background_color: '#08080f',
    theme_color: '#08080f',
    orientation: 'portrait',
    icons: [
      { src: '/favicon-32.png',       sizes: '32x32',   type: 'image/png' },
      { src: '/icon-192.png',         sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png',         sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}

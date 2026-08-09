'use client'
import { usePathname, useRouter } from 'next/navigation'

function dispatchReset() {
  window.dispatchEvent(new CustomEvent('castwa-nav-reset'))
}

const leftTabs = [
  {
    href: '/fish',
    label: 'Fish',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" style={{ color: active ? 'var(--accent)' : 'var(--text-muted, #6b7280)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 0-4-6-9-6S3 12 3 12s4 6 9 6 9-6 9-6z"/>
        <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/>
        <path strokeLinecap="round" strokeWidth={2} d="M3 12L1 9M3 12L1 15"/>
      </svg>
    ),
  },
  {
    href: '/conditions',
    label: 'Waters',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" style={{ color: active ? 'var(--accent)' : 'var(--text-muted, #6b7280)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
      </svg>
    ),
  },
]

const rightTabs = [
  {
    href: '/map',
    label: 'Near Me',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" style={{ color: active ? 'var(--accent)' : 'var(--text-muted, #6b7280)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" strokeWidth={2}/>
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" style={{ color: active ? 'var(--accent)' : 'var(--text-muted, #6b7280)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2}/>
        <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2}/>
      </svg>
    ),
  },
]

function NavTab({ href, label, icon }: { href: string; label: string; icon: (a: boolean) => React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <button
      onClick={() => {
        if (active) dispatchReset()
        else router.push(href)
      }}
      className="flex items-center gap-2 px-4 h-full relative transition-all group cursor-pointer rounded-none"
      style={{ color: active ? 'var(--accent)' : 'var(--text-muted, #6b7280)' }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = ''
      }}
    >
      {icon(active)}
      <span className="text-sm font-semibold">{label}</span>
      {/* Active underline indicator */}
      {active && (
        <span
          className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </button>
  )
}

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const todayActive = pathname === '/today' || pathname.startsWith('/today/')

  return (
    <nav
      className="hidden lg:flex items-center fixed top-0 left-0 right-0 z-[1050]"
      style={{
        height: 64,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left tabs */}
      <div className="flex items-stretch h-full">
        {leftTabs.map(t => <NavTab key={t.href} {...t} />)}
      </div>

      {/* Center — Today button, absolutely centered */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
        <button
          onClick={() => {
            if (todayActive) dispatchReset()
            else router.push('/today')
          }}
          className="flex items-center gap-2.5 px-5 py-1.5 rounded-xl transition-all active:scale-95"
          style={{
            background: todayActive ? 'rgba(242,101,34,0.15)' : 'rgba(242,101,34,0.08)',
            border: `1px solid ${todayActive ? 'var(--accent)' : 'rgba(242,101,34,0.3)'}`,
            boxShadow: todayActive ? '0 0 14px rgba(242,101,34,0.35)' : 'none',
            color: todayActive ? 'var(--accent)' : 'var(--text, #e5e5e5)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(242,101,34,0.1)',
              border: `1.5px solid ${todayActive ? 'var(--accent)' : 'rgba(242,101,34,0.35)'}`,
            }}
          >
            {/* Orange WA secondary mark — accent color on dark surface */}
            <svg
              viewBox="270.04 109.56 123.26 85.16"
              aria-label="Washington state mark"
              style={{ width: '70%', height: '70%', display: 'block' }}
            >
              <path fill={todayActive ? 'var(--accent, #f26522)' : '#e5e5e5'} fillRule="evenodd" d="M 270.04 124.96 L 272.61 124.54 L 276.89 127.96 L 281.17 128.39 L 287.16 131.38 L 294.86 131.81 L 297.43 134.38 L 300.00 134.38 L 301.71 137.80 L 301.71 140.80 L 300.43 142.08 L 298.29 142.08 L 297.86 144.65 L 300.86 143.37 L 303.00 143.79 L 303.85 152.35 L 301.28 153.21 L 297.43 149.79 L 297.43 148.07 L 295.72 148.07 L 294.86 151.93 L 297.86 152.78 L 297.00 156.63 L 298.72 156.63 L 299.14 157.92 L 303.00 157.92 L 303.85 154.92 L 306.42 154.49 L 307.28 151.93 L 306.42 142.08 L 308.56 139.09 L 308.56 136.95 L 306.42 134.38 L 306.42 129.24 L 301.28 124.54 L 301.28 122.40 L 303.85 120.68 L 304.28 117.69 L 301.71 117.69 L 298.29 112.55 L 299.57 109.56 L 330.39 112.98 L 387.30 114.27 L 388.16 115.12 L 388.16 141.23 L 390.73 173.32 L 393.30 176.75 L 392.44 181.46 L 393.30 185.73 L 360.34 185.73 L 356.49 187.87 L 351.36 187.87 L 335.95 193.01 L 330.39 192.15 L 326.11 193.87 L 322.68 193.87 L 320.97 192.15 L 311.13 192.15 L 307.28 194.72 L 299.57 193.44 L 297.43 191.73 L 297.86 186.59 L 295.29 181.03 L 292.72 179.32 L 288.02 179.74 L 284.59 175.89 L 278.60 176.32 L 277.75 175.46 L 277.75 173.32 L 280.74 169.90 L 280.74 166.48 L 278.60 166.48 L 277.75 165.19 L 277.32 152.78 L 274.75 148.93 L 274.75 142.51 L 270.47 136.09 Z" />
            </svg>
          </div>
          <span
            className="text-base font-bold tracking-wide"
            style={{ color: todayActive ? 'var(--accent)' : 'var(--text, #e5e5e5)' }}
          >
            Today
          </span>
          <span className="hidden xl:inline text-xs font-medium opacity-50 ml-0.5" style={{ color: todayActive ? 'var(--accent)' : 'var(--text-muted)' }}>
            · WA Fishing Guide
          </span>
          <span className="text-base leading-none">🎣</span>
        </button>
      </div>

      {/* Right tabs — pushed to the right */}
      <div className="ml-auto flex items-stretch h-full">
        {rightTabs.map(t => <NavTab key={t.href} {...t} />)}
      </div>
    </nav>
  )
}

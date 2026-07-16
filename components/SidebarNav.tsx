'use client'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

function dispatchReset() {
  window.dispatchEvent(new CustomEvent('castwa-nav-reset'))
}

// Mirror the same 5 nav items as BottomNav
const NAV_ITEMS = [
  {
    href: '/fish',
    label: 'Fish',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" style={{ color: active ? '#f26522' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <svg className="w-6 h-6" style={{ color: active ? '#f26522' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
      </svg>
    ),
  },
  {
    href: '/map',
    label: 'Near Me',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" style={{ color: active ? '#f26522' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" strokeWidth={2}/>
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" style={{ color: active ? '#f26522' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2}/>
        <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2}/>
      </svg>
    ),
  },
]

export default function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const todayActive = pathname === '/today' || pathname.startsWith('/today/')

  return (
    <nav
      className="hidden lg:flex flex-col items-center fixed left-0 top-0 bottom-0 z-[1050]"
      style={{
        width: 72,
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Today logo button — center button like BottomNav */}
      <button
        onClick={() => {
          if (todayActive) dispatchReset()
          else router.push('/today')
        }}
        className="flex flex-col items-center gap-1.5 w-full py-5 transition-colors"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden transition-transform active:scale-95"
          style={{
            background: '#f26522',
            boxShadow: todayActive
              ? '0 0 18px rgba(242,101,34,0.6), 0 2px 12px rgba(0,0,0,0.4)'
              : '0 2px 10px rgba(0,0,0,0.3)',
            outline: todayActive ? '2px solid #f26522' : 'none',
            outlineOffset: '3px',
          }}
        >
          <Image
            src="/castwa-icon-white.png"
            width={64}
            height={64}
            alt="Today"
            style={{ width: '80%', height: '80%', objectFit: 'contain' }}
          />
        </div>
        <span className="text-[9px] font-bold" style={{ color: todayActive ? '#f26522' : '#6b7280' }}>
          Today
        </span>
      </button>

      {/* Regular nav items */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <button
              key={item.href}
              onClick={() => {
                if (active) dispatchReset()
                else router.push(item.href)
              }}
              className="flex flex-col items-center justify-center gap-1 w-full py-3.5 transition-colors relative"
              style={{
                background: active ? 'rgba(242,101,34,0.1)' : 'transparent',
              }}
            >
              {/* Active indicator bar */}
              {active && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
                  style={{ background: '#f26522' }}
                />
              )}
              {item.icon(active)}
              <span className="text-[9px] font-bold" style={{ color: active ? '#f26522' : '#6b7280' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

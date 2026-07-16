'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

// Order: Fish | Waters | [Today] | Map | Calendar
const leftTabs = [
  {
    href: '/fish',
    label: 'Fish',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors`} style={{ color: active ? '#f26522' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0 0-4-6-9-6S3 12 3 12s4 6 9 6 9-6 9-6z"/>
        <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/>
        <path strokeLinecap="round" strokeWidth={2} d="M3 12L1 9M3 12L1 15"/>
      </svg>
    )
  },
  {
    href: '/conditions',
    label: 'Waters',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors`} style={{ color: active ? '#f26522' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
      </svg>
    )
  },
]

const rightTabs = [
  {
    href: '/map',
    label: 'Near Me',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors`} style={{ color: active ? '#f26522' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" strokeWidth={2}/>
      </svg>
    )
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 transition-colors`} style={{ color: active ? '#f26522' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2}/>
        <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2}/>
      </svg>
    )
  },
]

function dispatchReset() {
  window.dispatchEvent(new CustomEvent('castwa-nav-reset'))
}

const NavTab = ({ href, label, icon }: { href: string; label: string; icon: (a: boolean) => React.ReactNode }) => {
  const pathname = usePathname()
  const router = useRouter()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <button
      onClick={() => {
        if (active) {
          dispatchReset()
        } else {
          router.push(href)
        }
      }}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 h-full"
    >
      {icon(active)}
      <span className="text-[10px] font-semibold" style={{ color: active ? '#f26522' : '#6b7280' }}>
        {label}
      </span>
    </button>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const todayActive = pathname === '/today' || pathname.startsWith('/today/')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[1100] lg:hidden"
      style={{
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-end h-16 max-w-lg mx-auto">
        {/* Left tabs */}
        {leftTabs.map(t => <NavTab key={t.href} {...t} />)}

        {/* Center Today button — raised, prominent */}
        <div className="flex-1 flex flex-col items-center justify-end pb-2 relative">
          <button
            onClick={() => {
              if (todayActive) {
                dispatchReset()
              } else {
                router.push('/today')
              }
            }}
            className="flex flex-col items-center gap-1 -mt-6 transition-transform active:scale-[0.97]"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform active:scale-95 overflow-hidden"
              style={{
                background: '#f26522',
                boxShadow: todayActive
                  ? '0 0 28px rgba(242,101,34,0.7), 0 4px 20px rgba(0,0,0,0.6)'
                  : '0 4px 20px rgba(0,0,0,0.5)',
                outline: todayActive ? '2px solid #f26522' : 'none',
                outlineOffset: '3px',
              }}
            >
              <Image
                src="/castwa-icon-white.png"
                width={128}
                height={128}
                alt="Today"
                style={{ objectFit: 'contain', width: '80%', height: '80%' }}
              />
            </div>
            <span className="text-[10px] font-semibold transition-colors" style={{ color: todayActive ? '#f26522' : '#6b7280' }}>
              Today
            </span>
          </button>
        </div>

        {/* Right tabs */}
        {rightTabs.map(t => <NavTab key={t.href} {...t} />)}
      </div>
    </nav>
  )
}

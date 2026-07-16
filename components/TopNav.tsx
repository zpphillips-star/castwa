'use client'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

function dispatchReset() {
  window.dispatchEvent(new CustomEvent('castwa-nav-reset'))
}

const leftTabs = [
  {
    href: '/fish',
    label: 'Fish',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" style={{ color: active ? '#f26522' : 'var(--text-muted, #6b7280)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <svg className="w-5 h-5" style={{ color: active ? '#f26522' : 'var(--text-muted, #6b7280)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <svg className="w-5 h-5" style={{ color: active ? '#f26522' : 'var(--text-muted, #6b7280)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" strokeWidth={2}/>
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" style={{ color: active ? '#f26522' : 'var(--text-muted, #6b7280)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      className="flex items-center gap-2 px-4 h-full relative transition-colors group"
      style={{ color: active ? '#f26522' : 'var(--text-muted, #6b7280)' }}
    >
      {icon(active)}
      <span className="text-sm font-semibold">{label}</span>
      {/* Active underline indicator */}
      {active && (
        <span
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t"
          style={{ background: '#f26522' }}
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
        height: 56,
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
            border: `1px solid ${todayActive ? '#f26522' : 'rgba(242,101,34,0.3)'}`,
            boxShadow: todayActive ? '0 0 14px rgba(242,101,34,0.35)' : 'none',
            color: todayActive ? '#f26522' : 'var(--text, #e5e5e5)',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: '#f26522' }}
          >
            <Image
              src="/castwa-icon-white.png"
              width={48}
              height={48}
              alt="CastWA"
              style={{ width: '80%', height: '80%', objectFit: 'contain' }}
            />
          </div>
          <span
            className="text-sm font-bold tracking-wide"
            style={{ color: todayActive ? '#f26522' : 'var(--text, #e5e5e5)' }}
          >
            Today
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

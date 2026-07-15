'use client'
import { useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { getOpenSpeciesForDate, REGULATIONS, WATER_BODIES, isOpenOn, Species } from '@/lib/fishing-data'
import FishDetailSheet from '@/components/FishDetailSheet'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function MonthBlock({
  year, month, selectedDate, onSelectDate, now
}: {
  year: number, month: number,
  selectedDate: Date | null,
  onSelectDate: (d: Date) => void,
  now: Date
}) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div className="mb-8">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4 sticky top-14 py-2 z-10"
        style={{ background: 'var(--bg)' }}>
        <h2 className="text-base font-black text-white tracking-tight">{monthName}</h2>
        {isCurrentMonth && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: 'rgba(242,101,34,0.15)', color: '#f26522', border: '1px solid rgba(242,101,34,0.3)' }}>
            This Month
          </span>
        )}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wide py-1"
            style={{ color: 'var(--text-faint)' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(year, month, day)
          const openCount = getOpenSpeciesForDate(date).length
          const isToday = date.toDateString() === now.toDateString()
          const isSelected = selectedDate?.toDateString() === date.toDateString()
          const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const hasOpen = openCount > 0 && !isPast

          return (
            <button
              key={day}
              onClick={() => onSelectDate(date)}
              disabled={isPast}
              className="relative flex flex-col items-center justify-center transition-all active:scale-[0.99]"
              style={{
                height: 52,
                background: isSelected ? '#f26522' : isToday ? 'rgba(242,101,34,0.12)' : 'var(--surface)',
                border: `1px solid ${isSelected ? '#f26522' : isToday ? 'rgba(242,101,34,0.5)' : 'var(--border)'}`,
                borderRadius: 10,
                opacity: isPast ? 0.3 : 1,
              }}
            >
              <span className="text-sm font-bold leading-none"
                style={{ color: isSelected ? '#fff' : isToday ? '#f26522' : 'var(--text)' }}>
                {day}
              </span>
              {hasOpen && (
                <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : '#6ab04c' }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const now = new Date()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedFish, setSelectedFish] = useState<Species | null>(null)

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const openSpecies = selectedDate ? getOpenSpeciesForDate(selectedDate) : []
  const selectedDateLabel = selectedDate?.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', paddingBottom: '100px' }}>
      <header className="glass-header sticky top-0 z-30 px-4">
        <div className="max-w-lg mx-auto py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Season Calendar</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>● open days &nbsp;·&nbsp; tap any date</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {months.map(({ year, month }) => (
          <MonthBlock
            key={`${year}-${month}`}
            year={year} month={month}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            now={now}
          />
        ))}
        <p className="text-xs text-center pb-6" style={{ color: 'var(--text-faint)' }}>
          Always verify at{' '}
          <a href="https://wdfw.wa.gov/fishing/regulations" className="underline"
            style={{ color: '#f26522' }} target="_blank" rel="noopener noreferrer">
            wdfw.wa.gov
          </a>{' '}before fishing
        </p>
      </div>

      {/* ── Date detail bottom sheet ── */}
      {selectedDate && (
        <div
          className="fixed inset-0 flex flex-col justify-end"
          style={{ zIndex: 1200, background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedDate(null) }}
        >
          <div className="animate-slide-up flex flex-col overflow-hidden"
            style={{ background: '#0d0f1a', borderRadius: '20px 20px 0 0', maxHeight: '80dvh' }}>

            {/* Handle */}
            <div className="flex-shrink-0 pt-3 pb-2 px-5">
              <div className="w-8 h-1 rounded-full mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.18)' }} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-white">{selectedDateLabel}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {openSpecies.length === 0
                      ? 'No species open this day'
                      : `${openSpecies.length} species open`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Fish list */}
            <div className="overflow-y-auto flex-1 px-4 py-3">
              {openSpecies.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-semibold text-white">Nothing open this day</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Try tapping another date</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {openSpecies.map((fish, i) => {
                    const regs = REGULATIONS.filter(r => r.speciesId === fish.id && isOpenOn(r, selectedDate))
                    const bestReg = regs[0] ?? null
                    const waters = regs
                      .map(r => WATER_BODIES.find(w => w.id === r.waterBodyId)?.name)
                      .filter((n): n is string => !!n)
                      .filter((v, idx, a) => a.indexOf(v) === idx)
                      .slice(0, 3)

                    return (
                      <button
                        key={fish.id}
                        onClick={() => setSelectedFish(fish)}
                        className="w-full flex items-center gap-4 px-4 py-4 text-left transition-all active:scale-[0.99]"
                        style={{
                          borderBottom: i < openSpecies.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          background: 'var(--surface)',
                        }}
                      >
                        {/* Photo */}
                        <div className="flex-shrink-0 overflow-hidden"
                          style={{ width: 56, height: 56, background: '#0b0d14', borderRadius: 10 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={fish.photo} alt={fish.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-white leading-tight">{fish.name}</p>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(106,176,76,0.2)', color: '#6ab04c' }}>OPEN</span>
                          </div>
                          {bestReg && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                              {bestReg.dailyLimit !== null && (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 30 }}>Limit</span>
                                  <span className="text-xs font-semibold text-white">{bestReg.dailyLimit}/day</span>
                                </div>
                              )}
                              {bestReg.minSize !== null && (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 30 }}>Min</span>
                                  <span className="text-xs font-semibold text-white">{bestReg.minSize}&quot;</span>
                                </div>
                              )}
                              {bestReg.hatcheryOnly && (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 30 }}>Type</span>
                                  <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Hatchery</span>
                                </div>
                              )}
                              {bestReg.gearRestriction && (
                                <div className="flex items-baseline gap-1.5 col-span-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 30 }}>Rules</span>
                                  <span className="text-xs font-semibold text-white truncate">{bestReg.gearRestriction}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {waters.length > 0 && (
                            <p className="text-[11px] mt-1.5 truncate" style={{ color: 'var(--text-faint)' }}>
                              {waters.join(' · ')}{regs.length > 3 ? ` +${regs.length - 3}` : ''}
                            </p>
                          )}
                        </div>

                        <span className="flex-shrink-0 text-sm" style={{ color: 'var(--text-faint)' }}>›</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedFish && <FishDetailSheet species={selectedFish} onClose={() => setSelectedFish(null)} zIndex={1300} />}
      <BottomNav />
    </div>
  )
}

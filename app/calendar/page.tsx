'use client'
import { useState, useRef } from 'react'
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

  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-white mb-3 sticky top-14 py-2 px-1 z-10"
          style={{ background: 'var(--bg)' }}>
        {monthName}
      </h2>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--text-faint)' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(year, month, day)
          const openCount = getOpenSpeciesForDate(date).length
          const isToday = date.toDateString() === now.toDateString()
          const isSelected = selectedDate?.toDateString() === date.toDateString()
          const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate())

          return (
            <button
              key={day}
              onClick={() => onSelectDate(date)}
              disabled={isPast}
              className="relative flex flex-col items-center py-1.5 rounded-lg transition-all"
              style={{
                background: isSelected ? '#f26522' : isToday ? 'rgba(242,101,34,0.15)' : 'var(--surface)',
                border: `1px solid ${isSelected ? '#f26522' : isToday ? '#f26522' : 'var(--border)'}`,
                opacity: isPast ? 0.35 : 1,
              }}
            >
              <span className="text-xs font-semibold" style={{ color: isSelected ? '#fff' : 'var(--text)' }}>
                {day}
              </span>
              {openCount > 0 && !isPast && (
                <span className="text-[8px] font-bold"
                  style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : '#6ab04c' }}>
                  {openCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function OpenFishCard({ fish, date, onClick }: { fish: Species; date: Date; onClick: () => void }) {
  const regs = REGULATIONS.filter(r => r.speciesId === fish.id && isOpenOn(r, date))
  const waters = regs.map(r => WATER_BODIES.find(w => w.id === r.waterBodyId)).filter(Boolean)
  const totalLimit = regs[0]?.dailyLimit ?? null

  return (
    <button onClick={onClick}
      className="card w-full text-left p-3 mb-2 flex items-center gap-3 transition-all active:scale-98">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fish.photo} alt={fish.name}
        className="rounded-lg flex-shrink-0"
        style={{ width: '56px', height: '56px', objectFit: 'contain', padding: '3px', background: 'rgb(11,13,20)' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white leading-tight">{fish.name}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(106,176,76,0.15)', color: '#6ab04c' }}>OPEN</span>
        </div>
        <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
          {waters.slice(0, 3).map(w => w!.name).join(', ')}
          {waters.length > 3 ? ` +${waters.length - 3} more` : ''}
        </p>
        <div className="flex gap-3 mt-0.5">
          {totalLimit !== null && (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Limit: <span className="text-white">{totalLimit}</span>
            </p>
          )}
          {regs[0]?.hatcheryOnly && <p className="text-xs text-amber-400">Hatchery only</p>}
        </div>
      </div>
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-faint)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  )
}

export default function CalendarPage() {
  const now = new Date()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedFish, setSelectedFish] = useState<Species | null>(null)

  // Generate 12 months starting from current month
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const openSpecies = selectedDate ? getOpenSpeciesForDate(selectedDate) : []
  const selectedDateLabel = selectedDate?.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', paddingBottom: '100px' }}>
      <header className="glass-header sticky top-0 z-30 px-4">
        <div className="max-w-lg mx-auto py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Plan Your Trip</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tap a date to see what&apos;s open</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Selected date panel — sticky below header */}
        {selectedDate && (
          <div className="card p-3 mb-4 sticky top-14 z-20"
               style={{ background: 'var(--surface)', border: '1px solid #f26522' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-white">{selectedDateLabel}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {openSpecies.length === 0 ? 'Nothing open on this date' : `${openSpecies.length} species open`}
                </p>
              </div>
              <button onClick={() => setSelectedDate(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'var(--border)' }}>
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {openSpecies.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Try a different date</p>
            ) : (
              openSpecies.map(fish => (
                <OpenFishCard key={fish.id} fish={fish} date={selectedDate} onClick={() => setSelectedFish(fish)} />
              ))
            )}
          </div>
        )}

        {/* Scrolling months */}
        {months.map(({ year, month }) => (
          <MonthBlock
            key={`${year}-${month}`}
            year={year}
            month={month}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            now={now}
          />
        ))}

        <p className="text-xs text-center pb-4" style={{ color: 'var(--text-faint)' }}>
          ⚠️ Always verify at{' '}
          <a href="https://wdfw.wa.gov/fishing/regulations" className="underline" style={{ color: '#f26522' }}
             target="_blank" rel="noopener noreferrer">wdfw.wa.gov</a>{' '}before fishing
        </p>
      </div>

      {selectedFish && <FishDetailSheet species={selectedFish} onClose={() => setSelectedFish(null)} />}
      <BottomNav />
    </div>
  )
}

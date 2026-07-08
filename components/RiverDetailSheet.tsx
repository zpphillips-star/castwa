'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useWaterSheet } from '@/contexts/WaterSheetContext'
import SeasonBadge from '@/components/SeasonBadge'
import RegulationCard from '@/components/RegulationCard'
import { celsiusToFahrenheit, formatFlow } from '@/lib/utils'
import type {
  WaterBody,
  Species,
  WaterSpecies,
  Regulation,
  EmergencyClosure,
  USGSConditions,
} from '@/types'

interface SheetData {
  water: WaterBody
  waterSpecies: (WaterSpecies & { species: Species })[]
  regulations: (Regulation & { species: Species })[]
  closures: (EmergencyClosure & { species: Species | null })[]
  conditions: USGSConditions | null
}

const typeEmoji: Record<string, string> = {
  river: '🌊',
  lake: '🏞️',
  stream: '💧',
  ocean: '🌊',
  reservoir: '🏔️',
}

export default function RiverDetailSheet() {
  const { openWaterId, closeSheet } = useWaterSheet()
  const [data, setData] = useState<SheetData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null)

  // Fetch water data whenever the open water ID changes
  useEffect(() => {
    if (!openWaterId) {
      setData(null)
      setSelectedSpeciesId(null)
      return
    }

    setLoading(true)
    setFetchError(null)

    fetch(`/api/water/${openWaterId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject('Not found')))
      .then((d: SheetData) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setFetchError('Failed to load water details')
        setLoading(false)
      })
  }, [openWaterId])

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet()
    },
    [closeSheet]
  )
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const isOpen = !!openWaterId

  const selectedReg = selectedSpeciesId
    ? (data?.regulations.find((r) => r.species_id === selectedSpeciesId) ?? null)
    : null

  const selectedSpecies = selectedSpeciesId
    ? (data?.waterSpecies.find((ws) => ws.species_id === selectedSpeciesId)?.species ?? null)
    : null

  const selectedClosures = selectedSpeciesId
    ? (data?.closures.filter(
        (c) => c.species_id === selectedSpeciesId || c.species_id === null
      ) ?? [])
    : []

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSheet}
        aria-hidden="true"
      />

      {/* Sheet — slides up from bottom on mobile, from right on desktop */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[1101] max-h-[90dvh] overflow-y-auto rounded-t-2xl border-t border-water-700/40 bg-[#0c1a2e] shadow-2xl transition-transform duration-300 ease-out md:bottom-0 md:left-auto md:right-0 md:top-0 md:w-[480px] md:max-h-full md:rounded-none md:rounded-l-2xl md:border-t-0 md:border-l ${
          isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={data ? `${data.water.name} details` : 'Water details'}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-water-700/60" />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center p-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-water-600 border-t-transparent" />
              <p className="text-sm text-water-400">Loading…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {fetchError && !loading && (
          <div className="p-8 text-center">
            <p className="text-red-400 mb-4">{fetchError}</p>
            <button
              onClick={closeSheet}
              className="rounded-lg bg-water-800/60 px-4 py-2 text-sm text-water-200 hover:bg-water-700/60 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Main content */}
        {data && !loading && (
          <>
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-water-700/20 bg-[#0c1a2e]/95 px-5 py-4 backdrop-blur">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex-shrink-0 text-2xl">
                  {typeEmoji[data.water.type] ?? '💧'}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold leading-tight text-white">
                    {data.water.name}
                  </h2>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-water-400">
                    <span className="capitalize">{data.water.type}</span>
                    {data.water.county && <span>• {data.water.county} Co.</span>}
                    {data.water.wria && <span>• WRIA {data.water.wria}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={closeSheet}
                className="flex-shrink-0 rounded-full p-1.5 text-water-400 hover:bg-water-800/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="px-5 pb-10">

              {/* ── Conditions strip (only if USGS gauge data exists) ── */}
              {data.conditions &&
                (data.conditions.flow_cfs !== null ||
                  data.conditions.temp_celsius !== null) && (
                  <div className="mt-4 rounded-xl border border-water-700/30 bg-water-900/50 p-4">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-water-400">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-forest-400" />
                      Live USGS Conditions
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {data.conditions.flow_cfs !== null && (
                        <div>
                          <p className="text-xs text-water-400">Flow</p>
                          <p className="text-base font-semibold text-white">
                            {formatFlow(data.conditions.flow_cfs)}
                          </p>
                        </div>
                      )}
                      {data.conditions.temp_celsius !== null && (
                        <div>
                          <p className="text-xs text-water-400">Temp</p>
                          <p className="text-base font-semibold text-white">
                            {celsiusToFahrenheit(data.conditions.temp_celsius)}°F
                          </p>
                        </div>
                      )}
                      {data.conditions.timestamp && (
                        <div>
                          <p className="text-xs text-water-400">Updated</p>
                          <p className="text-xs text-water-200">
                            {new Date(data.conditions.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* ── Species list or fish drill-down ── */}
              {!selectedSpeciesId ? (
                <>
                  {/* Emergency closures (summary level, before species) */}
                  {data.closures.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {data.closures.map((closure) => (
                        <div
                          key={closure.id}
                          className="rounded-xl border border-red-500/50 bg-red-950/30 p-3"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-bold text-red-400">
                              ⚠ EMERGENCY CLOSURE
                            </span>
                            {closure.species && (
                              <span className="rounded-full bg-red-900/50 px-2 py-0.5 text-xs text-red-300">
                                {closure.species.common_name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-red-200">{closure.reason}</p>
                          <p className="mt-0.5 text-xs text-red-300/60">
                            {closure.starts_at} — {closure.ends_at}
                          </p>
                          {closure.source_url && (
                            <a
                              href={closure.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs text-red-400 underline hover:text-red-200"
                            >
                              Official source →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Species chips */}
                  <div className="mt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-water-400">
                      Species ({data.waterSpecies.length})
                    </p>
                    {data.waterSpecies.length === 0 ? (
                      <p className="text-sm italic text-water-500">
                        No species data on file for this water body.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {data.waterSpecies.map((ws) => {
                          const hasReg = data.regulations.some(
                            (r) => r.species_id === ws.species_id
                          )
                          const hasClosure = data.closures.some(
                            (c) => c.species_id === ws.species_id
                          )
                          return (
                            <button
                              key={ws.id}
                              onClick={() => setSelectedSpeciesId(ws.species_id)}
                              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                                hasClosure
                                  ? 'border-red-500/50 bg-red-950/30 text-red-300 hover:bg-red-900/40'
                                  : hasReg
                                  ? 'border-water-600/40 bg-water-900/40 text-water-200 hover:border-water-400 hover:bg-water-800/60 hover:text-white'
                                  : 'border-gray-700/40 bg-gray-900/30 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
                              }`}
                            >
                              {hasClosure && (
                                <span className="text-xs text-red-400">⚠</span>
                              )}
                              {ws.species?.common_name}
                              {(hasReg || hasClosure) && (
                                <svg
                                  className="h-3 w-3 opacity-50"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ── Fish drill-down ── */
                <div className="mt-4">
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedSpeciesId(null)}
                    className="mb-4 flex items-center gap-1.5 text-sm text-water-400 hover:text-water-200 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    All species
                  </button>

                  {/* Species name */}
                  <div className="mb-4 flex flex-wrap items-baseline gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {selectedSpecies?.common_name}
                    </h3>
                    {selectedSpecies?.scientific_name && (
                      <span className="text-xs italic text-water-400">
                        {selectedSpecies.scientific_name}
                      </span>
                    )}
                  </div>

                  {/* Closures for this species */}
                  {selectedClosures.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {selectedClosures.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-red-500/50 bg-red-950/30 p-3"
                        >
                          <p className="mb-1 text-xs font-bold text-red-400">
                            ⚠ EMERGENCY CLOSURE
                          </p>
                          <p className="text-xs text-red-200">{c.reason}</p>
                          <p className="mt-0.5 text-xs text-red-300/60">
                            {c.starts_at} — {c.ends_at}
                          </p>
                          {c.source_url && (
                            <a
                              href={c.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs text-red-400 underline hover:text-red-200"
                            >
                              Official source →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedReg ? (
                    <div className="space-y-4">
                      {selectedReg.season_open && selectedReg.season_close && (
                        <SeasonBadge
                          openDate={selectedReg.season_open}
                          closeDate={selectedReg.season_close}
                        />
                      )}
                      <RegulationCard regulation={selectedReg} />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-700/30 bg-gray-900/40 p-5 text-center text-sm text-gray-400">
                      <p>No 2025 regulation data on file for this species at this water.</p>
                      <a
                        href="https://wdfw.wa.gov/fishing/regulations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-water-400 underline hover:text-water-200"
                      >
                        Check WDFW for current regulations →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* ── Footer ── */}
              <div className="mt-8 flex items-center justify-between border-t border-water-700/20 pt-4">
                <Link
                  href={`/water/${data.water.id}`}
                  onClick={closeSheet}
                  className="text-sm text-water-400 underline hover:text-water-200 transition-colors"
                >
                  View full page →
                </Link>
                <p className="text-xs text-water-600">
                  Verify with{' '}
                  <a
                    href="https://wdfw.wa.gov/fishing/regulations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-water-500 underline hover:text-water-400"
                  >
                    WDFW
                  </a>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

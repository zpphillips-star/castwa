import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUSGSSiteConditions } from '@/lib/apis/usgs'
import RegulationCard from '@/components/RegulationCard'
import SeasonBadge from '@/components/SeasonBadge'
import { celsiusToFahrenheit, formatFlow } from '@/lib/utils'
import type { WaterSpecies, Regulation, EmergencyClosure, Species } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('water_bodies').select('name').eq('id', id).single()
  return {
    title: data ? `${data.name} Fishing Guide | CastWA` : 'Water Body | CastWA',
  }
}

export default async function WaterPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: water }, { data: waterSpecies }, { data: regulations }, { data: closures }] =
    await Promise.all([
      supabase.from('water_bodies').select('*').eq('id', id).single(),
      supabase
        .from('water_species')
        .select('*, species:species(*)')
        .eq('water_body_id', id),
      supabase
        .from('regulations')
        .select('*, species:species(*)')
        .eq('water_body_id', id)
        .eq('year', 2025),
      supabase
        .from('emergency_closures')
        .select('*, species:species(*)')
        .eq('water_body_id', id)
        .gte('ends_at', new Date().toISOString().split('T')[0]),
    ])

  if (!water) notFound()

  const conditions = water.usgs_site_id
    ? await getUSGSSiteConditions(water.usgs_site_id)
    : null

  const typeIcon: Record<string, string> = {
    river: '🌊', lake: '🏞️', stream: '💧', ocean: '🌊', reservoir: '🏔️',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-water-400 hover:text-water-200 transition-colors">
        ← Back to search
      </Link>

      {/* Water body header */}
      <div className="mb-8 card p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{typeIcon[water.type] ?? '💧'}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">{water.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-sm text-water-300 capitalize">{water.type}</span>
              {water.county && (
                <span className="text-sm text-water-400">• {water.county} County</span>
              )}
              {water.wria && (
                <span className="text-sm text-water-400">• WRIA {water.wria}</span>
              )}
            </div>
          </div>
        </div>

        {/* USGS Conditions */}
        {conditions && (conditions.flow_cfs !== null || conditions.temp_celsius !== null) && (
          <div className="mt-4 rounded-lg bg-water-900/60 border border-water-700/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-water-400 mb-3">
              Real-time USGS Conditions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {conditions.flow_cfs !== null && (
                <div>
                  <p className="text-xs text-water-400">Flow Rate</p>
                  <p className="text-lg font-semibold text-white">{formatFlow(conditions.flow_cfs)}</p>
                </div>
              )}
              {conditions.temp_celsius !== null && (
                <div>
                  <p className="text-xs text-water-400">Water Temp</p>
                  <p className="text-lg font-semibold text-white">
                    {celsiusToFahrenheit(conditions.temp_celsius)}°F
                  </p>
                </div>
              )}
              {conditions.timestamp && (
                <div>
                  <p className="text-xs text-water-400">As of</p>
                  <p className="text-sm text-water-200">
                    {new Date(conditions.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Emergency closures */}
      {closures && closures.length > 0 && (
        <div className="mb-6">
          {closures.map((closure: EmergencyClosure & { species: Species | null }) => (
            <div key={closure.id} className="rounded-xl border border-red-500/50 bg-red-950/30 p-4 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 font-bold text-sm">⚠ EMERGENCY CLOSURE</span>
                {closure.species && (
                  <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">
                    {closure.species.common_name}
                  </span>
                )}
              </div>
              <p className="text-red-200 text-sm">{closure.reason}</p>
              <p className="text-red-300/70 text-xs mt-1">
                {closure.starts_at} — {closure.ends_at}
              </p>
              {closure.source_url && (
                <a href={closure.source_url} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-red-400 hover:text-red-200 underline mt-1 inline-block">
                  Official source →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Species present */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-white">
          Species Present ({waterSpecies?.length ?? 0})
        </h2>
        {(!waterSpecies || waterSpecies.length === 0) ? (
          <div className="card p-6 text-center text-water-400">
            No species data on file for this water body.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {waterSpecies.map((ws: WaterSpecies & { species: Species }) => (
              <Link
                key={ws.id}
                href={`/species/${ws.species_id}`}
                className="flex items-center gap-1.5 rounded-full border border-water-600/40 bg-water-900/40 px-3 py-1.5 text-sm text-water-200 hover:border-water-400 hover:bg-water-800/60 hover:text-white transition-all"
              >
                <span className="text-xs text-water-400">{ws.confidence === 'confirmed' ? '✓' : ws.confidence === 'likely' ? '~' : '?'}</span>
                {ws.species?.common_name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Regulations */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">2025 Regulations</h2>
        {(!regulations || regulations.length === 0) ? (
          <div className="card p-6 text-center">
            <p className="text-water-400 mb-2">No 2025 regulation data on file.</p>
            <a
              href="https://wdfw.wa.gov/fishing/regulations"
              target="_blank" rel="noopener noreferrer"
              className="text-water-400 hover:text-water-200 underline text-sm"
            >
              Check WDFW for current regulations →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {regulations.map((reg: Regulation & { species: Species }) => (
              <div key={reg.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <Link href={`/species/${reg.species_id}`} className="font-semibold text-white hover:text-water-300 transition-colors">
                      {reg.species?.common_name}
                    </Link>
                    <span className="ml-2 text-xs text-water-400 italic">{reg.species?.scientific_name}</span>
                  </div>
                  {reg.season_open && reg.season_close && (
                    <SeasonBadge openDate={reg.season_open} closeDate={reg.season_close} />
                  )}
                </div>
                <RegulationCard regulation={reg} />
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-water-500">
          * Always verify regulations with{' '}
          <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer" className="text-water-400 hover:text-water-200 underline">
            WDFW
          </a>{' '}
          before fishing. Emergency closures and in-season adjustments may apply.
        </p>
      </section>
    </div>
  )
}

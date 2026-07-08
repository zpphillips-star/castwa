import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import RegulationCard from '@/components/RegulationCard'
import SeasonBadge from '@/components/SeasonBadge'
import WaterBodyCard from '@/components/WaterBodyCard'
import type { Regulation, WaterSpecies, WaterBody } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('species').select('common_name').eq('id', id).single()
  return {
    title: data ? `${data.common_name} Fishing in WA | CastWA` : 'Species | CastWA',
  }
}

export default async function SpeciesPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: species }, { data: waterSpecies }, { data: regulations }] = await Promise.all([
    supabase.from('species').select('*').eq('id', id).single(),
    supabase
      .from('water_species')
      .select('*, water_body:water_bodies(*)')
      .eq('species_id', id)
      .eq('confidence', 'confirmed'),
    supabase
      .from('regulations')
      .select('*, water_body:water_bodies(*)')
      .eq('species_id', id)
      .eq('year', 2025),
  ])

  if (!species) notFound()

  const categoryColors: Record<string, string> = {
    salmon: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
    trout: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    steelhead: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
    bass: 'bg-green-900/40 text-green-300 border-green-700/50',
    panfish: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
    marine: 'bg-teal-900/40 text-teal-300 border-teal-700/50',
    other: 'bg-gray-800/40 text-gray-300 border-gray-600/50',
  }

  const regulationsByWater = new Map<string, Regulation>()
  for (const reg of regulations ?? []) {
    regulationsByWater.set(reg.water_body_id, reg)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-water-400 hover:text-water-200 transition-colors">
        ← Back to search
      </Link>

      {/* Species header */}
      <div className="mb-8 card p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-white">{species.common_name}</h1>
              <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${categoryColors[species.category] ?? categoryColors.other}`}>
                {species.category}
              </span>
            </div>
            {species.scientific_name && (
              <p className="text-water-400 italic mb-3">{species.scientific_name}</p>
            )}
            {species.description && (
              <p className="text-water-200/80 leading-relaxed">{species.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Waters where found */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-white">
          Found in {waterSpecies?.length ?? 0} WA Waters
        </h2>
        {(!waterSpecies || waterSpecies.length === 0) ? (
          <div className="card p-8 text-center text-water-400">
            No confirmed waters on record. Check WDFW for current stocking reports.
          </div>
        ) : (
          <div className="space-y-4">
            {waterSpecies.map((ws: WaterSpecies & { water_body: WaterBody }) => {
              const reg = regulationsByWater.get(ws.water_body_id)
              return (
                <div key={ws.id} className="card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <WaterBodyCard water={ws.water_body} compact />
                    </div>
                    {reg && (
                      <div className="sm:w-72 flex-shrink-0">
                        <p className="text-xs text-water-400 mb-2 font-medium uppercase tracking-wider">2025 Regulations</p>
                        {reg.season_open && reg.season_close && (
                          <SeasonBadge openDate={reg.season_open} closeDate={reg.season_close} />
                        )}
                        <RegulationCard regulation={reg} compact />
                      </div>
                    )}
                    {!reg && (
                      <div className="sm:w-72 flex-shrink-0">
                        <div className="rounded-lg bg-gray-900/50 border border-gray-700/30 p-3 text-sm text-gray-400">
                          No 2025 regulation data on file. Check{' '}
                          <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer" className="text-water-400 hover:text-water-200 underline">
                            WDFW
                          </a>.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* All regulations */}
      {regulations && regulations.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">Full 2025 Regulation Details</h2>
          <div className="space-y-4">
            {regulations.map((reg: Regulation & { water_body: WaterBody }) => (
              <div key={reg.id} className="card p-4">
                <h3 className="font-semibold text-white mb-3">
                  <Link href={`/water/${reg.water_body.id}`} className="hover:text-water-300 transition-colors">
                    {reg.water_body?.name}
                  </Link>
                </h3>
                <RegulationCard regulation={reg} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

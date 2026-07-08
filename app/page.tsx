import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import SearchBar from '@/components/SearchBar'
import WaterBodyCard from '@/components/WaterBodyCard'
import SpeciesCard from '@/components/SpeciesCard'
import type { Species, WaterBody } from '@/types'

const QUICK_SPECIES = ['Chinook Salmon', 'Steelhead', 'Rainbow Trout', 'Largemouth Bass', 'Pacific Halibut']
const POPULAR_WATERS = ['Yakima River', 'Skagit River', 'Columbia River', 'Banks Lake', 'Puget Sound', 'Lake Washington']

export const revalidate = 3600

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()

  const [{ data: species }, { data: waters }] = await Promise.all([
    supabase.from('species').select('*').order('common_name'),
    supabase
      .from('water_bodies')
      .select('*')
      .in('name', POPULAR_WATERS)
      .order('name'),
  ])

  const quickSpecies = (species ?? []).filter((s: Species) =>
    QUICK_SPECIES.includes(s.common_name)
  )

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-water-950 via-[#0c2a3e] to-[#0c1a2e] py-20 sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,#0ea5e9_0%,transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-water-600/30 bg-water-900/40 px-4 py-1.5 text-sm text-water-300">
            <span className="inline-block h-2 w-2 rounded-full bg-forest-400 animate-pulse" />
            Real-time conditions from USGS
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Find where to fish in{' '}
            <span className="text-water-400">Washington State</span>
          </h1>
          <p className="mb-8 text-lg text-water-200/80 sm:text-xl">
            Species-by-species regulations, real-time river conditions, and an interactive map of every WA water body.
          </p>

          {/* Search bar */}
          <div className="mx-auto max-w-2xl">
            <SearchBar allSpecies={species ?? []} />
          </div>

          {/* Quick species chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-water-400">Quick search:</span>
            {quickSpecies.map((s: Species) => (
              <Link
                key={s.id}
                href={`/species/${s.id}`}
                className="rounded-full border border-water-600/40 bg-water-900/40 px-5 py-2.5 text-base font-medium text-water-200 hover:border-water-400 hover:bg-water-800/60 hover:text-white transition-all"
              >
                {s.common_name}
              </Link>
            ))}
          </div>

          {/* Map CTA */}
          <div className="mt-8">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-lg bg-water-600/20 border border-water-500/30 px-5 py-2.5 text-water-200 hover:bg-water-600/30 hover:text-white transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Or explore the interactive map →
            </Link>
          </div>
        </div>
      </section>

      {/* Popular waters */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Popular WA Waters</h2>
          <Link href="/waters" className="text-sm text-water-400 hover:text-water-200 transition-colors">
            Browse all waters →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(waters ?? []).map((water: WaterBody) => (
            <WaterBodyCard key={water.id} water={water} />
          ))}
        </div>
      </section>

      {/* All species */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-water-700/20">
        <h2 className="mb-6 text-xl font-bold text-white">All Washington Species</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(species ?? []).map((s: Species) => (
            <SpeciesCard key={s.id} species={s} compact />
          ))}
        </div>
      </section>
    </div>
  )
}

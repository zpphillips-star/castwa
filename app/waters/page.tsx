import { createServerSupabaseClient } from '@/lib/supabase-server'
import WaterBodyCard from '@/components/WaterBodyCard'
import type { WaterBody } from '@/types'

export const metadata = {
  title: 'Washington Fishing Waters | CastWA',
  description:
    'Browse every Washington State fishing water — rivers, lakes, streams, reservoirs, and marine areas. Tap any water to see live conditions, species, and 2025 regulations.',
  keywords:
    'Washington fishing waters, WA rivers, WA lakes, fishing regulations map, WDFW',
}

export const revalidate = 3600

const TYPE_ORDER = ['river', 'lake', 'reservoir', 'stream', 'ocean'] as const

const TYPE_LABELS: Record<string, string> = {
  river: 'Rivers 🌊',
  lake: 'Lakes 🏞️',
  stream: 'Streams 💧',
  ocean: 'Marine / Ocean 🌊',
  reservoir: 'Reservoirs 🏔️',
}

export default async function WatersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: waters } = await supabase
    .from('water_bodies')
    .select('*')
    .order('name')

  const all = (waters ?? []) as WaterBody[]

  // Group by type
  const grouped = all.reduce<Record<string, WaterBody[]>>((acc, w) => {
    const key = w.type ?? 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  const knownOrder = TYPE_ORDER.filter((t) => (grouped[t]?.length ?? 0) > 0)
  const otherTypes = Object.keys(grouped).filter(
    (t) => !(TYPE_ORDER as readonly string[]).includes(t) && (grouped[t]?.length ?? 0) > 0
  )
  const types = [...knownOrder, ...otherTypes]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Washington Fishing Waters</h1>
        <p className="mt-1 text-water-400">
          {all.length} waters on record — tap any card to see live conditions, species, and
          2025 regulations.
        </p>
      </div>

      {/* Type sections */}
      {types.map((type) => {
        const list = grouped[type]
        if (!list?.length) return null
        return (
          <section key={type} className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-white">
              {TYPE_LABELS[type] ?? type}{' '}
              <span className="ml-1 text-base font-normal text-water-500">
                ({list.length})
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((water) => (
                <WaterBodyCard key={water.id} water={water} />
              ))}
            </div>
          </section>
        )
      })}

      {all.length === 0 && (
        <div className="rounded-xl border border-water-700/30 bg-water-900/30 p-12 text-center text-water-400">
          <p className="text-lg">No waters found.</p>
          <p className="mt-1 text-sm">Data loads from Supabase — check your connection.</p>
        </div>
      )}
    </div>
  )
}

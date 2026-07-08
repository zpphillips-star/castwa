import { createServerSupabaseClient } from '@/lib/supabase-server'
import MapView from '@/components/MapView'
import type { WaterBody } from '@/types'

export const metadata = {
  title: 'Interactive Fishing Map | CastWA',
  description: 'Interactive map of Washington State fishing waters',
}

export default async function MapPage() {
  const supabase = await createServerSupabaseClient()

  const { data: waters } = await supabase
    .from('water_bodies')
    .select('*')
    .order('name')

  const { data: openRegulations } = await supabase
    .from('open_regulations')
    .select('water_body_id')

  const openWaterIds = new Set((openRegulations ?? []).map((r: { water_body_id: string }) => r.water_body_id))

  const watersWithStatus = (waters ?? []).map((w: WaterBody) => ({
    ...w,
    hasOpenSeason: openWaterIds.has(w.id),
  }))

  return (
    <div className="flex h-[calc(100vh-64px-56px)] flex-col md:h-[calc(100vh-64px)]">
      <div className="border-b border-water-700/30 bg-water-950/50 px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-water-300">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-water-400" /> Open season
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-gray-500" /> Closed / unknown
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" /> Opening soon
          </span>
        </div>
      </div>
      <div className="flex-1">
        <MapView waters={watersWithStatus} />
      </div>
    </div>
  )
}

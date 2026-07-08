import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUSGSSiteConditions } from '@/lib/apis/usgs'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
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

  if (!water) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const conditions = water.usgs_site_id
    ? await getUSGSSiteConditions(water.usgs_site_id)
    : null

  return NextResponse.json({
    water,
    waterSpecies: waterSpecies ?? [],
    regulations: regulations ?? [],
    closures: closures ?? [],
    conditions,
  })
}

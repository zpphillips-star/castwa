import { NextResponse } from 'next/server'

/**
 * POST /api/wdfw-check
 * Internal endpoint called by the scheduled watchdog agent.
 * Returns a summary of current emergency rules for fishing species.
 * Includes a "last_checked" timestamp so we can verify freshness.
 */
export async function GET() {
  const WDFW_RSS_URL = 'https://wdfw.wa.gov/rss/emergency-rules.xml'

  try {
    const res = await fetch(WDFW_RSS_URL, {
      headers: { 'User-Agent': 'CastWA/1.0 watchdog (castwa.com)' },
      cache: 'no-store', // always fresh for watchdog
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const xml = await res.text()

    // Quick count of fishing-related items
    const fishingKeywords = ['salmon', 'steelhead', 'trout', 'bass', 'walleye', 'crab', 'halibut', 'fishing', 'closure']
    const itemMatches = xml.match(/<item>/g) ?? []
    const totalItems = itemMatches.length

    const fishingItems = (xml.match(/<title>[\s\S]*?<\/title>/g) ?? []).filter(t =>
      fishingKeywords.some(kw => t.toLowerCase().includes(kw))
    )

    return NextResponse.json({
      ok: true,
      totalEmergencyRules: totalItems,
      fishingRelatedRules: fishingItems.length,
      checkTime: new Date().toISOString(),
      sourceUrl: WDFW_RSS_URL,
      titles: fishingItems.map(t => t.replace(/<\/?title>|<!\[CDATA\[|\]\]>/g, '').trim()).slice(0, 10),
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error', checkTime: new Date().toISOString() },
      { status: 200 }
    )
  }
}

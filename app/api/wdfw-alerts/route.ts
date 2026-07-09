import { NextResponse } from 'next/server'

const WDFW_RSS_URL = 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/rss'

export interface WDFWAlert {
  title: string
  link: string
  description: string
  pubDate: string
  isFishingRelated: boolean
}

const FISHING_KEYWORDS = [
  'salmon', 'steelhead', 'trout', 'bass', 'walleye', 'perch', 'sturgeon',
  'halibut', 'crab', 'clam', 'oyster', 'fishing', 'angling', 'sportfish',
  'chinook', 'coho', 'sockeye', 'chum', 'cutthroat', 'bluegill', 'crappie',
  'muskie', 'closure', 'emergency rule', 'daily limit', 'hatchery'
]

function isFishingRelated(text: string): boolean {
  const lower = text.toLowerCase()
  return FISHING_KEYWORDS.some(kw => lower.includes(kw))
}

function parseXml(xml: string): WDFWAlert[] {
  const items: WDFWAlert[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const title       = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)       || item.match(/<title>(.*?)<\/title>/))?.[1]?.trim() ?? ''
    const link        = (item.match(/<link>(.*?)<\/link>/))?.[1]?.trim() ?? ''
    const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/))?.[1]?.trim() ?? ''
    const pubDate     = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim() ?? ''

    items.push({
      title,
      link,
      description,
      pubDate,
      isFishingRelated: isFishingRelated(title + ' ' + description),
    })
  }

  return items
}

// Cache in memory for 1 hour (Vercel serverless will reset between cold starts)
let cache: { alerts: WDFWAlert[]; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET() {
  try {
    const now = Date.now()
    if (cache && now - cache.fetchedAt < CACHE_TTL) {
      return NextResponse.json({ alerts: cache.alerts, source: 'cache', fetchedAt: cache.fetchedAt })
    }

    const res = await fetch(WDFW_RSS_URL, {
      headers: { 'User-Agent': 'CastWA/1.0 (castwa.com; fishing regulation app)' },
      next: { revalidate: 3600 }, // Next.js cache 1hr
    })

    if (!res.ok) {
      throw new Error(`WDFW RSS returned ${res.status}`)
    }

    const xml = await res.text()
    const allAlerts = parseXml(xml)
    const fishingAlerts = allAlerts.filter(a => a.isFishingRelated)

    cache = { alerts: fishingAlerts, fetchedAt: now }

    return NextResponse.json({
      alerts: fishingAlerts,
      total: allAlerts.length,
      fishingCount: fishingAlerts.length,
      source: 'live',
      fetchedAt: now,
      sourceUrl: WDFW_RSS_URL,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    // Return empty alerts — never crash the app over a failed WDFW fetch
    return NextResponse.json(
      {
        alerts: [],
        error: message,
        fallbackMessage: 'Could not reach WDFW. Always verify regulations at wdfw.wa.gov before fishing.',
        sourceUrl: WDFW_RSS_URL,
      },
      { status: 200 } // 200 so the app still renders
    )
  }
}

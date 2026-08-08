import { NextResponse } from 'next/server'

const WDFW_RSS_URL = 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/rss'

export interface WDFWAlert {
  title: string
  link: string
  description: string
  pubDate: string
  isFishingRelated: boolean
  activeFrom?: string
  activeTo?: string | null
}

const FISHING_KEYWORDS = [
  'salmon', 'steelhead', 'trout', 'bass', 'walleye', 'perch', 'sturgeon',
  'halibut', 'crab', 'clam', 'oyster', 'fishing', 'angling', 'sportfish',
  'chinook', 'coho', 'sockeye', 'chum', 'cutthroat', 'bluegill', 'crappie',
  'muskie', 'closure', 'emergency rule', 'daily limit', 'hatchery'
]

// WDFW RSS may omit older-but-still-active emergency rules. Keep verified current
// closures pinned until their official end date so daily monitors do not regress
// conservative app status to open/fishable.
const PINNED_CURRENT_ALERTS: WDFWAlert[] = [
  {
    title: 'Skykomish River fishing will not open until Nov. 1',
    link: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/skykomish-river-fishing-will-not-open-until-nov-1-2026-06',
    description: 'WDFW emergency rule published Jun. 2, 2026: Skykomish River closed to all fishing immediately through Oct. 31, 2026 from the mouth to the confluence of North and South forks. Species affected: all species. Reason: protect returning wild Chinook salmon after a very low pre-season forecast. Overrides pamphlet salmon, steelhead, and game fish seasons including Wallace River Hatchery Chinook and Reiter Ponds steelhead.',
    pubDate: 'Tue, 02 Jun 2026 00:00:00 -0700',
    isFishingRelated: true,
    activeFrom: '2026-06-02',
    activeTo: '2026-10-31',
  },
]

function isPinnedAlertActive(alert: WDFWAlert, now = new Date()): boolean {
  if (!alert.activeFrom && !alert.activeTo) return true
  const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const from = alert.activeFrom ? new Date(`${alert.activeFrom}T00:00:00`) : null
  const to = alert.activeTo ? new Date(`${alert.activeTo}T23:59:59`) : null
  return (!from || dateOnly >= from) && (!to || dateOnly <= to)
}

function mergePinnedAlerts(alerts: WDFWAlert[]): WDFWAlert[] {
  const seen = new Set(alerts.map(a => a.link))
  const pinned = PINNED_CURRENT_ALERTS.filter(a => isPinnedAlertActive(a) && !seen.has(a.link))
  return [...pinned, ...alerts]
}

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
    const fishingAlerts = mergePinnedAlerts(allAlerts.filter(a => a.isFishingRelated))

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

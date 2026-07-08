#!/usr/bin/env node
/**
 * fetch-river-coords.js — v2 (FULL WA STATE)
 * Fetches ALL named rivers, major streams, and named lakes/reservoirs
 * in Washington State from OpenStreetMap Overpass API.
 *
 * Output: lib/river-coords-generated.ts
 *   - Named exports for the 6 original rivers (backwards compat)
 *   - WA_WATERWAYS: Record<string, WaterwayEntry> — full map
 *
 * Usage: node scripts/fetch-river-coords.js
 */

const fs = require('fs')
const path = require('path')

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// WA state split into north + south for reliability
const BBOX_N = '47.0,-124.8,49.0,-116.9'
const BBOX_S = '45.5,-124.8,47.0,-116.9'

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchOverpass(query, label) {
  console.log(`  Querying: ${label}...`)
  const url = `${OVERPASS_URL}?data=${encodeURIComponent(query)}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          'Accept': 'application/json, */*',
          'User-Agent': 'CastWA/2.0 river-coords-fetcher (github.com/castwa)',
        },
      })
      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        throw new Error(`HTTP ${resp.status}: ${body.slice(0, 300)}`)
      }
      const json = await resp.json()
      console.log(`    ✓ ${(json.elements || []).length} elements`)
      return json.elements || []
    } catch (err) {
      console.warn(`    Attempt ${attempt}/3 failed: ${err.message}`)
      if (attempt < 3) {
        const delay = 8000 * attempt
        console.log(`    Waiting ${delay/1000}s before retry...`)
        await sleep(delay)
      } else {
        throw err
      }
    }
  }
}

/**
 * Assemble way segments into continuous polylines using greedy end-to-end matching.
 * Returns array of chains (some rivers have disconnected segments/channels).
 */
function assembleWays(ways) {
  if (ways.length === 0) return []
  const segments = ways
    .filter(w => w.geometry && w.geometry.length > 0)
    .map(w => w.geometry.map(n => [n.lat, n.lon]))
  if (segments.length === 0) return []
  if (segments.length === 1) return [segments[0]]

  const TOL = 0.0003 // ~33m tolerance

  function ptEq(a, b) {
    return Math.abs(a[0] - b[0]) < TOL && Math.abs(a[1] - b[1]) < TOL
  }

  const used = new Set()
  const chains = []

  for (let startIdx = 0; startIdx < segments.length; startIdx++) {
    if (used.has(startIdx)) continue
    used.add(startIdx)
    let chain = [...segments[startIdx]]

    let extended = true
    while (extended) {
      extended = false
      const chainHead = chain[0]
      const chainTail = chain[chain.length - 1]

      for (let i = 0; i < segments.length; i++) {
        if (used.has(i)) continue
        const seg = segments[i]
        const segHead = seg[0]
        const segTail = seg[seg.length - 1]

        if (ptEq(chainTail, segHead)) {
          chain = chain.concat(seg.slice(1))
          used.add(i); extended = true; break
        } else if (ptEq(chainTail, segTail)) {
          chain = chain.concat([...seg].reverse().slice(1))
          used.add(i); extended = true; break
        } else if (ptEq(chainHead, segTail)) {
          chain = seg.concat(chain.slice(1))
          used.add(i); extended = true; break
        } else if (ptEq(chainHead, segHead)) {
          chain = [...seg].reverse().concat(chain.slice(1))
          used.add(i); extended = true; break
        }
      }
    }

    if (chain.length >= 2) chains.push(chain)
  }

  // Sort chains longest-first
  chains.sort((a, b) => b.length - a.length)
  return chains
}

/**
 * Assemble lake/polygon outline from ways.
 * Returns the longest ring found (outer boundary).
 */
function assembleLakePolygon(ways) {
  const chains = assembleWays(ways)
  if (chains.length === 0) return []
  // Return longest chain (outer ring)
  return chains[0]
}

/** Douglas-Peucker simplification */
function simplify(pts, epsilon) {
  if (pts.length <= 2) return pts
  let dmax = 0, idx = 0
  const end = pts.length - 1
  for (let i = 1; i < end; i++) {
    const d = perpendicularDist(pts[i], pts[0], pts[end])
    if (d > dmax) { dmax = d; idx = i }
  }
  if (dmax > epsilon) {
    const r1 = simplify(pts.slice(0, idx + 1), epsilon)
    const r2 = simplify(pts.slice(idx), epsilon)
    return r1.slice(0, -1).concat(r2)
  }
  return [pts[0], pts[end]]
}

function perpendicularDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2)
  return Math.abs(dy * px - dx * py + bx * ay - by * ax) / mag
}

/** Group ways by name, merge north+south results */
function groupByName(elements) {
  const map = new Map()
  for (const el of elements) {
    if (el.type !== 'way' || !el.tags || !el.geometry) continue
    const name = el.tags.name || el.tags['name:en']
    if (!name) continue
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(el)
  }
  return map
}

/** Format a [lat, lng][] as compact TS literal */
function formatCoords(coords) {
  if (!coords || coords.length === 0) return '[]'
  const lines = coords.map(([lat, lng]) => `  [${lat.toFixed(6)}, ${lng.toFixed(6)}]`)
  return '[\n' + lines.join(',\n') + ',\n]'
}

/** Format coords[][] as nested TS literal */
function formatCoordsArray(arr) {
  if (!arr || arr.length === 0) return '[]'
  const inner = arr.map(chain => formatCoords(chain))
  return '[\n' + inner.join(',\n') + ',\n]'
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('════════════════════════════════════════')
  console.log(' CastWA — Full WA Waterway Fetch (v2)')
  console.log('════════════════════════════════════════\n')

  // ── STEP 1: Fetch all named rivers ──────────────────────────────────────────
  console.log('── Step 1: Rivers ──────────────────────')
  const riverEls = []

  for (const [label, bbox] of [['North WA rivers', BBOX_N], ['South WA rivers', BBOX_S]]) {
    const q = `[out:json][timeout:120];way["waterway"="river"]["name"](${bbox});out geom;`
    try {
      const els = await fetchOverpass(q, label)
      riverEls.push(...els)
    } catch (err) {
      console.error(`  ❌ ${label}: ${err.message}`)
    }
    await sleep(3000)
  }

  const riversByName = groupByName(riverEls)
  // Filter rivers: only keep those with >= 5 total nodes (avoid ghost entries)
  for (const [name, ways] of [...riversByName.entries()]) {
    const total = ways.reduce((s, w) => s + (w.geometry?.length || 0), 0)
    if (total < 5) riversByName.delete(name)
  }
  console.log(`  Total unique river names (≥5 nodes): ${riversByName.size}\n`)

  // ── STEP 2: Fetch major streams ──────────────────────────────────────────────
  console.log('── Step 2: Streams ─────────────────────')
  const streamEls = []

  for (const [label, bbox] of [['North WA streams', BBOX_N], ['South WA streams', BBOX_S]]) {
    const q = `[out:json][timeout:120];way["waterway"="stream"]["name"](${bbox});out geom;`
    try {
      const els = await fetchOverpass(q, label)
      streamEls.push(...els)
    } catch (err) {
      console.error(`  ❌ ${label}: ${err.message}`)
    }
    await sleep(3000)
  }

  const streamsByName = groupByName(streamEls)
  console.log(`  Total unique stream names: ${streamsByName.size}`)
  // Filter: only streams with assembled chain >= 300 points (major tributaries only)
  const majorStreams = new Map()
  for (const [name, ways] of streamsByName) {
    const chains = assembleWays(ways)
    const totalPts = chains.reduce((s, c) => s + c.length, 0)
    if (totalPts >= 300) majorStreams.set(name, { ways, chains, totalPts })
  }
  console.log(`  Major streams (≥300 pts): ${majorStreams.size}\n`)

  // ── STEP 3: Fetch lakes & reservoirs ────────────────────────────────────────
  console.log('── Step 3: Lakes ───────────────────────')
  const lakeEls = []

  for (const [label, bbox] of [['North WA lakes', BBOX_N], ['South WA lakes', BBOX_S]]) {
    const q = `[out:json][timeout:120];way["natural"="water"]["name"](${bbox});out geom;`
    try {
      const els = await fetchOverpass(q, label)
      lakeEls.push(...els)
    } catch (err) {
      console.error(`  ❌ ${label}: ${err.message}`)
    }
    await sleep(3000)
  }

  // Also fetch reservoirs
  for (const [label, bbox] of [['North WA reservoirs', BBOX_N], ['South WA reservoirs', BBOX_S]]) {
    const q = `[out:json][timeout:120];way["landuse"="reservoir"]["name"](${bbox});out geom;`
    try {
      const els = await fetchOverpass(q, label)
      lakeEls.push(...els)
    } catch (err) {
      console.error(`  ❌ ${label}: ${err.message}`)
    }
    await sleep(3000)
  }

  const lakesByName = groupByName(lakeEls)
  // Filter: only named lakes (already filtered by groupByName name requirement)
  // Additionally filter out tiny ponds (< 10 nodes total)
  const majorLakes = new Map()
  for (const [name, ways] of lakesByName) {
    const totalNodes = ways.reduce((s, w) => s + (w.geometry?.length || 0), 0)
    if (totalNodes >= 300) {  // >= 300 nodes = significant lake (not a small pond)
      majorLakes.set(name, ways)
    }
  }
  console.log(`  Significant named lakes/reservoirs (≥300 nodes): ${majorLakes.size}\n`)

  // ── STEP 4: Assemble rivers and apply simplification ────────────────────────
  console.log('── Step 4: Assembling waterways ────────')

  const waterwayMap = {} // name -> { type, polylines }

  // Rivers
  let riverCount = 0
  for (const [name, ways] of riversByName) {
    const chains = assembleWays(ways)
    if (chains.length === 0) continue
    // Keep only the longest chain, aggressively simplified
    const mainChain = chains[0]
    const simplified = mainChain.length > 60 ? simplify(mainChain, 0.0005) : mainChain
    // Skip rivers with too few points after simplification
    if (simplified.length < 3) continue
    waterwayMap[name] = { type: 'river', polylines: [simplified] }
    riverCount++
  }
  console.log(`  Rivers assembled: ${riverCount}`)

  // Streams — skip entirely (too many, too much data)
  let streamCount = 0
  console.log(`  Streams: skipped (${majorStreams.size} candidates — use lazy-load for streams)`)

  // Lakes
  let lakeCount = 0
  for (const [name, ways] of majorLakes) {
    // Merge all ways into polygon outline
    const poly = assembleLakePolygon(ways)
    if (poly.length < 6) continue
    // Very aggressive simplification for lakes
    const simplified = poly.length > 100 ? simplify(poly, 0.0005) : poly
    if (simplified.length < 4) continue
    waterwayMap[name] = { type: 'lake', polylines: [simplified] }
    lakeCount++
  }
  console.log(`  Lakes assembled: ${lakeCount}`)
  console.log(`  Total waterways: ${Object.keys(waterwayMap).length}\n`)

  // ── STEP 5: Extract individual river coords for backwards compat ─────────────
  function getMainChain(name) {
    const entry = waterwayMap[name]
    if (entry && entry.polylines.length > 0) return entry.polylines[0]
    return []
  }

  const SKAGIT_COORDS    = getMainChain('Skagit River')
  const SAUK_COORDS      = getMainChain('Sauk River')
  const NOOKSACK_COORDS  = getMainChain('Nooksack River')
  const STILLAGUAMISH    = getMainChain('Stillaguamish River')
  const SNOHOMISH_COORDS = getMainChain('Snohomish River')
  const SKYKOMISH_COORDS = getMainChain('Skykomish River')

  // Summary of key rivers
  console.log('── Key river points ────────────────────')
  const KEY_RIVERS = [
    'Skagit River', 'Sauk River', 'Nooksack River', 'Stillaguamish River',
    'Snohomish River', 'Skykomish River', 'Columbia River', 'Snake River',
    'Yakima River', 'Wenatchee River', 'Methow River', 'Okanogan River',
    'Cowlitz River', 'Lewis River', 'Chehalis River', 'Green River',
    'Cedar River', 'Puyallup River', 'Nisqually River', 'Duwamish River',
    'Hoh River', 'Quinault River', 'Queets River',
  ]
  for (const r of KEY_RIVERS) {
    const entry = waterwayMap[r]
    if (entry) {
      const total = entry.polylines.reduce((s, c) => s + c.length, 0)
      console.log(`  ${r.padEnd(28)} ${total} pts (${entry.polylines.length} chain${entry.polylines.length > 1 ? 's' : ''})`)
    } else {
      console.log(`  ${r.padEnd(28)} ❌ not found`)
    }
  }

  // ── STEP 6: Write TypeScript file ────────────────────────────────────────────
  console.log('\n── Step 6: Writing TypeScript file ─────')

  const outPath = path.join(__dirname, '..', 'lib', 'river-coords-generated.ts')

  let ts = `// AUTO-GENERATED by scripts/fetch-river-coords.js (v2)
// Source: OpenStreetMap Overpass API — do not edit manually.
// Re-generate: node scripts/fetch-river-coords.js
// Generated: ${new Date().toISOString()}
// Rivers: ${riverCount} | Streams: ${streamCount} | Lakes: ${lakeCount}

export type RiverCoords = [number, number][]

// ─── INDIVIDUAL RIVER EXPORTS (backwards compatibility) ──────────────────────

/** Skagit River — ${SKAGIT_COORDS.length} pts */
export const SKAGIT_COORDS: RiverCoords = ${formatCoords(SKAGIT_COORDS)}

/** Sauk River — ${SAUK_COORDS.length} pts */
export const SAUK_COORDS: RiverCoords = ${formatCoords(SAUK_COORDS)}

/** Nooksack River — ${NOOKSACK_COORDS.length} pts */
export const NOOKSACK_COORDS: RiverCoords = ${formatCoords(NOOKSACK_COORDS)}

/** Stillaguamish River — ${STILLAGUAMISH.length} pts */
export const STILLAGUAMISH_COORDS: RiverCoords = ${formatCoords(STILLAGUAMISH)}

/** Snohomish River — ${SNOHOMISH_COORDS.length} pts */
export const SNOHOMISH_COORDS: RiverCoords = ${formatCoords(SNOHOMISH_COORDS)}

/** Skykomish River — ${SKYKOMISH_COORDS.length} pts */
export const SKYKOMISH_COORDS: RiverCoords = ${formatCoords(SKYKOMISH_COORDS)}

// ─── FULL WA WATERWAYS MAP ────────────────────────────────────────────────────

export type WaterwayType = 'river' | 'lake' | 'stream'

export interface WaterwayEntry {
  type: WaterwayType
  /** Array of polylines (rivers may have multiple channels; lakes are polygon rings) */
  polylines: [number, number][][]
}

/**
 * All named rivers, major streams, and lakes/reservoirs in Washington State.
 * Keys are OSM display names (e.g. "Skagit River", "Lake Washington").
 */
export const WA_WATERWAYS: Record<string, WaterwayEntry> = {
`

  // Sort by type then name for readability
  const sorted = Object.entries(waterwayMap).sort((a, b) => {
    if (a[1].type !== b[1].type) {
      const order = { river: 0, stream: 1, lake: 2 }
      return order[a[1].type] - order[b[1].type]
    }
    return a[0].localeCompare(b[0])
  })

  for (const [name, entry] of sorted) {
    const escaped = name.replace(/'/g, "\\'")
    const totalPts = entry.polylines.reduce((s, c) => s + c.length, 0)
    ts += `  // ${entry.type}: ${totalPts} pts\n`
    ts += `  '${escaped}': { type: '${entry.type}', polylines: ${formatCoordsArray(entry.polylines)} },\n\n`
  }

  ts += `}\n`

  fs.writeFileSync(outPath, ts, 'utf8')
  const fileSizeKB = Math.round(fs.statSync(outPath).size / 1024)
  console.log(`✅ Written to ${outPath} (${fileSizeKB} KB)`)

  console.log('\n════════════════════════════════════════')
  console.log(` Done! ${Object.keys(waterwayMap).length} waterways, ${fileSizeKB} KB`)
  console.log('════════════════════════════════════════')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

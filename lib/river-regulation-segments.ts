/**
 * river-regulation-segments.ts
 *
 * Splits a full river polyline at regulation boundary points and returns
 * segments annotated with their regulation status.
 */

export type RegStatus = 'open' | 'closed' | 'emergency' | 'restricted'

export interface RegBoundary {
  /** Approximate [lat, lng] of the landmark / regulation boundary */
  coord: [number, number]
  /** Status of the segment that STARTS at this boundary */
  statusAfter: RegStatus
  label: string
}

export interface RiverSegment {
  coords: [number, number][]
  status: RegStatus
  label: string
  startLabel: string
  endLabel: string
}

/**
 * Returns the index of the polyline vertex closest to `point`.
 */
export function nearestPointOnPolyline(
  point: [number, number],
  line: [number, number][]
): number {
  let minDist = Infinity
  let minIdx = 0
  for (let i = 0; i < line.length; i++) {
    const d = Math.hypot(line[i][0] - point[0], line[i][1] - point[1])
    if (d < minDist) {
      minDist = d
      minIdx = i
    }
  }
  return minIdx
}

/**
 * Split a full river polyline at each boundary coord.
 *
 * @param fullLine  Full river polyline as [lat, lng][]
 * @param boundaries  Array of regulation boundaries, in river order (upstream→downstream or vice-versa)
 * @param firstSegmentStatus  Status for the segment before the first boundary
 * @param firstSegmentLabel  Label for the initial segment
 */
export function splitRiverByBoundaries(
  fullLine: [number, number][],
  boundaries: RegBoundary[],
  firstSegmentStatus: RegStatus,
  firstSegmentLabel: string
): RiverSegment[] {
  if (fullLine.length === 0) return []
  if (boundaries.length === 0) {
    return [{
      coords: fullLine,
      status: firstSegmentStatus,
      label: firstSegmentLabel,
      startLabel: 'Start',
      endLabel: 'End',
    }]
  }

  // Find nearest vertex index for each boundary
  const splitIndices = boundaries.map(b => ({
    idx: nearestPointOnPolyline(b.coord, fullLine),
    boundary: b,
  }))

  // Sort by index so we split in polyline order
  splitIndices.sort((a, b) => a.idx - b.idx)

  const segments: RiverSegment[] = []
  let prevIdx = 0
  let prevStatus = firstSegmentStatus
  let prevLabel = firstSegmentLabel

  for (let i = 0; i < splitIndices.length; i++) {
    const { idx, boundary } = splitIndices[i]
    if (idx <= prevIdx) continue  // skip duplicates / zero-length segs

    const segCoords = fullLine.slice(prevIdx, idx + 1)
    if (segCoords.length >= 2) {
      const nextBoundaryLabel = boundary.label
      segments.push({
        coords: segCoords,
        status: prevStatus,
        label: prevLabel,
        startLabel: i === 0 ? 'Upstream' : splitIndices[i - 1].boundary.label,
        endLabel: nextBoundaryLabel,
      })
    }

    prevIdx = idx
    prevStatus = boundary.statusAfter
    prevLabel = boundary.label
  }

  // Final segment from last boundary to end
  const lastCoords = fullLine.slice(prevIdx)
  if (lastCoords.length >= 2) {
    segments.push({
      coords: lastCoords,
      status: prevStatus,
      label: prevLabel,
      startLabel: splitIndices[splitIndices.length - 1].boundary.label,
      endLabel: 'Downstream',
    })
  }

  return segments
}

/**
 * Slice a full river polyline between two landmark coords.
 * Used by RiverSectionMapInner to get the accurate trace for a section.
 */
export function sliceRiverBetween(
  fullLine: [number, number][],
  startCoord: [number, number],
  endCoord: [number, number]
): [number, number][] {
  if (fullLine.length === 0) return [startCoord, endCoord]
  const startIdx = nearestPointOnPolyline(startCoord, fullLine)
  const endIdx   = nearestPointOnPolyline(endCoord,   fullLine)
  const lo = Math.min(startIdx, endIdx)
  const hi = Math.max(startIdx, endIdx)
  const slice = fullLine.slice(lo, hi + 1)
  // Preserve direction: if startIdx > endIdx the river flows in reverse order on the polyline
  if (startIdx > endIdx) return [...slice].reverse()
  return slice
}

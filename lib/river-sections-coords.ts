// Coordinate data for Skagit River sections
// Shared between WAMap and FishDetailSheet for interactive section maps.
// Coords are [lat, lng] approximate waypoints.

export type SectionCoords = {
  id: string
  label: string
  startLabel: string
  endLabel: string
  coords: [number, number][]
}

export const SKAGIT_SECTION_COORDS: Record<string, SectionCoords> = {
  'skagit-mouth-to-hwy536': {
    id: 'skagit-mouth-to-hwy536',
    label: 'Mouth → Hwy 536 (Mt. Vernon)',
    startLabel: 'Skagit Mouth',
    endLabel: 'Hwy 536 Bridge',
    coords: [
      [48.380, -122.540],
      [48.390, -122.490],
      [48.402, -122.430],
      [48.414, -122.375],
      [48.4213, -122.3283],
    ],
  },
  'skagit-hwy536-to-gilligan': {
    id: 'skagit-hwy536-to-gilligan',
    label: 'Hwy 536 → Gilligan Creek',
    startLabel: 'Hwy 536 Bridge',
    endLabel: 'Gilligan Creek',
    coords: [
      [48.4213, -122.3283],
      [48.434,  -122.250],
      [48.452,  -122.165],
      [48.472,  -122.093],
      [48.493,  -122.020],
    ],
  },
  'skagit-gilligan-to-dalles': {
    id: 'skagit-gilligan-to-dalles',
    label: 'Gilligan Creek → Dalles Bridge (Concrete)',
    startLabel: 'Gilligan Creek',
    endLabel: 'Dalles Bridge (Concrete)',
    coords: [
      [48.493, -122.020],
      [48.508, -121.948],
      [48.520, -121.870],
      [48.530, -121.800],
      [48.534, -121.750],
    ],
  },
  'skagit-dalles-to-baker-below': {
    id: 'skagit-dalles-to-baker-below',
    label: "Dalles Bridge → 200' Below Baker River",
    startLabel: 'Dalles Bridge (Concrete)',
    endLabel: "200' Below Baker River",
    coords: [
      [48.534, -121.750],
      [48.524, -121.720],
      [48.514, -121.688],
      [48.509, -121.662],
    ],
  },
  'skagit-baker-confluence': {
    id: 'skagit-baker-confluence',
    label: "Baker Confluence Zone (±200')",
    startLabel: "200' Below Baker River",
    endLabel: "200' Above Baker River",
    coords: [
      [48.509, -121.662],
      [48.509, -121.654],
    ],
  },
  'skagit-baker-above-to-rockport': {
    id: 'skagit-baker-above-to-rockport',
    label: "200' Above Baker → Rockport (Hwy 530)",
    startLabel: "200' Above Baker River",
    endLabel: 'Rockport (Hwy 530)',
    coords: [
      [48.509, -121.654],
      [48.502, -121.630],
      [48.494, -121.612],
      [48.489, -121.598],
    ],
  },
  'skagit-rockport-to-marblemount': {
    id: 'skagit-rockport-to-marblemount',
    label: 'Rockport → Marblemount',
    startLabel: 'Rockport (Hwy 530)',
    endLabel: 'Marblemount',
    coords: [
      [48.489, -121.598],
      [48.498, -121.548],
      [48.512, -121.496],
      [48.521, -121.468],
      [48.527, -121.444],
    ],
  },
  'skagit-marblemount-to-newhalem': {
    id: 'skagit-marblemount-to-newhalem',
    label: 'Marblemount → Gorge Powerhouse (Newhalem)',
    startLabel: 'Marblemount',
    endLabel: 'Gorge Powerhouse (Newhalem)',
    coords: [
      [48.527, -121.444],
      [48.548, -121.395],
      [48.578, -121.348],
      [48.620, -121.298],
      [48.655, -121.264],
      [48.678, -121.244],
    ],
  },
}

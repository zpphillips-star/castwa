// lib/water-paths.ts
// Real geographic waypoints for WA water bodies rendered on the SVG map.
// Coordinate transform (viewBox 0 0 600 380):
//   x = (lng + 124.73) * 76.83
//   y = (49.00 - lat) * 109.83

export type WaterPathType = 'river' | 'lake' | 'marine'

export interface WaterPath {
  id: string
  type: WaterPathType
  coords: [number, number][]  // [lat, lng] pairs
}

export const WATER_PATHS: WaterPath[] = [
  // ── Rivers & Streams ──────────────────────────────────────────────────────

  // Columbia: Northport → Grand Coulee → Vantage → Pasco → Kennewick → Portland
  { id: 'columbia', type: 'river', coords: [
    [48.91, -117.73], [48.55, -118.15], [48.10, -118.35],
    [47.94, -118.98], [47.50, -119.40], [46.93, -119.97],
    [46.24, -119.09], [46.21, -119.21], [45.96, -120.20],
    [45.74, -121.52], [45.64, -122.40], [45.64, -122.59],
  ]},

  // Snake: Idaho border → Clarkston → Lyons Ferry → Pasco
  { id: 'snake', type: 'river', coords: [
    [46.43, -116.96], [46.42, -117.05], [46.59, -118.23],
    [46.47, -118.78], [46.24, -119.07],
  ]},

  // Skagit: Newhalem → Concrete → Burlington/Puget Sound
  { id: 'skagit', type: 'river', coords: [
    [48.68, -121.23], [48.63, -121.48], [48.55, -121.75],
    [48.54, -121.99], [48.50, -122.20], [48.47, -122.42],
  ]},

  // Sauk: Glacier Peak → join Skagit at Rockport
  { id: 'sauk', type: 'river', coords: [
    [48.11, -121.13], [48.22, -121.24], [48.35, -121.38],
    [48.49, -121.56],
  ]},

  // Nooksack: Mt Baker → Bellingham Bay
  { id: 'nooksack', type: 'river', coords: [
    [48.84, -121.68], [48.82, -121.90], [48.80, -122.10],
    [48.79, -122.30], [48.78, -122.55],
  ]},

  // Stillaguamish: Granite Falls → Port Susan
  { id: 'stillaguamish', type: 'river', coords: [
    [48.08, -121.97], [48.10, -122.10], [48.15, -122.22],
    [48.21, -122.39],
  ]},

  // Skykomish: Stevens Pass → Monroe
  { id: 'skykomish', type: 'river', coords: [
    [47.74, -121.09], [47.78, -121.35], [47.82, -121.62],
    [47.85, -121.97],
  ]},

  // Snoqualmie: Snoqualmie Pass → Fall City → Monroe
  { id: 'snoqualmie', type: 'river', coords: [
    [47.43, -121.41], [47.47, -121.60], [47.52, -121.75],
    [47.56, -121.88], [47.68, -121.93], [47.85, -121.97],
  ]},

  // Snohomish: Monroe → Everett
  { id: 'snohomish', type: 'river', coords: [
    [47.86, -121.97], [47.90, -122.08], [47.94, -122.21],
  ]},

  // Green: Green River Gorge → Auburn → Tukwila
  { id: 'green', type: 'river', coords: [
    [47.27, -121.95], [47.28, -122.08], [47.30, -122.22],
    [47.38, -122.25], [47.47, -122.27],
  ]},

  // Cedar: Cedar Falls → Renton
  { id: 'cedar', type: 'river', coords: [
    [47.42, -121.74], [47.44, -121.92], [47.47, -122.06],
    [47.48, -122.19],
  ]},

  // Puyallup: Mt Rainier → Puyallup → Tacoma
  { id: 'puyallup', type: 'river', coords: [
    [46.95, -121.75], [47.03, -121.90], [47.10, -122.05],
    [47.19, -122.29], [47.26, -122.41],
  ]},

  // Nisqually: Nisqually Glacier → Nisqually delta
  { id: 'nisqually', type: 'river', coords: [
    [46.85, -121.73], [46.90, -121.95], [46.95, -122.15],
    [47.02, -122.42], [47.07, -122.71],
  ]},

  // Carbon: Mt Rainier → Buckley → join Puyallup
  { id: 'carbon', type: 'river', coords: [
    [46.96, -121.82], [47.05, -121.88], [47.16, -121.99],
    [47.20, -122.14],
  ]},

  // White: Emmons Glacier → Enumclaw → join Puyallup
  { id: 'white', type: 'river', coords: [
    [46.86, -121.68], [47.00, -121.80], [47.12, -121.88],
    [47.20, -121.99],
  ]},

  // Cowlitz: Mt Rainier → Randle → Longview
  { id: 'cowlitz', type: 'river', coords: [
    [46.72, -121.89], [46.60, -121.95], [46.53, -121.96],
    [46.38, -122.35], [46.20, -122.78], [46.11, -122.92],
  ]},

  // Lewis: Mt Adams → Ariel → Woodland
  { id: 'lewis', type: 'river', coords: [
    [46.15, -121.52], [46.08, -121.80], [45.99, -122.20],
    [45.99, -122.56], [45.90, -122.75],
  ]},

  // Chehalis: Pe Ell → Montesano → Aberdeen/Grays Harbor
  { id: 'chehalis', type: 'river', coords: [
    [46.57, -123.30], [46.70, -123.40], [46.85, -123.50],
    [46.98, -123.60], [46.97, -123.82],
  ]},

  // Hoh: Blue Glacier → Pacific coast
  { id: 'hoh', type: 'river', coords: [
    [47.83, -123.71], [47.82, -123.90], [47.80, -124.10],
    [47.78, -124.25], [47.75, -124.44],
  ]},

  // Bogachiel: Olympic Mtns → Forks
  { id: 'bogachiel', type: 'river', coords: [
    [47.90, -124.00], [47.92, -124.12], [47.94, -124.25],
    [47.95, -124.40],
  ]},

  // Sol Duc: Sol Duc Hot Springs → Forks (joins Bogachiel → Quillayute)
  { id: 'sol-duc', type: 'river', coords: [
    [47.97, -123.85], [47.99, -123.98], [48.02, -124.12],
    [48.05, -124.31],
  ]},

  // Quinault: Lake Quinault → Pacific coast
  { id: 'quinault', type: 'river', coords: [
    [47.45, -123.86], [47.42, -123.95], [47.40, -124.05],
    [47.37, -124.17],
  ]},

  // Queets: Olympics → Pacific coast
  { id: 'queets', type: 'river', coords: [
    [47.57, -123.70], [47.56, -123.88], [47.55, -124.10],
    [47.53, -124.35],
  ]},

  // Humptulips: Olympics → Grays Harbor
  { id: 'humptulips', type: 'river', coords: [
    [47.22, -123.77], [47.22, -123.85], [47.23, -123.96],
  ]},

  // Dungeness: Olympics → Strait of Juan de Fuca
  { id: 'dungeness', type: 'river', coords: [
    [47.94, -123.13], [48.03, -123.12], [48.13, -123.12],
  ]},

  // Elwha: Hurricane Ridge → Port Angeles
  { id: 'elwha', type: 'river', coords: [
    [47.97, -123.58], [48.03, -123.57], [48.10, -123.56],
  ]},

  // Skokomish: Olympics → Hood Canal
  { id: 'skokomish', type: 'river', coords: [
    [47.42, -123.23], [47.38, -123.18], [47.34, -123.13],
  ]},

  // Wenatchee: Lake Wenatchee → Columbia at Wenatchee
  { id: 'wenatchee', type: 'river', coords: [
    [47.82, -120.86], [47.72, -120.73], [47.60, -120.60],
    [47.50, -120.48], [47.42, -120.31],
  ]},

  // Methow: Mazama → Pateros on Columbia
  { id: 'methow', type: 'river', coords: [
    [48.58, -120.40], [48.40, -120.30], [48.20, -120.18],
    [47.97, -119.97],
  ]},

  // Entiat: mountains → Columbia at Entiat
  { id: 'entiat', type: 'river', coords: [
    [47.93, -120.42], [47.80, -120.32], [47.67, -120.22],
  ]},

  // Okanogan: Oroville → Brewster/Columbia
  { id: 'okanogan', type: 'river', coords: [
    [48.94, -119.43], [48.70, -119.50], [48.40, -119.60],
    [48.10, -119.65], [47.97, -119.78],
  ]},

  // Yakima: Kittitas → Selah → Yakima → Benton City → Kennewick/Columbia
  { id: 'yakima', type: 'river', coords: [
    [46.98, -120.44], [46.80, -120.50], [46.66, -120.53],
    [46.60, -120.51], [46.52, -120.21], [46.40, -119.85],
    [46.26, -119.49], [46.21, -119.22],
  ]},

  // Klickitat: Goldendale → White Salmon/Columbia
  { id: 'klickitat', type: 'river', coords: [
    [45.82, -120.83], [45.80, -121.05], [45.74, -121.30],
    [45.72, -121.54],
  ]},

  // Deschutes (WA): short river in Thurston County
  { id: 'deschutes', type: 'river', coords: [
    [46.97, -122.95], [46.99, -122.90],
  ]},

  // ── Lakes ─────────────────────────────────────────────────────────────────

  // Lake Sammamish: roughly oval NE of Bellevue
  { id: 'sammamish', type: 'lake', coords: [
    [47.65, -122.10], [47.65, -121.97],
    [47.57, -121.97], [47.57, -122.10],
  ]},

  // Lake Washington: elongated N-S
  { id: 'washington', type: 'lake', coords: [
    [47.73, -122.19], [47.73, -122.24],
    [47.51, -122.26], [47.49, -122.28],
    [47.49, -122.22], [47.55, -122.20],
  ]},

  // Lake Chelan: long thin lake running NW-SE
  { id: 'chelan', type: 'lake', coords: [
    [48.18, -120.42], [48.05, -120.28],
    [47.90, -120.12], [47.80, -120.07],
    [47.84, -120.02], [47.94, -120.16],
    [48.08, -120.33], [48.14, -120.47],
  ]},

  // Lake Roosevelt (Franklin D. Roosevelt): reservoir behind Grand Coulee
  { id: 'roosevelt', type: 'lake', coords: [
    [47.94, -118.98], [48.10, -118.72],
    [48.30, -118.50], [48.50, -118.28],
    [48.71, -118.09], [48.68, -118.04],
    [48.44, -118.20], [48.24, -118.44],
    [48.04, -118.67], [47.90, -118.93],
  ]},

  // Banks Lake: elongated N-S reservoir
  { id: 'banks', type: 'lake', coords: [
    [47.90, -119.37], [47.90, -119.28],
    [47.40, -119.28], [47.40, -119.37],
  ]},

  // ── Marine ────────────────────────────────────────────────────────────────

  // Puget Sound: simplified outline polygon
  { id: 'puget', type: 'marine', coords: [
    [47.30, -122.55], [47.30, -122.40],
    [47.60, -122.35], [47.80, -122.40],
    [48.10, -122.55], [48.50, -122.80],
    [48.10, -122.90], [47.80, -122.75],
    [47.60, -122.65],
  ]},

  // Hood Canal: narrow inlet on west side of Puget Sound
  { id: 'hood', type: 'marine', coords: [
    [47.89, -122.64], [47.86, -122.55],
    [47.65, -122.70], [47.44, -122.90],
    [47.34, -123.12], [47.39, -123.15],
    [47.53, -122.95], [47.73, -122.73],
  ]},
]

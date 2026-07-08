/**
 * Build improved marine area polygons for WAMap.tsx
 * 
 * Key geographic facts:
 * - Deception Pass: 48.41N, 122.62W
 * - Whidbey Island: east coast ~122.35-122.55W, west coast ~122.70-122.95W
 *   - Possession Point (S tip, E side): ~47.93N, 122.38W
 *   - Clinton (ferry dock, E side): 47.98N, 122.35W
 *   - Oak Harbor (N, bay on NE): 48.29N, 122.64W (in bay, E coast ~122.53W at this lat)
 *   - Admiralty Head (W tip, near S): 48.06N, 122.69W
 *   - Partridge Point (NW tip): ~48.21N, 122.91W
 * - Camano Island: 48.04-48.35N (inside 48.04-122.54 to 48.35-122.40)
 *   - convex hull: W coast ~122.52-122.60W, E coast ~122.28-122.40W
 * - Stanwood (mainland NE, east of Camano): 48.24N, 122.35W
 * - Mukilteo (mainland, across from Clinton): 47.95N, 122.30W
 * - Port Townsend (NE Olympic Peninsula): 48.12N, 122.77W
 * - Point No Point (Kitsap, N end): 47.91N, 122.53W
 *
 * Marine area polygons — coordinates trace the OUTER water boundary.
 * Camano Island (inside MA 8-1) will be slightly tinted but at 0.12 opacity it's fine.
 */

// MA 8-1: Deception Pass + Skagit Bay + Saratoga Passage + Port Susan
// Outer perimeter tracing clockwise: 
//   S boundary: Possession Point → Mukilteo/Tulalip
//   E boundary: mainland shore going N to Anacortes/Fidalgo
//   N boundary: across Skagit Bay to Deception Pass
//   W boundary: Whidbey east coast going S back to Possession Point
const MA_8_1 = [
  [47.93, -122.38],  // Possession Point (S Whidbey, SE start)
  [47.95, -122.25],  // Mukilteo (mainland, S boundary E end)
  [48.05, -122.22],  // Tulalip area (E boundary S)
  [48.25, -122.30],  // Stanwood/mainland (E boundary mid) — note: actual mainland is ~122.35, keeping tight
  [48.37, -122.35],  // N mainland near Skagit delta (NE)
  [48.42, -122.46],  // NE near Anacortes/Fidalgo SE coast
  [48.42, -122.62],  // Deception Pass N (NW corner)
  [48.25, -122.60],  // Whidbey NE coast (W boundary N)
  [48.10, -122.52],  // Whidbey E coast mid (W boundary mid)
  [47.97, -122.42],  // Near Clinton (W boundary S, E coast of Whidbey)
];

// MA 8-2: Possession Sound / Port Gardner (near Everett)
// Between S Whidbey coast and Everett/Snohomish shore
// N: Possession Point area; S: ~Edmonds; E: mainland; W: S Whidbey / Admiralty approach
const MA_8_2 = [
  [47.93, -122.38],  // Possession Point (NW, SE Whidbey)
  [47.95, -122.25],  // Mukilteo (NE, across from Whidbey)
  [47.80, -122.25],  // S Everett (SE)
  [47.75, -122.40],  // Edmonds area (S boundary)
  [47.80, -122.52],  // SW (approaching S Whidbey west coast / Admiralty)
  [47.90, -122.55],  // W (near Bush Point/S Whidbey W coast)
];

// MA 9: Admiralty Inlet
// Between NW Whidbey (W) and Port Townsend/Quimper Peninsula (E)
// N: Partridge Point → Point Wilson; S: Point No Point → Possession Point
const MA_9 = [
  [48.20, -122.91],  // Partridge Point area (N Whidbey, NW corner)
  [48.14, -122.75],  // Point Wilson (Port Townsend, NE corner)
  [47.93, -122.75],  // Quimper Peninsula / Port Hadlock going S (E boundary)
  [47.88, -122.53],  // Port Ludlow area (SE, near Kitsap)
  [47.91, -122.53],  // Point No Point (S boundary E end)
  [47.90, -122.55],  // Point No Point W (S boundary)
  [47.88, -122.62],  // W (between Kitsap and Whidbey)
  [47.97, -122.65],  // W boundary (S Whidbey W coast, near Fort Casey)
  [48.06, -122.69],  // Admiralty Head (W Whidbey W coast)
  [48.20, -122.91],  // Back to Partridge Point (close polygon)
];

// MA 10: Central Puget Sound (Seattle/Bremerton basin)
// N: Point No Point → Edmonds; S: Tacoma Narrows entrance; E: Seattle/Tacoma shore; W: Kitsap
// Note: Bainbridge Island is inside but fillOpacity 0.12 means underlying map shows through
const MA_10 = [
  [47.91, -122.53],  // Point No Point (N boundary W)
  [47.80, -122.25],  // Edmonds/Lynnwood shore (N boundary E)
  [47.50, -122.25],  // Tacoma N shore (SE corner, S boundary E)
  [47.50, -122.58],  // Gig Harbor entrance (S boundary W)
  [47.62, -122.78],  // W Kitsap / Bremerton (W boundary S)
  [47.78, -122.90],  // Belfair area (SW Kitsap)
  [47.92, -122.70],  // N Kitsap near Kingston (W boundary N)
];

// MA 11: South Puget Sound (Tacoma Narrows south to Olympia)
// Multiple fingers: Carr Inlet, Case Inlet, Nisqually Reach, Budd Inlet
// Use a simplified outer perimeter
const MA_11 = [
  [47.50, -122.58],  // Tacoma Narrows W (N boundary W)
  [47.50, -122.25],  // Tacoma (N boundary E)
  [47.10, -122.45],  // SE (Nisqually area)
  [47.05, -122.55],  // S (Olympia / Budd Inlet)
  [47.18, -122.85],  // SW (Shelton area / Hammersley Inlet)
  [47.35, -122.95],  // W (Hood Canal region boundary)
  [47.40, -122.78],  // NW (S Kitsap / Gig Harbor area)
];

console.log('MA_8_1:', JSON.stringify(MA_8_1));
console.log('MA_8_2:', JSON.stringify(MA_8_2));
console.log('MA_9:', JSON.stringify(MA_9));
console.log('MA_10:', JSON.stringify(MA_10));
console.log('MA_11:', JSON.stringify(MA_11));

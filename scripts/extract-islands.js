const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/zaphilli/OneDrive/castwa/coastline-raw.json'));

function convexHull(pts) {
  if (pts.length < 3) return pts;
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  function cross(O, A, B) {
    return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
  }
  const n = pts.length;
  const hull = [];
  for (let i = 0; i < n; i++) {
    while (hull.length >= 2 && cross(hull[hull.length-2], hull[hull.length-1], pts[i]) <= 0) hull.pop();
    hull.push(pts[i]);
  }
  for (let i = n - 2, t = hull.length + 1; i >= 0; i--) {
    while (hull.length >= t && cross(hull[hull.length-2], hull[hull.length-1], pts[i]) <= 0) hull.pop();
    hull.push(pts[i]);
  }
  hull.pop();
  return hull;
}

function decimatePoints(pts, maxPts) {
  if (pts.length <= maxPts) return pts;
  const step = Math.floor(pts.length / maxPts);
  return pts.filter((_, i) => i % step === 0);
}

function getCoastlinePts(minLat, maxLat, minLon, maxLon) {
  const pts = [];
  data.elements.forEach(way => {
    if (!way.geometry) return;
    way.geometry.forEach(pt => {
      if (pt.lat >= minLat && pt.lat <= maxLat && pt.lon >= minLon && pt.lon <= maxLon) {
        pts.push([pt.lat, pt.lon]);
      }
    });
  });
  return pts;
}

function r4(x) { return Math.round(x * 10000) / 10000; }
function fmt(pts) { return JSON.stringify(pts.map(p => [r4(p[0]), r4(p[1])])); }

// Whidbey Island: roughly 47.93-48.45N, 122.35-122.95W
const whidbeyPts = getCoastlinePts(47.90, 48.47, -122.95, -122.30);
console.log('Whidbey coastline pts:', whidbeyPts.length);
const whidbeyHull = convexHull([...whidbeyPts]);
const whidbeySimple = decimatePoints(whidbeyHull, 30);
console.log('Whidbey hull pts:', whidbeySimple.length);
console.log('WHIDBEY_HULL=' + fmt(whidbeySimple));

// Camano Island: roughly 48.05-48.33N, 122.28-122.60W
const camanoPts = getCoastlinePts(48.04, 48.35, -122.60, -122.28);
console.log('Camano coastline pts:', camanoPts.length);
const camanoHull = convexHull([...camanoPts]);
const camanoSimple = decimatePoints(camanoHull, 20);
console.log('Camano hull pts:', camanoSimple.length);
console.log('CAMANO_HULL=' + fmt(camanoSimple));

// Kitsap Peninsula / Central Puget Sound area
const kitsapPts = getCoastlinePts(47.35, 47.95, -122.90, -122.40);
console.log('Kitsap area pts:', kitsapPts.length);

// South Puget Sound (MA 11 area)
const southPts = getCoastlinePts(47.00, 47.50, -122.95, -122.35);
console.log('South PS pts:', southPts.length);

// Bainbridge Island area (within MA 10)
const bainbridgePts = getCoastlinePts(47.56, 47.75, -122.58, -122.45);
console.log('Bainbridge area pts:', bainbridgePts.length);

// Extract bounding extents for each major water body to understand layout
// Admiralty Inlet (MA 9): between Port Townsend (E) and Whidbey/Kitsap (W)
// roughly 47.75-48.20N, 122.65-122.95W
const admiraltyPts = getCoastlinePts(47.75, 48.20, -122.98, -122.60);
console.log('Admiralty Inlet area pts:', admiraltyPts.length);
const admHull = convexHull([...admiraltyPts]);
const admSimple = decimatePoints(admHull, 20);
console.log('ADMIRALTY_COASTLINE_HULL=' + fmt(admSimple));

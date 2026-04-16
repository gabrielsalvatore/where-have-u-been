// Server-side only. Converts lat/lng to country using point-in-polygon
// against the world-atlas 110m topojson (no external API needed).
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { COUNTRY_DATA } from './countryData'

type Ring = number[][]
type GeoFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>

let featuresCache: GeoFeature[] | null = null

function getFeatures(): GeoFeature[] {
  if (featuresCache) return featuresCache

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const topo = require('world-atlas/countries-110m.json') as Topology
  const collection = feature(topo, topo.objects['countries'] as GeometryCollection)
  featuresCache = collection.features as GeoFeature[]
  return featuresCache
}

function pointInRing(px: number, py: number, ring: Ring): boolean {
  let inside = false
  const n = ring.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function pointInPolygon(lng: number, lat: number, coords: Ring[][]): boolean {
  // coords[0][0] = outer ring, coords[0][1..] = holes
  const outer = coords[0][0]
  if (!pointInRing(lng, lat, outer)) return false
  for (let h = 1; h < coords[0].length; h++) {
    if (pointInRing(lng, lat, coords[0][h])) return false // inside a hole
  }
  return true
}

function pointInGeometry(
  lng: number,
  lat: number,
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon
): boolean {
  if (geom.type === 'Polygon') {
    return pointInPolygon(lng, lat, [geom.coordinates as Ring[]])
  }
  // MultiPolygon: coordinates is Ring[][][]
  for (const poly of geom.coordinates as Ring[][]) {
    if (!pointInRing(lng, lat, poly[0])) continue
    let inHole = false
    for (let h = 1; h < poly.length; h++) {
      if (pointInRing(lng, lat, poly[h])) { inHole = true; break }
    }
    if (!inHole) return true
  }
  return false
}

// Cache results rounded to 0.1° (~11 km) — good enough for country detection
const lookupCache = new Map<string, { id: string; name: string; alpha2: string } | null>()

export function getCountryForCoord(
  lat: number,
  lng: number
): { id: string; name: string; alpha2: string } | null {
  const key = `${lat.toFixed(1)},${lng.toFixed(1)}`
  if (lookupCache.has(key)) return lookupCache.get(key)!

  const features = getFeatures()
  for (const f of features) {
    if (!f.geometry) continue
    if (pointInGeometry(lng, lat, f.geometry)) {
      const id = String(f.id)
      const info = COUNTRY_DATA[id]
      const result = info ? { id, ...info } : { id, name: `Country ${id}`, alpha2: 'XX' }
      lookupCache.set(key, result)
      return result
    }
  }

  lookupCache.set(key, null)
  return null
}

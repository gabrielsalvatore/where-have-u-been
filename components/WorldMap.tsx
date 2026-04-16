'use client'

import { useState, useCallback } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import type { CountryVisit } from '@/lib/types'

// Use the CDN so the 400 KB TopoJSON doesn't get double-bundled
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface Props {
  visitedCountries: Map<string, CountryVisit>
  selectedYear: number | 'all'
}

interface Tooltip {
  name: string
  photoCount: number
  years: number[]
  x: number
  y: number
}

function getColor(country: CountryVisit | undefined, year: number | 'all'): string {
  if (!country) return '#1a2235'

  if (year !== 'all') {
    return country.years.includes(year) ? '#f59e0b' : '#1e3a5f'
  }

  // "All time" — intensity by photo count
  const intensity = Math.min(country.photoCount / 100, 1)
  if (intensity < 0.2) return '#d97706'
  if (intensity < 0.5) return '#f59e0b'
  return '#fbbf24'
}

export default function WorldMap({ visitedCountries, selectedYear }: Props) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 })

  const handleMouseEnter = useCallback(
    (geoId: string, evt: React.MouseEvent) => {
      const country = visitedCountries.get(geoId)
      if (!country) return
      setTooltip({
        name: country.name,
        photoCount: country.photoCount,
        years: [...country.years].sort(),
        x: evt.clientX,
        y: evt.clientY,
      })
    },
    [visitedCountries]
  )

  const handleMouseMove = useCallback((evt: React.MouseEvent) => {
    setTooltip(prev => (prev ? { ...prev, x: evt.clientX, y: evt.clientY } : null))
  }, [])

  return (
    <div className="relative w-full h-full" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 153 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={({ zoom, coordinates }) => setPosition({ zoom, coordinates })}
          minZoom={1}
          maxZoom={8}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const geoId = String(geo.id)
                const country = visitedCountries.get(geoId)
                const fill = getColor(country, selectedYear)
                const isVisited = !!country

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#0d1117"
                    strokeWidth={0.4}
                    onMouseEnter={evt => handleMouseEnter(geoId, evt)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: isVisited ? '#fde68a' : '#243044',
                        outline: 'none',
                        cursor: isVisited ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom hint */}
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-600 pointer-events-none select-none">
        Scroll to zoom · drag to pan
      </p>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl text-sm"
          style={{ left: tooltip.x + 14, top: tooltip.y - 40 }}
        >
          <p className="font-semibold text-white">{tooltip.name}</p>
          <p className="text-amber-400">{tooltip.photoCount} photos</p>
          <p className="text-gray-400 text-xs">{tooltip.years.join(', ')}</p>
        </div>
      )}
    </div>
  )
}

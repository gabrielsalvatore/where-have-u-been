'use client'

import type { CountryVisit } from '@/lib/types'
import { TOTAL_COUNTRIES_IN_WORLD } from '@/lib/countryData'

interface Props {
  visitedCountries: Map<string, CountryVisit>
  allCountries: Map<string, CountryVisit> // always all-time, for "new" detection
  selectedYear: number | 'all'
  totalPhotos: number
}

export default function StatsPanel({ visitedCountries, allCountries, selectedYear, totalPhotos }: Props) {
  const count = visitedCountries.size
  const pct = ((count / TOTAL_COUNTRIES_IN_WORLD) * 100).toFixed(1)

  // Countries visited for the first time in the selected year
  // (compare against allCountries so we use the true all-time first visit)
  const newCountries =
    selectedYear !== 'all'
      ? [...visitedCountries.values()].filter(c => {
          const allTime = allCountries.get(c.id)
          return allTime?.firstVisit === selectedYear
        }).length
      : 0

  const photosInView = [...visitedCountries.values()].reduce((s, c) => s + c.photoCount, 0)

  return (
    <div className="flex flex-col gap-3">
      {/* Big numbers */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Countries" value={String(count)} />
        <Stat label="% of world" value={`${pct}%`} />
        <Stat label="Photos mapped" value={fmt(photosInView)} />
        {selectedYear !== 'all' && (
          <Stat label={`New in ${selectedYear}`} value={String(newCountries)} accent />
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{count} visited</span>
          <span>{TOTAL_COUNTRIES_IN_WORLD - count} remaining</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

'use client'

import type { CountryVisit } from '@/lib/types'

interface Props {
  visitedCountries: Map<string, CountryVisit>
  selectedYear: number | 'all'
}

export default function CountryList({ visitedCountries, selectedYear }: Props) {
  const sorted = [...visitedCountries.values()].sort((a, b) => b.photoCount - a.photoCount)

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-gray-600 text-center py-4">
        {selectedYear === 'all' ? 'No countries found yet.' : `No photos in ${selectedYear}.`}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-full pr-1">
      {sorted.map(country => (
        <div
          key={country.id}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors group"
        >
          <span className="text-xl leading-none shrink-0">{country.flag}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{country.name}</p>
            <p className="text-xs text-gray-500">{country.years.sort().join(', ')}</p>
          </div>
          <span className="text-xs text-amber-500 tabular-nums shrink-0">
            {country.photoCount}
          </span>
        </div>
      ))}
    </div>
  )
}

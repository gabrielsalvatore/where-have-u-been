'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import SourceSelector from '@/components/SourceSelector'
import YearFilter from '@/components/YearFilter'
import StatsPanel from '@/components/StatsPanel'
import CountryList from '@/components/CountryList'
import ScanProgress from '@/components/ScanProgress'
import type { PhotoData, CountryVisit, SourceType, ScanStatus, SSEMessage } from '@/lib/types'
import { getFlag } from '@/lib/countryData'

// WorldMap uses react-simple-maps which is client-only and references window
const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false })

export default function Home() {
  const [source, setSource] = useState<SourceType>('library')
  const [customPath, setCustomPath] = useState('')
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const esRef = useRef<EventSource | null>(null)

  // Derive country visits for the selected year
  const visitedCountries = useMemo(() => {
    const map = new Map<string, CountryVisit>()
    const filtered =
      selectedYear === 'all' ? photos : photos.filter(p => p.year === selectedYear)

    for (const photo of filtered) {
      if (!photo.countryId) continue
      const existing = map.get(photo.countryId)
      if (existing) {
        existing.photoCount++
        if (!existing.years.includes(photo.year)) existing.years.push(photo.year)
      } else {
        map.set(photo.countryId, {
          id: photo.countryId,
          name: photo.countryName,
          alpha2: photo.countryAlpha2,
          flag: getFlag(photo.countryAlpha2),
          years: [photo.year],
          photoCount: 1,
          firstVisit: photo.year,
        })
      }
    }

    return map
  }, [photos, selectedYear])

  // All-time country map (for "new country" detection in StatsPanel)
  const allTimeCountries = useMemo(() => {
    const map = new Map<string, CountryVisit>()
    for (const photo of photos) {
      if (!photo.countryId) continue
      const existing = map.get(photo.countryId)
      if (existing) {
        existing.photoCount++
        if (photo.year < existing.firstVisit) existing.firstVisit = photo.year
        if (!existing.years.includes(photo.year)) existing.years.push(photo.year)
      } else {
        map.set(photo.countryId, {
          id: photo.countryId,
          name: photo.countryName,
          alpha2: photo.countryAlpha2,
          flag: getFlag(photo.countryAlpha2),
          years: [photo.year],
          photoCount: 1,
          firstVisit: photo.year,
        })
      }
    }
    return map
  }, [photos])

  const availableYears = useMemo(() => {
    const years = new Set(photos.map(p => p.year))
    return [...years].sort((a, b) => b - a)
  }, [photos])

  const handleScan = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    setPhotos([])
    setTotal(0)
    setProcessed(0)
    setError(null)
    setStatus('scanning')
    setProgressMsg('Connecting…')

    const params = new URLSearchParams({ source })
    if (source === 'folder') params.set('path', customPath.trim())

    const es = new EventSource(`/api/scan?${params}`)
    esRef.current = es

    es.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data) as SSEMessage

      switch (msg.type) {
        case 'status':
          setProgressMsg(msg.message)
          break
        case 'total':
          setTotal(msg.count)
          setProgressMsg(`Found ${msg.count.toLocaleString()} photos`)
          break
        case 'photo':
          setPhotos(prev => [...prev, msg.data])
          break
        case 'progress':
          setProcessed(msg.processed)
          break
        case 'done':
          setStatus('done')
          es.close()
          break
        case 'error':
          setError(msg.message)
          setStatus('error')
          es.close()
          break
      }
    }

    es.onerror = () => {
      setError('Connection to server lost. Make sure `npm run dev` is running.')
      setStatus('error')
      es.close()
    }
  }, [source, customPath])

  const scanning = status === 'scanning'

  return (
    <div className="flex flex-col h-screen bg-[#080b12] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0 gap-4">
        <h1 className="text-sm font-bold tracking-widest uppercase text-amber-400 shrink-0">
          Where Have U Been
        </h1>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <SourceSelector
            source={source}
            customPath={customPath}
            onSourceChange={setSource}
            onPathChange={setCustomPath}
            onScan={handleScan}
            scanning={scanning}
          />
        </div>

        <YearFilter years={availableYears} selected={selectedYear} onChange={setSelectedYear} />
      </header>

      {/* Progress bar (only while scanning) */}
      {scanning && (
        <div className="px-5 py-2 border-b border-gray-800 shrink-0">
          <ScanProgress processed={processed} total={total} message={progressMsg} />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-5 py-2 bg-red-950 border-b border-red-900 text-red-300 text-sm shrink-0">
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Map (fills available space) */}
        <main className="flex-1 relative min-w-0">
          {photos.length === 0 && status === 'idle' ? (
            <EmptyState />
          ) : (
            <WorldMap visitedCountries={visitedCountries} selectedYear={selectedYear} />
          )}
        </main>

        {/* Sidebar */}
        {(photos.length > 0 || scanning) && (
          <aside className="w-72 border-l border-gray-800 flex flex-col gap-4 p-4 overflow-hidden">
            <StatsPanel
              visitedCountries={visitedCountries}
              allCountries={allTimeCountries}
              selectedYear={selectedYear}
              totalPhotos={photos.length}
            />
            <div className="border-t border-gray-800" />
            <div className="flex-1 min-h-0 overflow-hidden">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Countries</p>
              <CountryList visitedCountries={visitedCountries} selectedYear={selectedYear} />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <div className="text-6xl">🗺️</div>
      <h2 className="text-xl font-semibold text-white">Ready to explore your world</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Choose a source above and hit <span className="text-amber-400">Scan Photos</span> to map
        every place your camera has taken you.
      </p>
    </div>
  )
}

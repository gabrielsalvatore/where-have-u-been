'use client'

import { useRef } from 'react'
import type { SourceType } from '@/lib/types'

interface Props {
  source: SourceType
  customPath: string
  onSourceChange: (s: SourceType) => void
  onPathChange: (p: string) => void
  onScan: () => void
  scanning: boolean
}

export default function SourceSelector({
  source,
  customPath,
  onSourceChange,
  onPathChange,
  onScan,
  scanning,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const toggle = () => onSourceChange(source === 'library' ? 'folder' : 'library')

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Toggle */}
      <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-1 py-1">
        <button
          onClick={() => onSourceChange('library')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            source === 'library'
              ? 'bg-amber-500 text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Photos Library
        </button>
        <button
          onClick={() => onSourceChange('folder')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            source === 'folder'
              ? 'bg-amber-500 text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Custom Folder
        </button>
      </div>

      {/* Folder path input */}
      {source === 'folder' && (
        <input
          ref={inputRef}
          type="text"
          value={customPath}
          onChange={e => onPathChange(e.target.value)}
          placeholder="/Users/you/Pictures/Vacation 2024"
          className="flex-1 min-w-64 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
        />
      )}

      {/* Scan button */}
      <button
        onClick={onScan}
        disabled={scanning || (source === 'folder' && !customPath.trim())}
        className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {scanning ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Scanning…
          </>
        ) : (
          'Scan Photos'
        )}
      </button>
    </div>
  )
}

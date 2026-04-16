'use client'

interface Props {
  years: number[]
  selected: number | 'all'
  onChange: (y: number | 'all') => void
}

export default function YearFilter({ years, selected, onChange }: Props) {
  if (years.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange('all')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
          selected === 'all'
            ? 'bg-amber-500 text-black'
            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
        }`}
      >
        All time
      </button>
      {years.map(y => (
        <button
          key={y}
          onClick={() => onChange(y)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            selected === y
              ? 'bg-amber-500 text-black'
              : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  )
}

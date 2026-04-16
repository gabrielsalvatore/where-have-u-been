'use client'

interface Props {
  processed: number
  total: number
  message: string
}

export default function ScanProgress({ processed, total, message }: Props) {
  const pct = total > 0 ? (processed / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 tabular-nums shrink-0 w-28 text-right">
        {total > 0 ? `${processed.toLocaleString()} / ${total.toLocaleString()}` : message}
      </span>
    </div>
  )
}

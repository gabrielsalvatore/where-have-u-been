import { NextRequest } from 'next/server'
import { findImageFiles, extractExif, getLibraryPath } from '@/lib/scanner'
import { getCountryForCoord } from '@/lib/geocoder'
import { getFlag } from '@/lib/countryData'
import type { PhotoData, SSEMessage } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min timeout for large libraries

const BATCH_SIZE = 30 // process N files concurrently

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const source = searchParams.get('source') || 'library'
  const folderPath = searchParams.get('path') || ''

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: SSEMessage) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`))
        } catch {
          // client disconnected
        }
      }

      try {
        const sourcePath = source === 'library' ? getLibraryPath() : folderPath

        if (!sourcePath) {
          send({ type: 'error', message: 'No folder path provided.' })
          controller.close()
          return
        }

        send({ type: 'status', message: 'Finding photos…' })

        const files = await findImageFiles(sourcePath)

        if (files.length === 0) {
          send({ type: 'error', message: `No image files found in: ${sourcePath}` })
          controller.close()
          return
        }

        send({ type: 'total', count: files.length })

        let processed = 0

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          const batch = files.slice(i, i + BATCH_SIZE)

          const results = await Promise.allSettled(
            batch.map(async (filePath) => {
              const raw = await extractExif(filePath)
              if (!raw) return null

              const country = getCountryForCoord(raw.lat, raw.lng)
              if (!country) return null

              const date = raw.date ?? new Date(0)
              const year = date.getFullYear()

              const photo: PhotoData = {
                lat: raw.lat,
                lng: raw.lng,
                date: date.toISOString(),
                year: year > 1990 ? year : new Date().getFullYear(),
                countryId: country.id,
                countryName: country.name,
                countryAlpha2: country.alpha2,
              }

              return photo
            })
          )

          for (const r of results) {
            processed++
            if (r.status === 'fulfilled' && r.value) {
              // Also send flag so client doesn't need the lookup table
              const photo = r.value
              ;(photo as PhotoData & { flag?: string }).flag = getFlag(photo.countryAlpha2)
              send({ type: 'photo', data: photo })
            }
          }

          send({ type: 'progress', processed, total: files.length })
        }

        send({ type: 'done' })
      } catch (err) {
        send({ type: 'error', message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    },
  })
}

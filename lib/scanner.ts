// Server-side only. Walks a directory and extracts GPS + date from image EXIF.
import fs from 'fs'
import path from 'path'
import os from 'os'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.heic', '.heif', '.png', '.tiff', '.tif', '.cr2', '.nef', '.arw', '.dng'])

export function getLibraryPath(): string {
  return path.join(os.homedir(), 'Pictures', 'Photos Library.photoslibrary', 'originals')
}

export async function findImageFiles(dir: string): Promise<string[]> {
  const results: string[] = []

  async function walk(current: string) {
    let entries: fs.Dirent[]
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (IMAGE_EXTS.has(ext)) results.push(full)
      }
    }
  }

  await walk(dir)
  return results
}

export interface RawPhotoData {
  lat: number
  lng: number
  date: Date | null
  filePath: string
}

export async function extractExif(filePath: string): Promise<RawPhotoData | null> {
  try {
    // Dynamic import so exifr stays as serverExternalPackage
    const exifr = await import('exifr')
    const data = await exifr.parse(filePath, {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'DateTime'],
    })

    if (!data?.latitude || !data?.longitude) return null

    const date: Date | null =
      data.DateTimeOriginal instanceof Date
        ? data.DateTimeOriginal
        : data.CreateDate instanceof Date
          ? data.CreateDate
          : data.DateTime instanceof Date
            ? data.DateTime
            : null

    return { lat: data.latitude, lng: data.longitude, date, filePath }
  } catch {
    return null
  }
}

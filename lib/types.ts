export interface PhotoData {
  lat: number
  lng: number
  date: string // ISO string
  year: number
  countryId: string
  countryName: string
  countryAlpha2: string
}

export interface CountryVisit {
  id: string
  name: string
  alpha2: string
  flag: string
  years: number[]
  photoCount: number
  firstVisit: number
}

export type SourceType = 'library' | 'folder'

export type ScanStatus = 'idle' | 'scanning' | 'done' | 'error'

export type SSEMessage =
  | { type: 'status'; message: string }
  | { type: 'total'; count: number }
  | { type: 'photo'; data: PhotoData }
  | { type: 'progress'; processed: number; total: number }
  | { type: 'done' }
  | { type: 'error'; message: string }

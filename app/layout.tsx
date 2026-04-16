import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Where Have U Been',
  description: 'Map every place your photos have taken you',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { GuestProvider } from '@/context/GuestContext'

export const metadata: Metadata = {
  title: 'StudyLens',
  description: 'Study smarter with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0 }}>
        <GuestProvider>
          {children}
        </GuestProvider>
      </body>
    </html>
  )
}
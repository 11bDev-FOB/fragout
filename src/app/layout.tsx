import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: "Y'all Web - Multi-Platform Social Media Management",
  description: 'Post to Mastodon, Bluesky, Nostr, and X from one place. Secure credential storage with Lightning payments.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

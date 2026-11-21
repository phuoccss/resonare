import type { ReactNode } from 'react'

import { themeScript } from './theme'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme script sets attributes on <html> before React hydrates.
    <html
      lang='en'
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}

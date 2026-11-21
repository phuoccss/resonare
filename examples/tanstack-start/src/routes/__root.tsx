import {
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { themeScript } from '../theme'

export const Route = createRootRoute({
  head: () => {
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: 'resonare + TanStack Start' },
      ],
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    // The theme script sets attributes on <html> before React hydrates.
    <html
      lang='en'
      suppressHydrationWarning
    >
      <head>
        <ScriptOnce>{themeScript}</ScriptOnce>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}

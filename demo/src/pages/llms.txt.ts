import type { APIRoute } from 'astro'

import llms from '../../../resonare/llms.txt?raw'

export const prerender = true

export const GET: APIRoute = () => {
  return new Response(llms, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

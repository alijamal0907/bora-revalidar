import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Servir Service Worker com MIME type correto
  if (pathname === '/sw.js') {
    return NextResponse.rewrite(new URL('/sw.js', request.url), {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Service-Worker-Allowed': '/',
      },
    })
  }

  // Servir manifest.json com MIME type correto
  if (pathname === '/manifest.json') {
    return NextResponse.rewrite(new URL('/manifest.json', request.url), {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/sw.js', '/manifest.json'],
}

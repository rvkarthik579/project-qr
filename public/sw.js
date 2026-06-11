// Minimal service worker - only cache static assets
// Never intercept API calls or DELETE requests

const CACHE_NAME = 'project-qr-v1'
const STATIC_ASSETS = ['/']

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // NEVER intercept these - let them go directly to network
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('vercel.app') ||
    request.headers.get('accept')?.includes('text/html')
  ) {
    return
  }

  // Only cache static files
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, clone)
            })
          }
          return response
        })
      })
    )
  }
})

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/design-lab/', '/scan/'],
    },
    sitemap: 'https://project-qr.vercel.app/sitemap.xml',
  }
}

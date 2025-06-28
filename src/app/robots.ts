import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/_next/',
        '/dashboard',
        '/manage-servers',
        '/profile'
      ],
    },
    sitemap: 'https://www.hentaidiscord.com/sitemap.xml',
  }
}

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [{ userAgent: '*', allow: '/' }],
		host: 'https://aurasveta.by',
		sitemap: 'https://aurasveta.by/sitemap.xml',
	}
}

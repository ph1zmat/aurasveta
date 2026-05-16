import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/admin',
					'/api',
					'/cart',
					'/favorites',
					'/compare',
					'/search',
					'/login',
					'/register',
					'/*?returnTo=*',
				],
			},
		],
		host: 'https://aurasveta.by',
		sitemap: 'https://aurasveta.by/sitemap.xml',
	}
}

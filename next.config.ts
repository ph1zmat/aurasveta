import type { NextConfig } from 'next'

function getStorageLocalPatterns(): NonNullable<
	NonNullable<NextConfig['images']>['localPatterns']
> {
	return [
		// Разрешаем локальные изображения, включая proxy-маршрут
		// `/api/storage/file?key=...`, который использует query string.
		// В Next 16 для query string нужен явный localPatterns-конфиг.
		{ pathname: '/**' },
	]
}

// Парсим STORAGE_ENDPOINT, чтобы не хардкодить хост в remotePatterns
function getStorageRemotePatterns(): NonNullable<
	NonNullable<NextConfig['images']>['remotePatterns']
> {
	const endpoint = process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000'
	const publicUrl = process.env.STORAGE_PUBLIC_URL

	let storagePattern: NonNullable<
		NonNullable<NextConfig['images']>['remotePatterns']
	>[number]
	try {
		const u = new URL(endpoint)
		storagePattern = {
			protocol: u.protocol.replace(':', '') as 'http' | 'https',
			hostname: u.hostname,
			port: u.port || undefined,
			pathname: '/**',
		}
	} catch {
		storagePattern = {
			protocol: 'http',
			hostname: 'localhost',
			port: '9000',
			pathname: '/**',
		}
	}

	const patterns: NonNullable<
		NonNullable<NextConfig['images']>['remotePatterns']
	> = [
		// MinIO / кастомный S3-совместимый эндпоинт
		storagePattern,
		// AWS S3 (любой регион)
		{ protocol: 'https', hostname: '*.amazonaws.com', pathname: '/**' },
		// AWS S3 (path-style URL)
		{ protocol: 'https', hostname: 's3.amazonaws.com', pathname: '/**' },
	]

	// CloudFront CDN или другой публичный URL
	if (publicUrl) {
		try {
			const u = new URL(publicUrl)
			patterns.push({
				protocol: u.protocol.replace(':', '') as 'http' | 'https',
				hostname: u.hostname,
				port: u.port || undefined,
				pathname: '/**',
			})
		} catch {
			// некорректный URL — пропускаем
		}
	}

	return patterns
}

const nextConfig: NextConfig = {
	trailingSlash: false,
	output: 'standalone',
	compress: true,
	poweredByHeader: false,
	// @ts-ignore
	typescript: {
		// Разрешаем сборку в продакшн, даже если в проекте есть ошибки типов.
		ignoreBuildErrors: true,
	},
	staticPageGenerationTimeout: 300,
	productionBrowserSourceMaps: false,
	images: {
		dangerouslyAllowSVG: true,
		contentDispositionType: 'inline',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 96, 128, 256],
		localPatterns: getStorageLocalPatterns(),
		remotePatterns: getStorageRemotePatterns(),
		minimumCacheTTL: 86400,
	},
	experimental: {
		// Оптимизация barrel-импортов тяжёлых UI-библиотек — уменьшает размер бандла
		optimizePackageImports: [
			'lucide-react',
			'recharts',
			'@radix-ui/react-progress',
			'@radix-ui/react-separator',
		],
	},
	compiler: {
		removeConsole: { exclude: ['error', 'warn'] },
	},
	async redirects() {
		return [
			{
				source: '/:path+/',
				destination: '/:path+',
				permanent: true,
			},
			{
				source: '/pages/:slug*',
				destination: '/:slug*',
				permanent: true,
			},
			{
				source: '/admin/seo/advanced',
				destination: '/admin/seo',
				permanent: true,
			},
			{
				source: '/magiziny',
				destination: '/stores',
				permanent: true,
			},
			{
				source: '/o-nas',
				destination: '/about',
				permanent: true,
			},
			{
				source: '/dostavka',
				destination: '/delivery',
				permanent: true,
			},
		]
	},
	async headers() {
		return [
			// ISR-страницы: кэш на CDN 60 сек, stale-while-revalidate 30 мин
			{
				source: '/',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, s-maxage=60, stale-while-revalidate=1800',
					},
				],
			},
			{
				source: '/catalog/:slug*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, s-maxage=60, stale-while-revalidate=1800',
					},
				],
			},
			{
				source: '/product/:slug*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, s-maxage=60, stale-while-revalidate=1800',
					},
				],
			},
			{
				source: '/pages/:slug*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, s-maxage=60, stale-while-revalidate=1800',
					},
				],
			},
			// Статика public/ и Next.js бандлов
			{
				source: '/images/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
			{
				source: '/_next/static/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
			{
				source: '/admin/:path*',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/cart',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/favorites',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/compare',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/search',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/login',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/register',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/forbidden',
				headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
			},
			{
				source: '/(.*)',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'X-XSS-Protection', value: '1; mode=block' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()',
					},
					{
						// HSTS: 1 год, includeSubDomains, preload (SEO-CLAIM-044)
						key: 'Strict-Transport-Security',
						value: 'max-age=31536000; includeSubDomains; preload',
					},
					{
						// Базовый CSP — разрешает Next.js inline scripts/styles и S3-изображения
						key: 'Content-Security-Policy',
						value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
					},
				],
			},
		]
	},
}

export default nextConfig

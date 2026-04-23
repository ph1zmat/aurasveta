import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

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
	images: {
		dangerouslyAllowSVG: true,
		contentDispositionType: 'inline',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		localPatterns: getStorageLocalPatterns(),
		remotePatterns: getStorageRemotePatterns(),
	},
	compiler: {
		removeConsole: { exclude: ['error', 'warn'] },
	},
	async headers() {
		return [
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
				],
			},
		]
	},
}

export default withSentryConfig(nextConfig, {
	silent: true,
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,
})

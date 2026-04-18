import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
	images: {
		dangerouslyAllowSVG: true,
		contentDispositionType: 'inline',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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

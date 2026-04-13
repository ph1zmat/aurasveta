import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		dangerouslyAllowSVG: true,
		contentDispositionType: 'inline',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
	compiler: {
		removeConsole: { exclude: ['error', 'warn'] },
	},
}

export default nextConfig

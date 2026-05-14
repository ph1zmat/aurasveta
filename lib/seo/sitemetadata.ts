import type { Metadata, MetadataRoute } from 'next'
import { CANONICAL_BASE_URL } from '@/lib/seo/domain/rules'
import type { PublicStoreSettings } from '@/lib/utils/getpublicstoresettings'
import { resolveStorageFileUrl } from '@/shared/lib/storagefileurl'

export const SITE_NAME = 'Аура Света'
export const SITE_TITLE_DEFAULT =
	'Интернет-магазин люстр и светильников в Мозыре — Аура Света'
export const SITE_TITLE_TEMPLATE = '%s | Аура Света'
export const SITE_DESCRIPTION =
	'Аура Света — интернет-магазин светильников и декора'
export const SITE_TWITTER_HANDLE = '@aurasveta'
export const DEFAULT_LOGO_PATH = '/auralogonolineprimary.png'
export const DEFAULT_FAVICON_PATH = '/favicon-96x96.png'
export const DEFAULT_APPLE_ICON_PATH = '/web-app-manifest-192x192.png'
export const DEFAULT_MANIFEST_ICON_192_PATH = '/web-app-manifest-192x192.png'
export const DEFAULT_MANIFEST_ICON_512_PATH = '/web-app-manifest-512x512.png'
export const DEFAULT_MANIFEST_PATH = '/manifest.webmanifest'

function normalizeAssetPath(value?: string | null): string | null {
	return resolveStorageFileUrl(value)
}

export function toAbsoluteSiteUrl(value: string): string {
	return new URL(value, CANONICAL_BASE_URL).toString()
}

export function resolveSiteAssetPath(
	value?: string | null,
	fallbackPath?: string,
): string | null {
	return normalizeAssetPath(value) ?? fallbackPath ?? null
}

export function resolveSiteAssetUrl(
	value?: string | null,
	fallbackPath?: string,
): string | null {
	const path = resolveSiteAssetPath(value, fallbackPath)
	return path ? toAbsoluteSiteUrl(path) : null
}

export function getSiteBrandAssets(settings: PublicStoreSettings | null) {
	const logoPath =
		resolveSiteAssetPath(settings?.logoUrl, DEFAULT_LOGO_PATH) ??
		DEFAULT_LOGO_PATH
	const faviconPath =
		resolveSiteAssetPath(settings?.faviconUrl, DEFAULT_FAVICON_PATH) ??
		DEFAULT_FAVICON_PATH
	const appleIconPath = settings?.faviconUrl
		? faviconPath
		: DEFAULT_APPLE_ICON_PATH

	return {
		logoPath,
		logoUrl: toAbsoluteSiteUrl(logoPath),
		faviconPath,
		faviconUrl: toAbsoluteSiteUrl(faviconPath),
		appleIconPath,
		appleIconUrl: toAbsoluteSiteUrl(appleIconPath),
		manifestUrl: toAbsoluteSiteUrl(DEFAULT_MANIFEST_PATH),
		manifestIcon192Path: DEFAULT_MANIFEST_ICON_192_PATH,
		manifestIcon192Url: toAbsoluteSiteUrl(DEFAULT_MANIFEST_ICON_192_PATH),
		manifestIcon512Path: DEFAULT_MANIFEST_ICON_512_PATH,
		manifestIcon512Url: toAbsoluteSiteUrl(DEFAULT_MANIFEST_ICON_512_PATH),
	}
}

export function buildRootMetadata(
	settings: PublicStoreSettings | null,
): Metadata {
	const brandAssets = getSiteBrandAssets(settings)

	return {
		metadataBase: new URL(CANONICAL_BASE_URL),
		applicationName: SITE_NAME,
		authors: [{ name: SITE_NAME }],
		title: {
			default: SITE_TITLE_DEFAULT,
			template: SITE_TITLE_TEMPLATE,
		},
		description: SITE_DESCRIPTION,
		manifest: DEFAULT_MANIFEST_PATH,
		verification: {
			google: 'fA8h5x9FAQDa6OFp09Tvp67Fc9KEF3MvBLZMH3e-OUg',
			yandex: 'ee70a2896ab83afb',
		},
		alternates: {
			canonical: CANONICAL_BASE_URL,
			languages: {
				'ru-by': CANONICAL_BASE_URL,
				'x-default': CANONICAL_BASE_URL,
			},
		},
		other: {
			'theme-color': '#ffffff',
			'geo.region': 'BY',
			'geo.placename': 'Belarus',
		},
		openGraph: {
			siteName: SITE_NAME,
			locale: 'ru_RU',
			type: 'website',
			url: CANONICAL_BASE_URL,
			images: [
				{
					url: brandAssets.logoUrl,
					alt: SITE_NAME,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			site: SITE_TWITTER_HANDLE,
			images: [brandAssets.logoUrl],
		},
	}
}

export function buildSiteManifest(): MetadataRoute.Manifest {
	return {
		name: SITE_NAME,
		short_name: SITE_NAME,
		description: SITE_DESCRIPTION,
		start_url: '/',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: '#ffffff',
		icons: [
			{
				src: DEFAULT_MANIFEST_ICON_192_PATH,
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: DEFAULT_MANIFEST_ICON_512_PATH,
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
	}
}

import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import {
	mergeSeoFields,
	pageLegacySeoToFields,
} from '@/lib/seo/metadata-persistence'
import {
	generateProductSeo,
	generateCategorySeo,
	generatePageSeo,
} from '@/shared/lib/seo/generateSeo'

interface SeoResult {
	title: string
	description: string | null
	ogTitle: string | null
	ogDescription: string | null
	ogImage: string | null
	canonicalUrl: string | null
	noIndex: boolean
	keywords: string | null
}

interface SeoOverride {
	title: string | null
	description: string | null
	keywords: string | null
	ogTitle: string | null
	ogDescription: string | null
	ogImage: string | null
	canonicalUrl: string | null
	noIndex: boolean
}

async function getSeoOverride(
	targetType: string,
	targetId: string,
): Promise<SeoOverride | null> {
	const seo = await prisma.seoMetadata.findUnique({
		where: { targetType_targetId: { targetType, targetId } },
		select: {
			title: true,
			description: true,
			keywords: true,
			ogTitle: true,
			ogDescription: true,
			ogImage: true,
			canonicalUrl: true,
			noIndex: true,
		},
	})
	return seo
}

function merge(
	auto: Record<string, string | null>,
	override: SeoOverride | null,
): SeoResult {
	return {
		title: (override?.title as string) ?? (auto.title as string) ?? '',
		description: (override?.description as string) ?? auto.description ?? null,
		ogTitle: (override?.ogTitle as string) ?? auto.ogTitle ?? null,
		ogDescription:
			(override?.ogDescription as string) ?? auto.ogDescription ?? null,
		ogImage: (override?.ogImage as string) ?? auto.ogImage ?? null,
		canonicalUrl: (override?.canonicalUrl as string) ?? null,
		noIndex: (override?.noIndex as boolean) ?? false,
		keywords: (override?.keywords as string) ?? null,
	}
}

export async function getMetadataForProduct(product: {
	id: string
	name: string
	description?: string | null
	metaTitle?: string | null
	metaDesc?: string | null
	price?: number | null
	images?: Array<{ url?: string | null } | string>
	brand?: string | null
}): Promise<SeoResult> {
	const auto = generateProductSeo(product)
	const override = await getSeoOverride('product', product.id)
	const merged = mergeSeoFields(
		{
			title: product.metaTitle ?? auto.title,
			description: product.metaDesc ?? auto.description,
			ogTitle: auto.ogTitle,
			ogDescription: auto.ogDescription,
			ogImage: auto.ogImage,
		},
		override,
	)

	return {
		title: merged.title ?? auto.title,
		description: merged.description,
		ogTitle: merged.ogTitle,
		ogDescription: merged.ogDescription,
		ogImage: merged.ogImage,
		canonicalUrl: merged.canonicalUrl,
		noIndex: merged.noIndex,
		keywords: merged.keywords,
	}
}

export async function getMetadataForCategory(category: {
	id: string
	name: string
	description?: string | null
}): Promise<SeoResult> {
	const auto = generateCategorySeo(category)
	const override = await getSeoOverride('category', category.id)
	return merge(auto, override)
}

export async function getMetadataForPage(page: {
	id: string
	title: string
	content?: string | null
	metaTitle?: string | null
	metaDesc?: string | null
	imagePath?: string | null
	image?: string | null
}): Promise<SeoResult> {
	const auto = generatePageSeo(page)
	const override = await getSeoOverride('page', page.id)
	const legacy = pageLegacySeoToFields({
		metaTitle: page.metaTitle,
		metaDesc: page.metaDesc,
	})
	const merged = mergeSeoFields(
		mergeSeoFields(
			{
				title: auto.title,
				description: auto.description,
				ogTitle: auto.ogTitle,
				ogDescription: auto.ogDescription,
				ogImage: auto.ogImage,
			},
			legacy,
		),
		override,
	)

	return {
		title: merged.title ?? auto.title,
		description: merged.description,
		ogTitle: merged.ogTitle,
		ogDescription: merged.ogDescription,
		ogImage: merged.ogImage,
		canonicalUrl: merged.canonicalUrl,
		noIndex: merged.noIndex,
		keywords: merged.keywords,
	}
}

export async function getMetadataForStaticPage(
	pageId: string,
	fallbackTitle: string,
): Promise<SeoResult> {
	const override = await getSeoOverride('page', pageId)
	const merged = mergeSeoFields(
		{
			title: fallbackTitle,
			description: null,
			ogTitle: fallbackTitle,
			ogDescription: null,
			ogImage: null,
		},
		override,
	)

	return {
		title: merged.title ?? fallbackTitle,
		description: merged.description,
		ogTitle: merged.ogTitle,
		ogDescription: merged.ogDescription,
		ogImage: merged.ogImage,
		canonicalUrl: merged.canonicalUrl,
		noIndex: merged.noIndex,
		keywords: merged.keywords,
	}
}

export function seoToMetadata(seo: SeoResult): Metadata {
	const ogTitle = seo.ogTitle ?? seo.title
	const ogDescription = seo.ogDescription ?? seo.description ?? undefined
	const ogImages = seo.ogImage
		? [{ url: seo.ogImage, width: 1200, height: 630, alt: ogTitle }]
		: undefined

	return {
		title: seo.title,
		description: seo.description ?? undefined,
		keywords: seo.keywords ?? undefined,
		openGraph: {
			type: 'website',
			title: ogTitle,
			description: ogDescription,
			url: seo.canonicalUrl ?? undefined,
			images: ogImages,
		},
		twitter: {
			card: 'summary_large_image',
			title: ogTitle,
			description: ogDescription,
			images: seo.ogImage ? [seo.ogImage] : undefined,
		},
		alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
		robots: seo.noIndex ? { index: false, follow: false } : undefined,
	}
}

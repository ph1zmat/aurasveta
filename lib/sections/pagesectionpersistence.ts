import 'server-only'

import { TRPCError } from '@trpc/server'
import type { Prisma } from '@prisma/client'
import { SectionConfigSchema, type SectionType } from '@/shared/types/sections'

type LinkTargetInput =
	| { kind: 'page'; pageId: string }
	| { kind: 'product'; productId: string }
	| { kind: 'category'; categoryId: string }
	| { kind: 'external'; url: string }

export type PageSectionInput = {
	type: SectionType
	title?: string | null
	subtitle?: string | null
	anchor?: string | null
	isActive?: boolean
	background?:
		| { type: 'none' }
		| { type: 'color'; value: string }
		| { type: 'gradient'; value: string }
		| { type: 'image'; mediaAssetId: string; overlay: number }
		| null
	config: Record<string, unknown>
	manualProductIds?: string[]
	manualCategoryIds?: string[]
	mediaItems?: Array<{
		storageKey: string
		originalName?: string | null
		alt?: string | null
		role?: string | null
	}>
}

function unique<T>(values: T[]) {
	return [...new Set(values)]
}

function collectLinkTargetsFromValue(value: unknown): LinkTargetInput[] {
	if (Array.isArray(value)) {
		return value.flatMap(item => collectLinkTargetsFromValue(item))
	}

	if (!value || typeof value !== 'object') return []

	const candidate = value as Record<string, unknown>
	if (candidate.kind === 'page' && typeof candidate.pageId === 'string') {
		return [{ kind: 'page', pageId: candidate.pageId }]
	}
	if (candidate.kind === 'product' && typeof candidate.productId === 'string') {
		return [{ kind: 'product', productId: candidate.productId }]
	}
	if (candidate.kind === 'category' && typeof candidate.categoryId === 'string') {
		return [{ kind: 'category', categoryId: candidate.categoryId }]
	}
	if (candidate.kind === 'external' && typeof candidate.url === 'string') {
		return [{ kind: 'external', url: candidate.url }]
	}

	return Object.values(candidate).flatMap(item => collectLinkTargetsFromValue(item))
}

async function upsertMediaAsset(
	tx: Prisma.TransactionClient,
	media: NonNullable<PageSectionInput['mediaItems']>[number],
) {
	return tx.mediaAsset.upsert({
		where: { storageKey: media.storageKey },
		update: {
			originalName: media.originalName ?? undefined,
			alt: media.alt ?? undefined,
		},
		create: {
			storageKey: media.storageKey,
			originalName: media.originalName ?? null,
			alt: media.alt ?? null,
		},
	})
}

async function buildSectionCreateInput(
	tx: Prisma.TransactionClient,
	pageId: string,
	section: PageSectionInput,
	order: number,
): Promise<Prisma.SectionCreateInput> {
	const parsedConfig = SectionConfigSchema.safeParse(section.config)
	if (!parsedConfig.success || parsedConfig.data.type !== section.type) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: `Некорректный config для секции типа ${section.type}.`,
		})
	}

	const linkTargets = collectLinkTargetsFromValue(parsedConfig.data)
	const pageRefs = unique(
		linkTargets
			.filter(item => item.kind === 'page')
			.map(item => item.pageId),
	)
	const productRefs = unique([
		...(section.manualProductIds ?? []),
		...linkTargets
			.filter(item => item.kind === 'product')
			.map(item => item.productId),
	])
	const categoryRefs = unique([
		...(section.manualCategoryIds ?? []),
		...linkTargets
			.filter(item => item.kind === 'category')
			.map(item => item.categoryId),
	])
	const mediaAssets = await Promise.all(
		(section.mediaItems ?? [])
			.filter(item => item.storageKey.trim().length > 0)
			.map(item => upsertMediaAsset(tx, item)),
	)

	return {
		page: { connect: { id: pageId } },
		type: section.type,
		order,
		isActive: section.isActive ?? true,
		title: section.title?.trim() || null,
		subtitle: section.subtitle?.trim() || null,
		anchor: section.anchor?.trim() || null,
		background: (section.background ?? { type: 'none' }) as Prisma.InputJsonValue,
		config: parsedConfig.data as Prisma.InputJsonValue,
		products: productRefs.length
			? {
				create: productRefs.map((productId, index) => ({
					product: { connect: { id: productId } },
					order: index,
				}))
			}
			: undefined,
		categories: categoryRefs.length
			? {
				create: categoryRefs.map((categoryId, index) => ({
					category: { connect: { id: categoryId } },
					order: index,
				}))
			}
			: undefined,
		pages: pageRefs.length
			? {
				create: pageRefs.map((targetPageId, index) => ({
					targetPage: { connect: { id: targetPageId } },
					order: index,
				}))
			}
			: undefined,
		mediaItems: mediaAssets.length
			? {
				create: mediaAssets.map((mediaAsset, index) => ({
					mediaAsset: { connect: { id: mediaAsset.id } },
					order: index,
					role: section.mediaItems?.[index]?.role?.trim() || null,
					altOverride: section.mediaItems?.[index]?.alt?.trim() || null,
				}))
			}
			: undefined,
	}
}

export async function replacePageSections(
	tx: Prisma.TransactionClient,
	pageId: string,
	sections: PageSectionInput[],
) {
	await tx.section.deleteMany({ where: { pageId } })

	for (const [index, section] of sections.entries()) {
		await tx.section.create({
			data: await buildSectionCreateInput(tx, pageId, section, index),
		})
	}
}

export function createPageVersionSnapshotInput(args: {
	page: {
		slug: string
		isPublished: boolean
	}
	sections: PageSectionInput[]
}) {
	return {
		slugSnapshot: args.page.slug,
		statusSnapshot: args.page.isPublished ? 'PUBLISHED' : 'DRAFT',
		sectionsSnapshot: args.sections as Prisma.InputJsonValue,
		seoSnapshot: {} as Prisma.InputJsonValue,
	}
}

import type { SectionBackground, SectionConfig, SectionType } from '@/shared/types/sections'
import { getSectionDefinition } from '@/entities/section'

export interface PageSectionDraftMediaItem {
	storageKey: string
	originalName: string | null
	alt: string | null
	role: string | null
}

export interface PageSectionDraft {
	id: string
	type: SectionType
	title: string
	subtitle: string
	anchor: string
	isActive: boolean
	background: SectionBackground
	config: SectionConfig
	manualProductIds: string[]
	manualCategoryIds: string[]
	mediaItems: PageSectionDraftMediaItem[]
}

type PrismaSection = {
	id: string
	type: string
	title?: string | null
	subtitle?: string | null
	anchor?: string | null
	isActive: boolean
	background?: unknown
	config: unknown
	products?: { productId: string }[]
	categories?: { categoryId: string }[]
	mediaItems?: Array<{
		role?: string | null
		altOverride?: string | null
		mediaAsset?: {
			storageKey: string
			originalName?: string | null
			alt?: string | null
		}
	}>
}

export function toPageSectionDraft(section: PrismaSection): PageSectionDraft | null {
	const validTypes: SectionType[] = [
		'hero', 'product-grid', 'featured-categories',
		'rich-text', 'gallery', 'benefits', 'faq', 'cta-banner',
	]
	if (!validTypes.includes(section.type as SectionType)) return null

	const type = section.type as SectionType
	const definition = getSectionDefinition(type)
	const rawConfig = section.config && typeof section.config === 'object' && !Array.isArray(section.config)
		? section.config as Record<string, unknown>
		: {}
	const parsed = definition.schema.safeParse({ type, ...rawConfig })
	const config = parsed.success ? parsed.data : { ...definition.createDefaultConfig() }

	const rawBackground = section.background && typeof section.background === 'object' && !Array.isArray(section.background)
		? (section.background as SectionBackground)
		: ({ type: 'none' } as SectionBackground)

	return {
		id: section.id,
		type,
		title: section.title ?? '',
		subtitle: section.subtitle ?? '',
		anchor: section.anchor ?? '',
		isActive: section.isActive,
		background: rawBackground,
		config,
		manualProductIds: section.products?.map(p => p.productId) ?? [],
		manualCategoryIds: section.categories?.map(c => c.categoryId) ?? [],
		mediaItems: section.mediaItems
			?.filter(item => Boolean(item.mediaAsset?.storageKey))
			.map(item => ({
				storageKey: item.mediaAsset!.storageKey,
				originalName: item.mediaAsset?.originalName ?? null,
				alt: item.mediaAsset?.alt ?? null,
				role: item.role ?? null,
			})) ?? [],
	}
}

export function clonePageSectionDraft(draft: PageSectionDraft): PageSectionDraft {
	return JSON.parse(JSON.stringify(draft)) as PageSectionDraft
}

export function createNewSectionDraft(type: SectionType): PageSectionDraft {
	const definition = getSectionDefinition(type)
	const config = definition.createDefaultConfig()
	return {
		id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		type,
		title: '',
		subtitle: '',
		anchor: '',
		isActive: true,
		background: { type: 'none' },
		config,
		manualProductIds: [],
		manualCategoryIds: [],
		mediaItems: [],
	}
}

export function changePageSectionDraftType(
	draft: PageSectionDraft,
	newType: SectionType,
): PageSectionDraft {
	const definition = getSectionDefinition(newType)
	return {
		...draft,
		type: newType,
		config: definition.createDefaultConfig(),
	}
}

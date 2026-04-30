import type { LucideIcon } from 'lucide-react'
import {
	AlignLeft,
	CircleHelp,
	FolderTree,
	Grid2x2,
	Images,
	LayoutTemplate,
	Megaphone,
	Sparkles,
} from 'lucide-react'
import type { ZodType } from 'zod'
import {
	BenefitsSectionConfigSchema,
	CtaBannerSectionConfigSchema,
	FaqSectionConfigSchema,
	FeaturedCategoriesSectionConfigSchema,
	GallerySectionConfigSchema,
	HeroSectionConfigSchema,
	RichTextSectionConfigSchema,
	ProductGridSectionConfigSchema,
	type SectionBackground,
	type SectionConfig,
	type SectionType,
} from '@/shared/types/sections'
import {
	BenefitsSectionRenderer,
	CtaBannerSectionRenderer,
	FaqSectionRenderer,
	FeaturedCategoriesSectionRenderer,
	GallerySectionRenderer,
	HeroSectionRenderer,
	ProductGridSectionRenderer,
	RichTextSectionRenderer,
} from './ui/SectionRenderers'

export type SectionConfigByType<TType extends SectionType> = Extract<
	SectionConfig,
	{ type: TType }
>

export interface SectionRendererProps<TType extends SectionType = SectionType> {
	definition: SectionDefinition<TType>
	section: ResolvedSectionRecord<TType>
	title?: string | null
	subtitle?: string | null
	config: SectionConfigByType<TType>
	className?: string
}

export type SectionRendererComponent<TType extends SectionType = SectionType> = (
	props: SectionRendererProps<TType>,
) => React.ReactNode

export interface SectionDefinition<TType extends SectionType = SectionType> {
	type: TType
	label: string
	description: string
	icon: LucideIcon
	schema: ZodType<SectionConfigByType<TType>>
	createDefaultConfig: () => SectionConfigByType<TType>
	RendererComponent: SectionRendererComponent<TType>

}

export interface ResolvedSectionProduct {
	id: string
	slug: string
	name: string
	description?: string | null
	price?: number | null
	compareAtPrice?: number | null
	stock: number
	images: unknown
	brand?: string | null
	brandCountry?: string | null
	rating?: number | null
	reviewsCount?: number
	badges: unknown
	createdAt: Date | string
	category?: { name: string; slug?: string } | null
}

export interface ResolvedSectionCategory {
	id: string
	name: string
	slug: string
	image?: string | null
	imagePath?: string | null
	imageUrl?: string | null
	showInHeader?: boolean
	children: Array<{ name: string; slug: string }>
}

export interface ResolvedSectionPageReference {
	id: string
	title: string
	slug: string
	image?: string | null
	imagePath?: string | null
	imageUrl?: string | null
}

export interface ResolvedSectionMediaItem {
	id: string
	storageKey: string
	url: string
	alt?: string | null
	mimeType?: string | null
	width?: number | null
	height?: number | null
	role?: string | null
}

export interface ResolvedSectionRecord<TType extends SectionType = SectionType> {
	id: string
	type: TType
	title?: string | null
	subtitle?: string | null
	anchor?: string | null
	background?: SectionBackground | null
	config: SectionConfigByType<TType>
	products: ResolvedSectionProduct[]
	categories: ResolvedSectionCategory[]
	pages: ResolvedSectionPageReference[]
	mediaItems: ResolvedSectionMediaItem[]
}

type SectionRegistryMap = {
	[K in SectionType]: SectionDefinition<K>
}

type AnySectionDefinition = SectionRegistryMap[SectionType]

export const sectionRegistry: SectionRegistryMap = {
	hero: {
		type: 'hero',
		label: 'Hero',
		description:
			'Верхняя промо-секция с акцентом на оффер, CTA и ключевое изображение.',
		icon: LayoutTemplate,
		schema: HeroSectionConfigSchema,
		createDefaultConfig: () => ({
			type: 'hero',
			layout: 'split',
			description: '',
			badges: [],
			mediaRole: 'background',
		}),
		RendererComponent: HeroSectionRenderer,

	},
	'product-grid': {
		type: 'product-grid',
		label: 'Сетка товаров',
		description:
			'Показывает товары вручную или по динамическим источникам и фильтрам.',
		icon: Grid2x2,
		schema: ProductGridSectionConfigSchema,
		createDefaultConfig: () => ({
			type: 'product-grid',
			source: { mode: 'manual' },
			limit: 8,
			sort: 'manual',
			columns: { mobile: 1, tablet: 2, desktop: 4 },
			showPrice: true,
			showCompareAtPrice: true,
			showCharacteristics: [],
		}),
		RendererComponent: ProductGridSectionRenderer,

	},
	'featured-categories': {
		type: 'featured-categories',
		label: 'Подборка категорий',
		description:
			'Витрина категорий и навигационных подборок каталога.',
		icon: FolderTree,
		schema: FeaturedCategoriesSectionConfigSchema,
		createDefaultConfig: () => ({
			type: 'featured-categories',
			source: { mode: 'manual' },
			layout: 'grid',
			limit: 6,
			showProductCount: true,
		}),
		RendererComponent: FeaturedCategoriesSectionRenderer,

	},
	'rich-text': {
		type: 'rich-text',
		label: 'Rich text',
		description:
			'Редакционный контент с текстом, списками, ссылками и пояснениями.',
		icon: AlignLeft,
		schema: RichTextSectionConfigSchema,
		createDefaultConfig: () => ({
			type: 'rich-text',
			body: '',
			maxWidth: 'lg',
		}),
		RendererComponent: RichTextSectionRenderer,

	},
	gallery: {
		type: 'gallery',
		label: 'Галерея',
		description:
			'Набор визуальных карточек, логотипов или изображений с разными layout.',
		icon: Images,
		schema: GallerySectionConfigSchema,
		createDefaultConfig: () => ({
			type: 'gallery',
			layout: 'grid',
			lightbox: true,
			aspectRatio: '4:3',
		}),
		RendererComponent: GallerySectionRenderer,

	},
	benefits: {
		type: 'benefits',
		label: 'Преимущества',
		description: 'Карточки преимуществ, доверительных сигналов и value props.',
		icon: Sparkles,
		schema: BenefitsSectionConfigSchema,
		createDefaultConfig: () => ({
			type: 'benefits',
			items: [
				{
					title: 'Новое преимущество',
					description: '',
					icon: '',
				},
			],
			columns: { mobile: 1, desktop: 3 },
		}),
		RendererComponent: BenefitsSectionRenderer,

	},
	faq: {
		type: 'faq',
		label: 'FAQ',
		description: 'Секция вопросов и ответов для помощи и SEO.',
		icon: CircleHelp,
		schema: FaqSectionConfigSchema,
		createDefaultConfig: () => ({
			type: 'faq',
			items: [{ question: 'Новый вопрос', answer: 'Новый ответ' }],
		}),
		RendererComponent: FaqSectionRenderer,

	},
	'cta-banner': {
		type: 'cta-banner',
		label: 'CTA banner',
		description:
			'Компактный призыв к действию с одной или двумя ссылками.',
		icon: Megaphone,
		schema: CtaBannerSectionConfigSchema,
		createDefaultConfig: () => ({
			type: 'cta-banner',
			description: '',
			primaryCta: { kind: 'external', url: 'https://example.com' },
			align: 'left',
		}),
		RendererComponent: CtaBannerSectionRenderer,

	},
}

export function getSectionDefinition<TType extends SectionType>(
	type: TType,
): SectionDefinition<TType> {
	return sectionRegistry[type]
}

export function getAllSectionDefinitions(): AnySectionDefinition[] {
	return Object.values(sectionRegistry)
}

export function getAllSectionTypes(): SectionType[] {
	return Object.keys(sectionRegistry) as SectionType[]
}


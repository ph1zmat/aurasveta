import type { ReactNode } from 'react'
import {
	getSectionDefinition,
	type SectionConfigByType,
	type SectionDefinition,
} from '@/entities/section'
import type { SectionType } from '@/shared/types/sections'
import type { PageSectionDraft } from './pageSectionDraft'
import type { SectionEditorOptions } from './sectionEditorTypes'
import BenefitsSectionEditor from '../ui/typed/BenefitsSectionEditor'
import CtaBannerSectionEditor from '../ui/typed/CtaBannerSectionEditor'
import FaqSectionEditor from '../ui/typed/FaqSectionEditor'
import FeaturedCategoriesSectionEditor from '../ui/typed/FeaturedCategoriesSectionEditor'
import GallerySectionEditor from '../ui/typed/GallerySectionEditor'
import HeroSectionEditor from '../ui/typed/HeroSectionEditor'
import ProductGridSectionEditor from '../ui/typed/ProductGridSectionEditor'
import RichTextSectionEditor from '../ui/typed/RichTextSectionEditor'

export interface PageSectionConfigEditorProps<
	TType extends SectionType = SectionType,
> {
	definition: SectionDefinition<TType>
	section: PageSectionDraft
	value: SectionConfigByType<TType>
	onChange: (value: SectionConfigByType<TType>) => void
	onSectionChange: (patch: Partial<PageSectionDraft>) => void
	options: SectionEditorOptions
}

export type PageSectionConfigEditorComponent<
	TType extends SectionType = SectionType,
> = (props: PageSectionConfigEditorProps<TType>) => ReactNode

type PageSectionEditorRegistryMap = {
	[K in SectionType]: PageSectionConfigEditorComponent<K>
}

const sectionEditorRegistry: PageSectionEditorRegistryMap = {
	hero: HeroSectionEditor,
	'product-grid': ProductGridSectionEditor,
	'featured-categories': FeaturedCategoriesSectionEditor,
	'rich-text': RichTextSectionEditor,
	gallery: GallerySectionEditor,
	benefits: BenefitsSectionEditor,
	faq: FaqSectionEditor,
	'cta-banner': CtaBannerSectionEditor,
}

export function getSectionEditorComponent<TType extends SectionType>(
	type: TType,
): PageSectionConfigEditorComponent<TType> {
	return sectionEditorRegistry[type]
}

export function getSectionEditorDefinition<TType extends SectionType>(
	type: TType,
) {
	return {
		definition: getSectionDefinition(type),
		EditorComponent: getSectionEditorComponent(type),
	}
}

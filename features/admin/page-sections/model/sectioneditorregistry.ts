import type { ReactNode } from 'react'
import {
	getSectionDefinition,
	type SectionConfigByType,
	type SectionDefinition,
} from '@/entities/section'
import type { SectionType } from '@/shared/types/sections'
import type { PageSectionDraft } from './pagesectiondraft'
import type { SectionEditorOptions } from './sectioneditortypes'
import BenefitsSectionEditor from '../ui/typed/benefitssectioneditor'
import CtaBannerSectionEditor from '../ui/typed/ctabannersectioneditor'
import FaqSectionEditor from '../ui/typed/faqsectioneditor'
import FeaturedCategoriesSectionEditor from '../ui/typed/featuredcategoriessectioneditor'
import GallerySectionEditor from '../ui/typed/gallerysectioneditor'
import HeroSectionEditor from '../ui/typed/herosectioneditor'
import ProductGridSectionEditor from '../ui/typed/productgridsectioneditor'
import RichTextSectionEditor from '../ui/typed/richtextsectioneditor'

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

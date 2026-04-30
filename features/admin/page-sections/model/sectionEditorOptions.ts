import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import type { SectionEditorOptions, SectionEditorOption } from './sectionEditorTypes'

type PageOption = RouterOutputs['pages']['getAll'][number]
type CategoryOption = RouterOutputs['categories']['getAll'][number]
type ProductOption = RouterOutputs['products']['getAdminOptions'][number]

function toPageOption(page: PageOption): SectionEditorOption {
	return {
		id: page.id,
		label: page.title,
		description: `/${page.slug}`,
	}
}

function toCategoryOption(category: CategoryOption): SectionEditorOption {
	return {
		id: category.id,
		label: category.name,
		description: category.slug,
	}
}

function toProductOption(product: ProductOption): SectionEditorOption {
	return {
		id: product.id,
		label: product.name,
		description: product.slug,
	}
}

export function useSectionEditorOptions(): SectionEditorOptions {
	const { data: pages = [] } = trpc.pages.getAll.useQuery()
	const { data: categories = [] } = trpc.categories.getAll.useQuery()
	const { data: products = [] } = trpc.products.getAdminOptions.useQuery({
		limit: 300,
	})

	return {
		pages: pages.map(toPageOption),
		categories: categories.map(toCategoryOption),
		products: products.map(toProductOption),
	}
}

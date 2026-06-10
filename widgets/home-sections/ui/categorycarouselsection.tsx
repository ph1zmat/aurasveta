import { prisma } from '@/lib/prisma'
import CatalogCategoryCarousel from '@/entities/category/ui/catalogcategorycarousel'
import { resolveStorageFileUrl } from '@/shared/lib/storagefileurl'

interface CategoryCarouselConfig {
	parentId?: string
	/** Explicit list of category IDs to display (takes priority over parentId) */
	categories?: string[]
	/** Maximum categories to show, default 12 */
	limit?: number
	/** Sort order, default 'name' */
	orderBy?: 'name' | 'createdAt'
	columns?: number
	show_names?: boolean
	use_category_images?: boolean
}

interface CategoryCarouselSectionProps {
	title?: string | null
	config?: CategoryCarouselConfig
}

export default async function CategoryCarouselSection({
	title,
	config,
}: CategoryCarouselSectionProps) {
	const limit = Math.min(Math.max(config?.limit ?? 12, 1), 48)
	const orderField = config?.orderBy ?? 'name'
	const explicitIds = config?.categories

	const categories = explicitIds && explicitIds.length > 0
		? await prisma.category.findMany({
				where: { id: { in: explicitIds } },
				select: {
					id: true,
					name: true,
					slug: true,
					imagePath: true,
					image: true,
					children: {
						select: { name: true, slug: true },
						orderBy: { name: 'asc' },
					},
				},
			}).then(cats =>
				// Preserve the manual order from explicitIds
				explicitIds.map(id => cats.find(c => c.id === id)).filter(Boolean) as typeof cats,
			)
		: await prisma.category.findMany({
				where: { parentId: config?.parentId ?? null },
				orderBy: { [orderField]: 'asc' },
				select: {
					id: true,
					name: true,
					slug: true,
					imagePath: true,
					image: true,
					children: {
						select: { name: true, slug: true },
						orderBy: { name: 'asc' },
					},
				},
				take: limit,
			})

	if (categories.length === 0) return null

	const mapped = categories.map(category => ({
		id: category.id,
		slug: category.slug,
		name: category.name,
		href: `/catalog/${category.slug}`,
		image: category.imagePath
			? (resolveStorageFileUrl(category.imagePath) ?? category.imagePath)
			: category.image || '/placeholder.svg',
		subcategories: category.children.map(child => ({
			name: child.name,
			href: `/catalog/${category.slug}/${child.slug}`,
		})),
	}))

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			{title ? (
				<div className='mb-5 md:mb-6'>
					<p className='mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Каталог
					</p>
					<h2 className='text-lg font-semibold tracking-[0.04em] text-foreground'>
						{title}
					</h2>
				</div>
			) : null}
			<CatalogCategoryCarousel categories={mapped} />
		</section>
	)
}

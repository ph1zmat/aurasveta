import { prisma } from '@/lib/prisma'
import CatalogCategoryCarousel from '@/entities/category/ui/CatalogCategoryCarousel'

interface CategoryCarouselConfig {
	parentId?: string
	/** Maximum categories to show, default 12 */
	limit?: number
	/** Sort order, default 'name' */
	orderBy?: 'name' | 'createdAt'
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

	const categories = await prisma.category.findMany({
		where: {
			parentId: config?.parentId ?? null,
		},
		orderBy: { [orderField]: 'asc' },
		select: {
			id: true,
			name: true,
			slug: true,
			imagePath: true,
			image: true,
			children: {
				select: {
					name: true,
					slug: true,
				},
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
			? `/api/storage/file?key=${category.imagePath}`
			: category.image || '/placeholder.svg',
		subcategories: category.children.map(child => ({
			name: child.name,
			href: `/catalog/${category.slug}/${child.slug}`,
		})),
	}))

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			{title ? (
				<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
					{title}
				</h2>
			) : null}
			<CatalogCategoryCarousel categories={mapped} />
		</section>
	)
}

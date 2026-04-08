import type {
	Category,
	CategoryTreeItem,
	Subcategory,
	Tag,
} from '@/entities/category/model/types'
import { prisma } from '@/lib/prisma'

interface DbCategory {
	id: string
	slug: string
	name: string
	image?: string | null
	imagePath?: string | null
	_count?: { products: number }
}

function toFrontendCategory(dbCat: DbCategory): Category {
	return {
		id: dbCat.id,
		slug: dbCat.slug,
		name: dbCat.name,
		href: `/catalog/${dbCat.slug}`,
		image: dbCat.imagePath ?? dbCat.image ?? '/images/placeholder.jpg',
		productCount: dbCat._count?.products,
	}
}

export async function getAllCategories(): Promise<Category[]> {
	const dbCats = await prisma.category.findMany({
		where: { parentId: null },
		include: {
			_count: { select: { products: true } },
			children: {
				select: {
					id: true,
					slug: true,
					name: true,
					image: true,
					imagePath: true,
				},
			},
		},
		orderBy: { name: 'asc' },
	})
	return dbCats.map(c => ({
		...toFrontendCategory(c),
		subcategories: c.children.map(sub => ({
			name: sub.name,
			href: `/catalog/${sub.slug}`,
			image: sub.imagePath ?? sub.image ?? undefined,
		})),
	}))
}

export async function getCategoryBySlug(
	slug: string,
): Promise<Category | undefined> {
	const dbCat = await prisma.category.findUnique({
		where: { slug },
		include: { _count: { select: { products: true } } },
	})
	return dbCat ? toFrontendCategory(dbCat) : undefined
}

export async function getCategoryTree(
	slug: string,
): Promise<CategoryTreeItem[]> {
	const category = await prisma.category.findUnique({
		where: { slug },
		include: {
			children: {
				include: { children: true },
				orderBy: { name: 'asc' },
			},
		},
	})
	if (!category) return []
	return category.children.map(child => ({
		name: child.name,
		href: `/catalog/${child.slug}`,
		children: child.children.map(sub => ({
			name: sub.name,
			href: `/catalog/${sub.slug}`,
		})),
	}))
}

export async function getSubcategories(slug: string): Promise<Subcategory[]> {
	const category = await prisma.category.findUnique({
		where: { slug },
		include: {
			children: {
				select: { name: true, slug: true, image: true, imagePath: true },
				orderBy: { name: 'asc' },
			},
		},
	})
	if (!category) return []
	return category.children.map(sub => ({
		name: sub.name,
		href: `/catalog/${sub.slug}`,
		image: sub.imagePath ?? sub.image ?? undefined,
	}))
}

export async function getPopularTags(slug: string): Promise<Tag[]> {
	// Tags derived from subcategory names for the given category
	const subs = await getSubcategories(slug)
	return subs.map(sub => ({ label: sub.name, href: sub.href }))
}

export async function getCollectionTags(): Promise<Tag[]> {
	// Collection tags derived from brand names in the database
	const brands = await prisma.product.findMany({
		where: { isActive: true, brand: { not: null } },
		select: { brand: true },
		distinct: ['brand'],
		take: 20,
	})
	return brands
		.map(p => p.brand)
		.filter(Boolean)
		.map(brand => ({ label: brand! }))
}

export async function getSeoContent(slug: string): Promise<string> {
	const category = await prisma.category.findUnique({
		where: { slug },
		select: { description: true },
	})
	return category?.description ?? ''
}

export function getCategoryNameBySlug(
	slug: string,
): Promise<string | undefined> {
	return prisma.category
		.findUnique({
			where: { slug },
			select: { name: true },
		})
		.then(c => c?.name)
}

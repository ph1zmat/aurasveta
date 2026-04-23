import type {
	Category,
	CategoryTreeItem,
	Subcategory,
	Tag,
} from '@/entities/category/model/types'
import { withResolvedImageAsset } from '@/lib/storage-image-assets'
import { prisma } from '@/lib/prisma'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'

interface DbCategory {
	id: string
	slug: string
	name: string
	image?: string | null
	imagePath?: string | null
	_count?: { products: number }
}

type DbSubcategory = {
	id?: string
	slug: string
	name: string
	image?: string | null
	imagePath?: string | null
}

type DbCategoryWithChildren = DbCategory & {
	children: DbSubcategory[]
}

type DbTreeSubcategory = {
	name: string
	slug: string
}

type DbTreeChild = {
	name: string
	slug: string
	children: DbTreeSubcategory[]
}

type BrandRow = {
	brand: string | null
}

function toFrontendCategory(dbCat: DbCategory): Category {
	return {
		id: dbCat.id,
		slug: dbCat.slug,
		name: dbCat.name,
		href: `/catalog/${dbCat.slug}`,
		image:
			resolveStorageFileUrl(dbCat.imagePath ?? dbCat.image) ??
			'/images/placeholder.jpg',
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
	const cache = new Map()
	return Promise.all(
		dbCats.map(async (category: DbCategoryWithChildren) => ({
			...toFrontendCategory(await withResolvedImageAsset(category, { cache })),
			subcategories: await Promise.all(
				category.children.map(async (sub: DbSubcategory) => {
					const enrichedSub = await withResolvedImageAsset(sub, { cache })
					return {
						name: sub.name,
						href: `/catalog/${sub.slug}`,
						image: enrichedSub.imageUrl ?? undefined,
					}
				}),
			),
		})),
	)
}

export async function getCategoryBySlug(
	slug: string,
): Promise<Category | undefined> {
	const dbCat = await prisma.category.findUnique({
		where: { slug },
		include: { _count: { select: { products: true } } },
	})
	if (!dbCat) return undefined

	return toFrontendCategory(await withResolvedImageAsset(dbCat))
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
	return category.children.map((child: DbTreeChild) => ({
		name: child.name,
		href: `/catalog/${child.slug}`,
		children: child.children.map((sub: DbTreeSubcategory) => ({
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
	const cache = new Map()
	return Promise.all(
		category.children.map(async (sub: DbSubcategory) => {
			const enrichedSub = await withResolvedImageAsset(sub, { cache })
			return {
				name: sub.name,
				href: `/catalog/${sub.slug}`,
				image: enrichedSub.imageUrl ?? undefined,
			}
		}),
	)
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
		.map((product: BrandRow) => product.brand)
		.filter((brand: string | null): brand is string => Boolean(brand))
		.map((brand: string) => ({ label: brand }))
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
		.then((category: { name?: string } | null) => category?.name)
}

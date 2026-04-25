import { prisma } from '@/lib/prisma'
import BrandsCarousel from './BrandsCarousel'

export default async function BrandsCarouselServer() {
	const rows = await prisma.product.findMany({
		where: { isActive: true, brand: { not: null } },
		select: { brand: true },
		distinct: ['brand'],
	})
	const brands = rows
		.map((r: { brand: string | null }) => r.brand)
		.filter((b: string | null): b is string => Boolean(b))
		.map((name: string) => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }))

	return <BrandsCarousel brands={brands} />
}

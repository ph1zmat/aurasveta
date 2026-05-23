import { prisma } from '../lib/prisma'
import { buildCategoryProductWhere } from '../lib/categories/categoryfilters'

async function main() {
	console.log('Querying categories from DB...')
	const categories = await prisma.category.findMany({
		where: { parentId: null },
		orderBy: { name: 'asc' },
	})

	console.log(`Found ${categories.length} root categories.`)

	for (const cat of categories) {
		const count = await prisma.product.count({
			where: {
				isActive: true,
				...buildCategoryProductWhere(cat as any, { includeChildren: true }),
			},
		})
		console.log(`- ${cat.name} (${cat.slug}): ${count} active products`)
	}
}

main()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

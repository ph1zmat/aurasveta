import Link from 'next/link'
import UnderlineAnimation from '@/shared/ui/UnderlineAnimation'
import { prisma } from '@/lib/prisma'
import { withResolvedImageAsset } from '@/lib/storage-image-assets'
import DeferredImage from '@/shared/ui/DeferredImage'

export default async function PopularCategories() {
	const dbCategories = await prisma.category.findMany({
		where: { parentId: null },
		select: { name: true, slug: true, image: true, imagePath: true },
		orderBy: { name: 'asc' },
		take: 7,
	})

	const cache = new Map()
	const categories = await Promise.all(dbCategories.map(async c => ({
		label: c.name.toUpperCase(),
		href: `/catalog/${c.slug}`,
		image:
			(await withResolvedImageAsset(c, { cache })).imageUrl ??
			'/images/placeholder.jpg',
	})))

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
				Популярные категории
			</h2>
			<div className='grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-7'>
				{categories.map(cat => (
					<Link
						key={cat.href}
						href={cat.href}
						className='group flex flex-col items-center gap-3 p-4'
					>
						<div className='relative h-24 w-24'>
							<DeferredImage
								src={cat.image}
								alt={cat.label}
								fill
								imageClassName='object-contain'
								fallbackClassName='rounded-full'
								showSpinner={false}
							/>
						</div>
						<UnderlineAnimation>
							<span className='text-center text-xs font-normal uppercase tracking-widest text-foreground py-1'>
								{cat.label}
							</span>
						</UnderlineAnimation>
					</Link>
				))}
			</div>
		</section>
	)
}

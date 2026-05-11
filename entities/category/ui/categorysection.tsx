import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import InteractiveCatalogCard from '@/entities/product/ui/interactivecatalogcard'
import type { CatalogProductCardProps } from '@/entities/product/ui/catalogproductcard'
import { CATALOG_GRID } from '@/shared/config/cataloggrid'

interface CategorySectionProps {
	title: string
	allHref: string
	allLabel: string
	products: (CatalogProductCardProps & { productId: string })[]
}

export default function CategorySection({
	title,
	allHref,
	allLabel,
	products,
}: CategorySectionProps) {
	return (
		<section className='py-8'>
			<h2 className='mb-6 text-xl font-semibold uppercase tracking-widest text-foreground'>
				{title}
			</h2>

			<div className={CATALOG_GRID.wide}>
				{products.map(product => (
					<InteractiveCatalogCard key={product.href} {...product} />
				))}
			</div>

			<div className='mt-8 flex justify-center'>
				<Button asChild variant='outline' className='border-2'>
					<Link href={allHref}>{allLabel}</Link>
				</Button>
			</div>
		</section>
	)
}

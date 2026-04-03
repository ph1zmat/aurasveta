import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import CatalogProductCard from '@/components/ui/CatalogProductCard'
import type { CatalogProductCardProps } from '@/components/ui/CatalogProductCard'

interface CategorySectionProps {
	title: string
	allHref: string
	allLabel: string
	products: CatalogProductCardProps[]
}

export default function CategorySection({
	title,
	allHref,
	allLabel,
	products,
}: CategorySectionProps) {
	return (
		<section className='py-8'>
			<h2 className='mb-6 text-xl font-bold uppercase tracking-wider text-foreground'>
				{title}
			</h2>

			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
				{products.map(product => (
					<CatalogProductCard key={product.href} {...product} />
				))}
			</div>

			<div className='mt-8 flex justify-center'>
				<Button asChild variant='outline' className='border-2'>
					<Link href={allHref}>
						{allLabel}
					</Link>
				</Button>
			</div>
		</section>
	)
}

import { Suspense } from 'react'
import Skeleton from '@/shared/ui/Skeleton'
import HeroBanner from './HeroBanner'
import PopularQueries from './PopularQueries'
import PopularCategories from './PopularCategories'
import SaleProducts from './SaleProducts'
import RoomCategories from './RoomCategories'
import NewProducts from './NewProducts'
import PopularProducts from './PopularProducts'
import BrandsCarouselServer from './BrandsCarouselServer'
import Advantages from './Advantages'
import AboutSection from './AboutSection'

interface SectionData {
	id: string
	sectionType: {
		component: string
	}
	title?: string | null
	config: Record<string, unknown>
	isActive: boolean
	order: number
}

function ProductGridSkeleton() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className='space-y-3'>
						<Skeleton className='h-36 w-full rounded-xl' />
						<Skeleton className='h-4 w-3/4' />
						<Skeleton className='h-3 w-1/2' />
					</div>
				))}
			</div>
		</section>
	)
}

function CategoriesSkeleton() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<Skeleton className='mb-6 h-5 w-56' />
			<div className='grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-7'>
				{Array.from({ length: 7 }).map((_, i) => (
					<div key={i} className='flex flex-col items-center gap-3 p-4'>
						<Skeleton className='h-24 w-24 rounded-full' />
						<Skeleton className='h-3 w-16' />
					</div>
				))}
			</div>
		</section>
	)
}

export default function DynamicSection({ section }: { section: SectionData }) {
	const { component } = section.sectionType

	switch (component) {
		case 'HeroBanner':
			return <HeroBanner />
		case 'PopularQueries':
			return <PopularQueries />
		case 'PopularCategories':
			return (
				<Suspense fallback={<CategoriesSkeleton />}>
					<PopularCategories />
				</Suspense>
			)
		case 'SaleProducts':
			return (
				<Suspense fallback={<ProductGridSkeleton />}>
					<SaleProducts />
				</Suspense>
			)
		case 'RoomCategories':
			return <RoomCategories />
		case 'NewProducts':
			return (
				<Suspense fallback={<ProductGridSkeleton />}>
					<NewProducts />
				</Suspense>
			)
		case 'PopularProducts':
			return <PopularProducts />
		case 'BrandsCarousel':
			return (
				<Suspense fallback={<Skeleton className='h-24 w-full rounded-xl' />}>
					<BrandsCarouselServer />
				</Suspense>
			)
		case 'Advantages':
			return <Advantages />
		case 'AboutSection':
			return <AboutSection />
		default:
			return null
	}
}

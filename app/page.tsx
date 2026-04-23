import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import HeroBanner from '@/widgets/home-sections/ui/HeroBanner'
import PopularQueries from '@/widgets/home-sections/ui/PopularQueries'
import PopularCategories from '@/widgets/home-sections/ui/PopularCategories'
import SaleProducts from '@/widgets/home-sections/ui/SaleProducts'
import RoomCategories from '@/widgets/home-sections/ui/RoomCategories'
import NewProducts from '@/widgets/home-sections/ui/NewProducts'
import BrandsCarousel from '@/widgets/home-sections/ui/BrandsCarousel'
import Advantages from '@/widgets/home-sections/ui/Advantages'
import AboutSection from '@/widgets/home-sections/ui/AboutSection'
import RecentlyViewed from '@/widgets/home-sections/ui/RecentlyViewed'
import PopularProducts from '@/widgets/home-sections/ui/PopularProducts'
import ChatButton from '@/shared/ui/ChatButton'
import Skeleton from '@/shared/ui/Skeleton'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { prisma } from '@/lib/prisma'

type BrandRow = {
	brand: string | null
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

export default async function Home() {
	await connection()

	const brandNames = await prisma.product.findMany({
		where: { isActive: true, brand: { not: null } },
		select: { brand: true },
		distinct: ['brand'],
	})
	const brands = brandNames
		.map((product: BrandRow) => product.brand)
		.filter((name: string | null): name is string => Boolean(name))
		.map((name: string) => ({
			name,
			slug: name.toLowerCase().replace(/\s+/g, '-'),
		}))

	return (
		<div className='flex flex-col bg-background'>
			<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />
				<HeroBanner />
				<PopularQueries />
				<Suspense fallback={<CategoriesSkeleton />}>
					<PopularCategories />
				</Suspense>
				<Suspense fallback={<ProductGridSkeleton />}>
					<SaleProducts />
				</Suspense>
				<RoomCategories />
				<Suspense fallback={<ProductGridSkeleton />}>
					<NewProducts />
				</Suspense>
				<PopularProducts />
				<BrandsCarousel brands={brands} />
				<Advantages />
				<AboutSection />
				<RecentlyViewed />
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

import { Suspense, type ReactNode } from 'react'
import type { Prisma } from '@prisma/client'
import Skeleton from '@/shared/ui/Skeleton'
import HeroBanner from '@/widgets/home-sections/ui/HeroBanner'
import BannerSection from '@/widgets/home-sections/ui/BannerSection'
import PopularQueriesSection from '@/widgets/home-sections/ui/PopularQueriesSection'
import PopularCategories from '@/widgets/home-sections/ui/PopularCategories'
import SaleProducts from '@/widgets/home-sections/ui/SaleProducts'
import RoomCategories from '@/widgets/home-sections/ui/RoomCategories'
import NewProducts from '@/widgets/home-sections/ui/NewProducts'
import PopularProducts from '@/widgets/home-sections/ui/PopularProducts'
import BrandsCarouselServer from '@/widgets/home-sections/ui/BrandsCarouselServer'
import Advantages from '@/widgets/home-sections/ui/Advantages'
import AboutSection from '@/widgets/home-sections/ui/AboutSection'
import RecentlyViewed from '@/widgets/home-sections/ui/RecentlyViewed'
import ProductGridSection from '@/widgets/home-sections/ui/ProductGridSection'
import BrandCarouselByPropertySection from '@/widgets/home-sections/ui/BrandCarouselByPropertySection'
import CategoryCarouselSection from '@/widgets/home-sections/ui/CategoryCarouselSection'

export interface RegistrySectionData {
	id: string
	title?: string | null
	config: Prisma.JsonValue
	sectionType: {
		component: string
	}
}

type SectionRenderer = (section: RegistrySectionData) => ReactNode

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

const HOME_SECTION_COMPONENTS: Record<string, SectionRenderer> = {
	// New generic names
	Banner: section => (
		<BannerSection
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),
	ProductGrid: section => (
		<Suspense fallback={<ProductGridSkeleton />}>
			<ProductGridSection
				title={section.title}
				config={(section.config as Record<string, unknown> | null) ?? undefined}
			/>
		</Suspense>
	),
	BrandCarousel: section => (
		<Suspense fallback={<Skeleton className='h-24 w-full rounded-xl' />}>
			<BrandCarouselByPropertySection
				title={section.title}
				config={(section.config as Record<string, unknown> | null) ?? undefined}
			/>
		</Suspense>
	),
	CategoryCarousel: section => (
		<Suspense fallback={<CategoriesSkeleton />}>
			<CategoryCarouselSection
				title={section.title}
				config={(section.config as Record<string, unknown> | null) ?? undefined}
			/>
		</Suspense>
	),
	Advantages: section => (
		<Advantages
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),
	AboutText: section => (
		<AboutSection
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),
	SeenProducts: section => (
		<RecentlyViewed
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),

	// Backward-compatible keys
	HeroBanner: section => (
		<HeroBanner
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),
	PopularQueries: section => (
		<Suspense fallback={<Skeleton className='h-24 w-full' />}>
			<PopularQueriesSection
				title={section.title}
				config={(section.config as Record<string, unknown> | null) ?? undefined}
			/>
		</Suspense>
	),
	PopularCategories: section => (
		<Suspense fallback={<CategoriesSkeleton />}>
			<PopularCategories
				title={section.title}
				config={(section.config as Record<string, unknown> | null) ?? undefined}
			/>
		</Suspense>
	),
	SaleProducts: section => (
		<Suspense fallback={<ProductGridSkeleton />}>
			<SaleProducts
				title={section.title}
				config={(section.config as Record<string, unknown> | null) ?? undefined}
			/>
		</Suspense>
	),
	RoomCategories: section => (
		<RoomCategories
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),
	NewProducts: section => (
		<Suspense fallback={<ProductGridSkeleton />}>
			<NewProducts
				title={section.title}
				config={(section.config as Record<string, unknown> | null) ?? undefined}
			/>
		</Suspense>
	),
	PopularProducts: section => (
		<PopularProducts
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),
	BrandsCarousel: section => (
		<Suspense fallback={<Skeleton className='h-24 w-full rounded-xl' />}>
			<BrandsCarouselServer
				title={section.title}
				config={(section.config as Record<string, unknown> | null) ?? undefined}
			/>
		</Suspense>
	),
	AboutSection: section => (
		<AboutSection
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),
	RecentlyViewed: section => (
		<RecentlyViewed
			title={section.title}
			config={(section.config as Record<string, unknown> | null) ?? undefined}
		/>
	),
}

export function renderHomeSection(section: RegistrySectionData): ReactNode {
	const key = section.sectionType.component
	const renderer = HOME_SECTION_COMPONENTS[key]
	if (!renderer) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn(`[home-section] Unknown component in registry: ${key}`)
		}
		return null
	}
	return renderer(section)
}

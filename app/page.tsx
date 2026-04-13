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
import { prisma } from '@/lib/prisma'

export default async function Home() {
	const brandNames = await prisma.product.findMany({
		where: { isActive: true, brand: { not: null } },
		select: { brand: true },
		distinct: ['brand'],
	})
	const brands = brandNames
		.map(p => p.brand)
		.filter(Boolean)
		.map(name => ({
			name: name!,
			slug: name!.toLowerCase().replace(/\s+/g, '-'),
		}))

	return (
		<div className='flex flex-col bg-background'>
			<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />
				<HeroBanner />
				<PopularQueries />
				<PopularCategories />
				<SaleProducts />
				<RoomCategories />
				<NewProducts />
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

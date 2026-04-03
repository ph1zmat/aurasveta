import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/layout/CategoryNav'
import Footer from '@/components/layout/Footer'
import HeroBanner from '@/components/sections/HeroBanner'
import PopularQueries from '@/components/sections/PopularQueries'
import PopularCategories from '@/components/sections/PopularCategories'
import SaleProducts from '@/components/sections/SaleProducts'
import RoomCategories from '@/components/sections/RoomCategories'
import NewProducts from '@/components/sections/NewProducts'
import BrandsCarousel from '@/components/sections/BrandsCarousel'
import Advantages from '@/components/sections/Advantages'
import AboutSection from '@/components/sections/AboutSection'
import RecentlyViewed from '@/components/sections/RecentlyViewed'
import ChatButton from '@/components/ui/ChatButton'

export default function Home() {
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<main className='flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />
				<HeroBanner />
				<PopularQueries />
				<PopularCategories />
				<SaleProducts />
				<RoomCategories />
				<NewProducts />
				<BrandsCarousel />
				<Advantages />
				<AboutSection />
				<RecentlyViewed />
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

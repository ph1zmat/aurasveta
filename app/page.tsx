import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import DynamicSection from '@/widgets/home-sections/ui/DynamicSection'
import ChatButton from '@/shared/ui/ChatButton'
import { trpc } from '@/lib/trpc/server'

export default async function Home() {
	const activeSections = await trpc.home.getSections()

	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				{activeSections.length > 0 ? (
					activeSections.map(section => (
						<DynamicSection key={section.id} section={section} />
					))
				) : (
					<div className='mx-auto max-w-7xl px-4 py-12 text-center text-sm text-muted-foreground'>
						Секции главной страницы не настроены в CMS.
					</div>
				)}
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}


import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import PublicSectionRenderer from '@/entities/section/ui/PublicSectionRenderer'
import { getUnifiedHomePageRenderData } from '@/lib/sections/public-page-data'

export const dynamic = 'force-dynamic'

export default async function Home() {
	let unifiedPage = null

	try {
		unifiedPage = await getUnifiedHomePageRenderData()
	} catch (error) {
		console.warn('[home] unified sections unavailable', error)
	}

	const unifiedSections = unifiedPage?.sections ?? []

	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				{unifiedSections.length > 0 ? (
					unifiedSections.map(section => (
						<PublicSectionRenderer key={section.id} section={section} />
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

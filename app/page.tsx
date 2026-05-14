import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import PublicSectionRenderer from '@/entities/section/ui/publicsectionrenderer'
import DynamicHomeSection from '@/widgets/home-sections/ui/dynamichomesection'
import { getUnifiedHomePageRenderData } from '@/lib/sections/publicpagedata'
import { logDatabaseFallback } from '@/lib/utils/dbfallbacklogger'

export const metadata: Metadata = {
	title: 'Аура Света — магазин люстр и светильников в Мозыре',
	description:
		'Аура Света — купить люстры, бра, потолочные светильники и декор в Мозыре. Широкий ассортимент, доставка по Беларуси.',
	openGraph: {
		url: 'https://aurasveta.by',
		type: 'website',
		images: [{ url: '/images/og-home.jpg', width: 1200, height: 630, alt: 'Аура Света' }],
	},
	alternates: {
		canonical: 'https://aurasveta.by',
	},
}
import { prisma } from '@/lib/prisma'

const homeSectionsInclude = { sectionType: true } as const
type HomeSectionWithType = Prisma.HomeSectionGetPayload<{
	include: typeof homeSectionsInclude
}>

export default async function Home() {
	let unifiedPage = null

	try {
		unifiedPage = await getUnifiedHomePageRenderData()
	} catch (error) {
		logDatabaseFallback('home.unified-sections', error)
	}

	const unifiedSections = unifiedPage?.sections ?? []

	// Fallback to HomeSection records if no unified CMS page
	let legacySections: HomeSectionWithType[] = []
	if (unifiedSections.length === 0) {
		try {
			legacySections = await prisma.homeSection.findMany({
				where: { isActive: true },
				orderBy: { order: 'asc' },
				include: homeSectionsInclude,
			})
		} catch (error) {
			logDatabaseFallback('home.legacy-sections', error)
		}
	}

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
				) : legacySections.length > 0 ? (
					legacySections.map(section => (
						<DynamicHomeSection key={section.id} section={section} />
					))
				) : (
					<div className='mx-auto max-w-7xl px-4 py-12 text-center text-sm text-muted-foreground'>
						Секции главной страницы не настроены в CMS.
					</div>
				)}
			</main>

			<Footer />
		</div>
	)
}

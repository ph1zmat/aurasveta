import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import { getMetadataForPage, seoToMetadata } from '@/lib/seo/getMetadata'
import PublicSectionRenderer from '@/entities/section/ui/PublicSectionRenderer'
import { getPublishedPageRenderDataBySlug } from '@/lib/sections/public-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function generateStaticParams() {
	try {
		const pages = await prisma.page.findMany({
			where: { isPublished: true, isSystem: false },
			select: { slug: true },
		})
		return pages.map(p => ({ slug: p.slug }))
	} catch (error) {
		console.warn(
			'[pages] generateStaticParams fallback: database unavailable',
			error,
		)
		return []
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const data = await getPublishedPageRenderDataBySlug(slug)
	const page = data?.page

	if (!page) return { title: 'Страница не найдена' }
	const seo = await getMetadataForPage({
		id: page.id,
		title: page.title,
		content: page.content,
		metaTitle: page.metaTitle,
		metaDesc: page.metaDesc,
		imagePath: page.imagePath,
		image: page.image,
	})
	return seoToMetadata(seo)
}

export default async function ContentPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const data = await getPublishedPageRenderDataBySlug(slug)
	const page = data?.page
	const unifiedSections = data?.sections ?? []

	if (!page) notFound()
	const hasUnifiedSections = unifiedSections.length > 0

	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Breadcrumbs
					items={[{ label: 'Главная', href: '/' }, { label: page.title }]}
				/>

				{hasUnifiedSections ? (
					<div className='py-6 md:py-8'>
						{unifiedSections.map(section => (
							<PublicSectionRenderer key={section.id} section={section} />
						))}
					</div>
				) : (
					<div className='py-12 text-center text-sm text-muted-foreground'>
						Содержимое страницы не настроено.
					</div>
				)}
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

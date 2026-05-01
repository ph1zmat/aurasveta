import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/HeaderServer'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'
import { getMetadataForPage, seoToMetadata } from '@/lib/seo/getMetadata'
import DeferredImage from '@/shared/ui/DeferredImage'
import PageRenderer from '@/widgets/page-renderer/PageRenderer'
import PublicSectionRenderer from '@/entities/section/ui/PublicSectionRenderer'
import PublicPageBlocksRenderer from '@/entities/page-block/ui/PublicPageBlocksRenderer'
import { getPublishedPageRenderDataBySlug } from '@/lib/sections/public-page-data'

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

	// Загружаем блоки страницы
	const pageBlocks = page
		? await prisma.pageBlock.findMany({
				where: { pageId: page.id, isActive: true },
				orderBy: { order: 'asc' },
			})
		: []

	if (!page) notFound()
	const resolvedImage =
		page.imageUrl ?? resolveStorageFileUrl(page.imagePath ?? page.image)
	const hasPageBlocks = pageBlocks.length > 0
	const hasUnifiedSections = unifiedSections.length > 0
	const hasContentBlocks =
		Array.isArray(page.contentBlocks) && page.contentBlocks.length > 0

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
				) : hasPageBlocks ? (
					<article className='mx-auto max-w-3xl py-8'>
						<h1 className='mb-6 text-3xl font-bold tracking-tight'>
							{page.title}
						</h1>
						<PublicPageBlocksRenderer blocks={pageBlocks} />
					</article>
				) : (
					<article className='prose prose-neutral dark:prose-invert mx-auto max-w-3xl py-8'>
						{resolvedImage && (
							<DeferredImage
								src={resolvedImage}
								alt={page.title}
								width={800}
								height={400}
								className='mb-8 w-full rounded-lg'
								imageClassName='w-full rounded-lg object-cover'
								fallbackClassName='rounded-lg'
							/>
						)}
						<h1>{page.title}</h1>
						{hasContentBlocks ? (
							<PageRenderer content={page.contentBlocks} />
						) : (
							<div dangerouslySetInnerHTML={{ __html: page.content ?? '' }} />
						)}
					</article>
				)}
			</main>

			<Footer />
		</div>
	)
}

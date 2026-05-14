import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import Breadcrumbs from '@/shared/ui/breadcrumbs'
import { resolveStorageFileUrl } from '@/shared/lib/storagefileurl'
import { getMetadataForPage, seoToMetadata } from '@/lib/seo/getmetadata'
import DeferredImage from '@/shared/ui/deferredimage'
import PageRenderer from '@/widgets/page-renderer/pagerenderer'
import PublicSectionRenderer from '@/entities/section/ui/publicsectionrenderer'
import PublicPageBlocksRenderer from '@/entities/page-block/ui/publicpageblocksrenderer'
import { getPublishedPageRenderDataBySlug } from '@/lib/sections/publicpagedata'
import { logDatabaseFallback } from '@/lib/utils/dbfallbacklogger'
import {
	buildFaqSchema,
	extractFaqItemsFromSections,
} from '@/lib/seo/schema/builders/faq'

export const revalidate = 3600
export const dynamicParams = false

export async function generateStaticParams() {
	try {
		const pages = await prisma.page.findMany({
			where: { isPublished: true, isSystem: false },
			select: { slug: true },
		})
		return pages.map(p => ({ slug: p.slug }))
	} catch (error) {
		logDatabaseFallback('pages.generate-static-params', error)
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

	if (!page) notFound()
	const seo = await getMetadataForPage({
		id: page.id,
		title: page.title,
		content: page.content,
		metaTitle: page.metaTitle,
		metaDesc: page.metaDesc,
		imagePath: page.imagePath,
		image: page.image,
	})
	const metadata = seoToMetadata(seo)

	return {
		...metadata,
		alternates: {
			...(metadata.alternates ?? {}),
			canonical:
				metadata.alternates?.canonical ?? `https://aurasveta.by/pages/${slug}`,
		},
	}
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

	// Собираем FAQ-пары из FAQ-секций для JSON-LD (SEO-CLAIM-035 / E6)
	const faqItems = extractFaqItemsFromSections(unifiedSections)
	const faqSchema = buildFaqSchema(faqItems)

	return (
		<div className='flex flex-col bg-background'>
			{/* JSON-LD: FAQPage — только если на странице есть FAQ-секции (SEO-CLAIM-035) */}
			{faqSchema && (
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
				/>
			)}
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Breadcrumbs
					items={[{ label: 'Главная', href: '/' }, { label: page.title }]}
				/>

				{hasUnifiedSections ? (
					<div className='py-6 md:py-8'>
						{/* Семантический h1 — видимый заголовок страницы */}
						<h1 className='mb-6 text-3xl font-bold tracking-tight'>{page.title}</h1>
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

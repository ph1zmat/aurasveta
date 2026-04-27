import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { trpc } from '@/lib/trpc/server'
import { prisma } from '@/lib/prisma'
import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'
import DeferredImage from '@/shared/ui/DeferredImage'
import PageRenderer from '@/widgets/page-renderer/PageRenderer'

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
	const page = await trpc.pages.getBySlug(slug)

	if (!page) return { title: 'Страница не найдена' }
	const resolvedImage =
		page.imageUrl ?? resolveStorageFileUrl(page.imagePath ?? page.image)
	const seo = (page.seo ?? {}) as Record<string, unknown>
	const seoTitle = typeof seo.title === 'string' ? seo.title : undefined
	const seoDesc =
		typeof seo.description === 'string' ? seo.description : undefined

	return {
		title: seoTitle || page.metaTitle || page.title,
		description: seoDesc || page.metaDesc || undefined,
		openGraph: {
			title: seoTitle || page.metaTitle || page.title,
			description: seoDesc || page.metaDesc || undefined,
			images: resolvedImage ? [resolvedImage] : undefined,
		},
	}
}

export default async function ContentPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const page = await trpc.pages.getBySlug(slug)

	if (!page) notFound()
	const resolvedImage =
		page.imageUrl ?? resolveStorageFileUrl(page.imagePath ?? page.image)
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
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

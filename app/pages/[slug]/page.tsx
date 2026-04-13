import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { trpc } from '@/lib/trpc/server'
import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const page = await trpc.pages.getBySlug(slug)

	if (!page) return { title: 'Страница не найдена' }

	return {
		title: page.metaTitle || page.title,
		description: page.metaDesc || undefined,
		openGraph: {
			title: page.metaTitle || page.title,
			description: page.metaDesc || undefined,
			images: (page.imagePath ?? page.image) ? [page.imagePath ?? page.image!] : undefined,
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

	return (
		<div className='flex flex-col bg-background'>
			<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Breadcrumbs
					items={[
						{ label: 'Главная', href: '/' },
						{ label: page.title },
					]}
				/>

				<article className='prose prose-neutral dark:prose-invert mx-auto max-w-3xl py-8'>
					{(page.imagePath ?? page.image) && (
						<Image
							src={(page.imagePath ?? page.image)!}
							alt={page.title}
							width={800}
							height={400}
							className='mb-8 w-full rounded-lg object-cover'
						/>
					)}
					<h1>{page.title}</h1>
					<div dangerouslySetInnerHTML={{ __html: page.content ?? '' }} />
				</article>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

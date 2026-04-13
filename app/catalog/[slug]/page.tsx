import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CategoryContent from './CategoryContent'
import { Suspense } from 'react'
import { trpc } from '@/lib/trpc/server'
import type { Metadata } from 'next'
import { getMetadataForCategory, seoToMetadata } from '@/lib/seo/getMetadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const category = await trpc.categories.getBySlug(slug)
	if (!category) return { title: 'Категория не найдена' }

	const seo = await getMetadataForCategory({
		id: category.id,
		name: category.name,
		description: category.description,
	})
	return seoToMetadata(seo)
}

export default async function CategoryPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params

	// Prefetch category and products for instant hydration
	void trpc.categories.getBySlug.prefetch(slug)
	void trpc.categories.getTree.prefetch()
	void trpc.products.getMany.prefetch({
		categorySlug: slug,
		page: 1,
		limit: 12,
	})

	return (
		<div className='flex flex-col bg-background'>
			<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Suspense
					fallback={
						<div className='py-12 text-center text-sm text-muted-foreground'>
							Загрузка...
						</div>
					}
				>
					<CategoryContent slug={slug} />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import CategoryContent from './CategoryContent'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function CategoryPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params

	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<main className='flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Breadcrumbs
					items={[
						{ label: 'Главная', href: '/' },
						{ label: 'Каталог', href: '/catalog' },
						{ label: slug },
					]}
				/>

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

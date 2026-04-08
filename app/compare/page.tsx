import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CompareContent from './CompareContent'
import { Suspense } from 'react'

export const metadata = {
	title: 'Сравнение — Аура Света',
}

export default function ComparePage() {
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<main className='flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
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
					<CompareContent />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

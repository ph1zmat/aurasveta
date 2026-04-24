import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CompareContent from './CompareContent'
import { Suspense } from 'react'
import { CompareContentSkeleton } from '@/shared/ui/storefront-skeletons'

export const metadata = {
	title: 'Сравнение — Аура Света',
}

export default function ComparePage() {
	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Suspense
					fallback={<CompareContentSkeleton />}
				>
					<CompareContent />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

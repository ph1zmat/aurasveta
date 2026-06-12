import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import CompareContent from './comparecontent'
import { Suspense } from 'react'
import { CompareContentSkeleton } from '@/shared/ui/storefrontskeletons'

export const metadata = {
	title: 'Сравнение — Аура Света',
	robots: { index: false, follow: true },
}

export default function ComparePage() {
	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Suspense fallback={<CompareContentSkeleton />}>
					<CompareContent />
				</Suspense>
			</main>

			<Footer />
		</div>
	)
}

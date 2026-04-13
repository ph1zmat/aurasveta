import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CompareContent from './CompareContent'
import { Suspense } from 'react'
import Skeleton from '@/shared/ui/Skeleton'

export const metadata = {
	title: 'Сравнение — Аура Света',
}

export default function ComparePage() {
	return (
		<div className='flex flex-col bg-background'>
			<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Suspense
					fallback={
						<div className='py-8 space-y-4'>
							<Skeleton className='h-7 w-56' />
							<div className='overflow-x-auto pb-4'>
								<div className='min-w-[700px] space-y-3'>
									{Array.from({ length: 6 }).map((_, i) => (
										<Skeleton key={i} className='h-10 w-full' />
									))}
								</div>
							</div>
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

import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CartContent from './CartContent'
import { Suspense } from 'react'
import Skeleton from '@/shared/ui/Skeleton'

export const metadata = {
	title: 'Корзина — Аура Света',
}

export default function CartPage() {
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
							<div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]'>
								<div className='space-y-4'>
									{Array.from({ length: 3 }).map((_, i) => (
										<div
											key={i}
											className='rounded-2xl border border-border p-4'
										>
											<div className='flex gap-4'>
												<Skeleton className='h-20 w-20 rounded-xl' />
												<div className='flex-1 space-y-2'>
													<Skeleton className='h-4 w-3/4' />
													<Skeleton className='h-3 w-1/2' />
													<Skeleton className='h-3 w-1/3' />
												</div>
											</div>
										</div>
									))}
								</div>
								<div className='rounded-2xl border border-border p-4 space-y-3'>
									<Skeleton className='h-5 w-40' />
									<Skeleton className='h-4 w-full' />
									<Skeleton className='h-4 w-4/5' />
									<Skeleton className='h-10 w-full rounded-lg' />
								</div>
							</div>
						</div>
					}
				>
					<CartContent />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CartContent from './CartContent'
import { Suspense } from 'react'
import { trpc, HydrateClient } from '@/lib/trpc/server'
import { CartContentSkeleton } from '@/shared/ui/storefront-skeletons'

export const metadata = {
	title: 'Корзина — Аура Света',
}

export default async function CartPage() {
	// Prefetch cart for authenticated users (silently fails for anon)
	void trpc.cart.get.prefetch().catch(() => {})

	return (
		<HydrateClient>
			<div className='flex flex-col bg-background'>
				<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
					<TopBar />
					<Header />
					<CategoryNav />

					<Suspense
						fallback={<CartContentSkeleton />}
					>
						<CartContent />
					</Suspense>
				</main>

				<Footer />
				<ChatButton />
			</div>
		</HydrateClient>
	)
}

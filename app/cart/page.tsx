import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import CartContent from './cartcontent'
import { Suspense } from 'react'
import { trpc, HydrateClient } from '@/lib/trpc/server'
import { CartContentSkeleton } from '@/shared/ui/storefrontskeletons'

export const metadata = {
	title: 'Корзина — Аура Света',
	robots: { index: false, follow: true },
}

export default async function CartPage() {
	// Prefetch cart for authenticated users (silently fails for anon)
	void trpc.cart.get.prefetch().catch(() => {})

	return (
		<HydrateClient>
			<div className='flex flex-col bg-background'>
				<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
					<TopBar />
					<Header />
					<CategoryNav />

					<Suspense fallback={<CartContentSkeleton />}>
						<CartContent />
					</Suspense>
				</main>

				<Footer />
			</div>
		</HydrateClient>
	)
}

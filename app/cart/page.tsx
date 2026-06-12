import CartContent from './cartcontent'
import { trpc, HydrateClient } from '@/lib/trpc/server'

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
					<CartContent />
				</main>
			</div>
		</HydrateClient>
	)
}

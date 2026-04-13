import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CartContent from './CartContent'
import { Suspense } from 'react'

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

				<Suspense fallback={<div className='py-12 text-center text-sm text-muted-foreground'>Загрузка корзины...</div>}>
					<CartContent />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

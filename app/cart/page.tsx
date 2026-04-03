import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/layout/CategoryNav'
import Footer from '@/components/layout/Footer'
import ChatButton from '@/components/ui/ChatButton'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'
import CouponForm from '@/components/cart/CouponForm'
import RecentlyViewedMini from '@/components/cart/RecentlyViewedMini'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { CartItemData } from '@/types/cart'
import type { RecentlyViewedItem } from '@/components/cart/RecentlyViewedMini'
import { mockCartItems } from '@/mocks/cart'
import { mockProducts } from '@/mocks/products'

/* ── Mock data ── */

const cartItems: CartItemData[] = mockCartItems

const recentlyViewed: RecentlyViewedItem[] = mockProducts
	.slice(21, 25)
	.map(p => ({
		name: p.name,
		href: `/product/${p.slug}`,
		image: p.images[0],
	}))

/* ── Page ── */

export default function CartPage() {
	const itemsCount = cartItems.length
	const subtotal = cartItems.reduce(
		(sum, item) => sum + (item.oldPrice ?? item.price) * item.quantity,
		0,
	)
	const total = cartItems.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	)
	const discount = subtotal - total
	const bonusAmount = Math.round(total * 0.06)

	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<main className='flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				{/* Cart heading */}
				<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
					<h1 className='text-lg font-bold uppercase tracking-wider text-foreground md:text-xl'>
						В корзине {itemsCount} товара
					</h1>
					<Button variant='ghost' className='gap-2 self-start'>
						<Link2 className='h-4 w-4' strokeWidth={1.5} />
						Поделиться корзиной
					</Button>
				</div>

				{/* Two-column layout */}
				<div className='flex flex-col gap-8 lg:flex-row'>
					{/* Left: Items + Coupon */}
					<div className='min-w-0 flex-1'>
						{/* Cart items */}
						<div>
							{cartItems.map(item => (
								<CartItem key={item.id} item={item} />
							))}
						</div>

						{/* Coupon form */}
						<CouponForm />
					</div>

					{/* Right: Summary */}
					<div className='w-full shrink-0 lg:w-80'>
						<div className='lg:sticky lg:top-4'>
							<CartSummary
								itemsCount={itemsCount}
								subtotal={subtotal}
								discount={discount}
								bonusAmount={bonusAmount}
							/>
						</div>
					</div>
				</div>

				{/* Recently viewed */}
				<RecentlyViewedMini items={recentlyViewed} />
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

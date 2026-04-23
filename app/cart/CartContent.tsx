'use client'

import { useMemo, useState } from 'react'
import { useCart } from '@/features/cart/useCart'
import CartItem from '@/features/cart/ui/CartItem'
import CartSummary from '@/features/cart/ui/CartSummary'
import type { CartItemData } from '@/entities/cart/model/types'
import { Button } from '@/shared/ui/Button'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'
import EmptyState from '@/shared/ui/EmptyState'
import { trpc } from '@/lib/trpc/client'
import { getProductImageUrl } from '@/shared/lib/product-utils'
import type { ProductImage } from '@/shared/types/product'
import { CartContentSkeleton } from '@/shared/ui/storefront-skeletons'

type AnonCartProduct = {
	id: string
	slug: string
	name: string
	price?: number | null
	compareAtPrice?: number | null
	images?: ProductImage[] | null
}

export default function CartContent() {
	const {
		items: rawItems,
		serverCartWithProducts,
		remove,
		updateQuantity,
		clear,
		isAuth,
	} = useCart()

	// For auth users: use product data already included in cart.get
	// For anon users: fetch product details separately
	const anonItemIds = !isAuth ? rawItems.map(i => i.productId) : []
	const { data: anonProductsData } = trpc.products.getByIds.useQuery(
		anonItemIds,
		{
			enabled: anonItemIds.length > 0,
		},
	)

	const cartItems: CartItemData[] = useMemo(() => {
		if (isAuth) {
			// Use enriched data from cart.get (includes product)
			return (serverCartWithProducts as Array<Record<string, unknown>>)
				.map(item => {
					const p = item.product as Record<string, unknown> | null
					if (!p) return null
					const image = getProductImageUrl(
						{
							images: Array.isArray(p.images)
								? (p.images as ProductImage[])
								: [],
						},
						'/bulb.svg',
					)
					return {
						id: String(item.productId),
						name: String(p.name ?? ''),
						href: `/product/${p.slug}`,
						image,
						price: Number(p.price ?? 0),
						oldPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
						quantity: Number(item.quantity),
					}
				})
				.filter(Boolean) as CartItemData[]
		}

		// Anon: use separately fetched product data
		const anonProducts = (anonProductsData ?? []) as unknown as AnonCartProduct[]
		const productMap = new Map(anonProducts.map(product => [product.id, product]))
		return rawItems
			.map(item => {
				const p = productMap.get(item.productId)
				if (!p) return null
				return {
					id: item.productId,
					name: p.name,
					href: `/product/${p.slug}`,
					image: getProductImageUrl(p),
					price: p.price ?? 0,
					oldPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
					quantity: item.quantity,
				}
			})
			.filter(Boolean) as CartItemData[]
	}, [isAuth, serverCartWithProducts, rawItems, anonProductsData])

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

	// Checkout state
	const [showCheckout, setShowCheckout] = useState(false)
	const [address, setAddress] = useState('')
	const [phone, setPhone] = useState('')
	const [comment, setComment] = useState('')
	const [testPushLoading, setTestPushLoading] = useState(false)

	const addressError = useMemo(() => {
		const v = address.trim()
		if (v.length === 0) return 'Укажите адрес доставки'
		if (v.length < 8) return 'Слишком короткий адрес'
		return ''
	}, [address])

	const phoneError = useMemo(() => {
		const v = phone.trim()
		if (v.length === 0) return 'Укажите номер телефона'
		const digits = v.replace(/[^\d+]/g, '').replace(/\+/g, '')
		if (digits.length < 10) return 'Телефон слишком короткий'
		if (digits.length > 15) return 'Телефон слишком длинный'
		return ''
	}, [phone])

	const isCheckoutValid = addressError === '' && phoneError === ''

	const createOrderMut = trpc.orders.create.useMutation({
		onSuccess: () => {
			setShowCheckout(false)
			clear()
			toast.success('Заказ успешно оформлен')
		},
		onError: err => {
			toast.error(err.message || 'Не удалось оформить заказ')
		},
	})

	function handleCheckout() {
		if (!isAuth) {
			toast.error('Для оформления заказа необходимо войти в аккаунт', {
				action: {
					label: 'Войти',
					onClick: () => (window.location.href = '/login'),
				},
			})
			return
		}
		setShowCheckout(true)
	}

	async function handleTestPush() {
		setTestPushLoading(true)
		try {
			const res = await fetch('/api/desktop/test-push', { method: 'POST' })
			if (res.ok) {
				toast.success('Тестовое уведомление отправлено')
			} else {
				const data = await res.json().catch(() => ({}))
				toast.error(data.error || 'Не удалось отправить тестовое уведомление')
			}
		} catch {
			toast.error('Ошибка сети')
		} finally {
			setTestPushLoading(false)
		}
	}

	function handleCreateOrder(e: React.FormEvent) {
		e.preventDefault()
		if (!isCheckoutValid) {
			toast.error('Проверьте данные доставки')
			return
		}
		createOrderMut.mutate({
			address,
			phone,
			comment: comment || undefined,
			items: rawItems,
		})
	}

	// Show loading only when we have cart items but product data is still fetching
	if (
		rawItems.length > 0 &&
		cartItems.length === 0 &&
		(!isAuth || serverCartWithProducts.length > 0)
	) {
		return <CartContentSkeleton />
	}

	if (itemsCount === 0) {
		return (
			<EmptyState
				title='Корзина пуста'
				description='Добавьте товары в корзину, чтобы перейти к оформлению заказа.'
				primaryAction={{ label: 'Перейти в каталог', href: '/catalog' }}
				secondaryAction={{ label: 'На главную', href: '/' }}
			/>
		)
	}

	return (
		<>
			<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
				<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-xl'>
					В корзине {itemsCount} товара
				</h1>
				<div className='flex gap-2 self-start'>
					<Button variant='ghost' className='gap-2'>
						<Link2 className='h-4 w-4' strokeWidth={1.5} />
						Поделиться корзиной
					</Button>
					<Button
						variant='outline'
						className='gap-2'
						onClick={handleTestPush}
						disabled={testPushLoading}
					>
						{testPushLoading ? 'Отправка...' : 'Тестировать пуш'}
					</Button>
				</div>
			</div>

			<div className='flex flex-col gap-8 lg:flex-row'>
				<div className='min-w-0 flex-1'>
					{cartItems.map(item => (
						<CartItem
							key={item.id}
							item={item}
							onQuantityChange={(id, qty) => updateQuantity(id, qty)}
							onRemove={id => remove(id)}
						/>
					))}
				</div>

				<div className='w-full shrink-0 lg:w-80'>
					<div className='lg:sticky lg:top-4'>
						<CartSummary
							itemsCount={itemsCount}
							subtotal={subtotal}
							discount={discount}
							bonusAmount={bonusAmount}
							onCheckout={handleCheckout}
						/>
					</div>
				</div>
			</div>

			{/* Checkout form */}
			{showCheckout && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
					<div className='max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-background p-6 shadow-xl'>
						<h2 className='mb-4 text-lg font-semibold text-foreground'>
							Оформление заказа
						</h2>
						<form onSubmit={handleCreateOrder} className='space-y-4'>
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Адрес доставки</label>
								<input
									required
									value={address}
									onChange={e => setAddress(e.target.value)}
									aria-invalid={addressError ? true : undefined}
									aria-describedby={
										addressError ? 'checkout-address-error' : undefined
									}
									className='flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
									placeholder='г. Мозырь, ул. ...'
								/>
								{addressError && (
									<p
										id='checkout-address-error'
										className='text-xs text-destructive'
									>
										{addressError}
									</p>
								)}
							</div>
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Телефон</label>
								<input
									required
									value={phone}
									onChange={e => setPhone(e.target.value)}
									inputMode='tel'
									autoComplete='tel'
									aria-invalid={phoneError ? true : undefined}
									aria-describedby={
										phoneError ? 'checkout-phone-error' : undefined
									}
									className='flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
									placeholder='+375 29 123-45-67'
								/>
								{phoneError && (
									<p
										id='checkout-phone-error'
										className='text-xs text-destructive'
									>
										{phoneError}
									</p>
								)}
							</div>
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Комментарий</label>
								<textarea
									value={comment}
									onChange={e => setComment(e.target.value)}
									rows={3}
									className='flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary'
								/>
							</div>
							<div className='rounded-lg bg-muted/50 p-3 text-sm'>
								<p>
									Итого: <strong>{total.toLocaleString('ru-RU')} ₽</strong>
								</p>
							</div>
							<div className='flex gap-3'>
								<Button
									type='button'
									variant='outline'
									onClick={() => setShowCheckout(false)}
								>
									Отмена
								</Button>
								<Button
									type='submit'
									variant='primary'
									disabled={createOrderMut.isPending || !isCheckoutValid}
								>
									{createOrderMut.isPending
										? 'Оформление...'
										: 'Оформить заказ'}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	)
}

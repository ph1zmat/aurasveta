'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useCart } from '@/features/cart/useCart'
import CartItem from '@/features/cart/ui/CartItem'
import CartSummary from '@/features/cart/ui/CartSummary'
import type { CartItemData } from '@/entities/cart/model/types'
import { Button } from '@/shared/ui/Button'
import { Link2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import EmptyState from '@/shared/ui/EmptyState'

export default function CartContent() {
	const { items: rawItems, remove, updateQuantity, clear, isAuth } = useCart()

	// Fetch product details for all items in cart
	const cartItemIds = rawItems.map(i => i.productId)
	const { data: productsData } = trpc.products.getByIds.useQuery(cartItemIds, {
		enabled: cartItemIds.length > 0,
	})

	const productMap = new Map((productsData ?? []).map(p => [p.id, p]))

	const cartItems: CartItemData[] = rawItems
		.map(item => {
			const p = productMap.get(item.productId)
			if (!p) return null
			return {
				id: item.productId,
				name: p.name,
				href: `/product/${p.slug}`,
				image:
					(p as { imagePath?: string | null }).imagePath ??
					(Array.isArray(p.images) ? (p.images as string[])[0] : null) ??
					'/bulb.svg',
				price: p.price ?? 0,
				oldPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
				quantity: item.quantity,
			}
		})
		.filter(Boolean) as CartItemData[]

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
		onError: (err) => {
			toast.error(err.message || 'Не удалось оформить заказ')
		},
	})

	function handleCheckout() {
		if (!isAuth) {
			toast.error('Для оформления заказа необходимо войти в аккаунт', {
				action: { label: 'Войти', onClick: () => (window.location.href = '/login') },
			})
			return
		}
		setShowCheckout(true)
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

	if (itemsCount === 0 && !productsData) {
		return (
			<div className='py-12 text-center'>
				<p className='text-sm text-muted-foreground'>Загрузка корзины...</p>
			</div>
		)
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
				<Button variant='ghost' className='gap-2 self-start'>
					<Link2 className='h-4 w-4' strokeWidth={1.5} />
					Поделиться корзиной
				</Button>
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
									aria-describedby={addressError ? 'checkout-address-error' : undefined}
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
									aria-describedby={phoneError ? 'checkout-phone-error' : undefined}
									className='flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
									placeholder='+375 29 123-45-67'
								/>
								{phoneError && (
									<p id='checkout-phone-error' className='text-xs text-destructive'>
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

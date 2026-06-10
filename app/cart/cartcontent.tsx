'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useCart } from '@/features/cart/usecart'
import CartItem from '@/features/cart/ui/cartitem'
import CartSummary from '@/features/cart/ui/cartsummary'
import {
	splitHighlightedText,
	type AddressAutocompleteSuggestion,
} from '@/shared/lib/address-autocomplete'
import {
	calculateDeliveryCost,
	getDeliveryExplanation,
	getDeliveryPreviewLabel,
} from '@/shared/lib/delivery'
import type { CartItemData } from '@/entities/cart/model/types'
import { Button } from '@/shared/ui/button'
import Field from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { FaPhoneAlt, FaViber } from 'react-icons/fa'
import { toast } from 'sonner'
import EmptyState from '@/shared/ui/emptystate'
import { trpc } from '@/lib/trpc/client'
import { getProductImageUrl } from '@/shared/lib/productutils'
import { cn } from '@/shared/lib/utils'
import type { ProductImage } from '@/shared/types/product'
import { CartContentSkeleton } from '@/shared/ui/storefrontskeletons'
import { PriceBYN } from '@/shared/ui/pricebyn'

const CITY_SUGGESTIONS = [
	'Мозырь',
	'Минск',
	'Гомель',
	'Брест',
	'Витебск',
	'Гродно',
	'Могилёв',
	'Барановичи',
	'Бобруйск',
	'Жлобин',
	'Пинск',
	'Речица',
	'Светлогорск',
	'Солигорск',
	'Лида',
] as const

type AnonCartProduct = {
	id: string
	slug: string
	name: string
	price?: number | null
	compareAtPrice?: number | null
	images?: ProductImage[] | null
}

const CONTACT_METHOD_OPTIONS = [
	{
		value: 'PHONE' as const,
		label: 'По номеру телефона',
		description: 'Позвоним по указанному номеру',
		Icon: FaPhoneAlt,
	},
	{
		value: 'VIBER' as const,
		label: 'Через Viber',
		description: 'Напишем в Viber на этот номер',
		Icon: FaViber,
	},
] as const

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
		const anonProducts = (anonProductsData ??
			[]) as unknown as AnonCartProduct[]
		const productMap = new Map(
			anonProducts.map(product => [product.id, product]),
		)
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
	const orderItems = useMemo(
		() =>
			cartItems.map(item => ({
				productId: item.id,
				quantity: item.quantity,
			})),
		[cartItems],
	)
	const subtotal = cartItems.reduce(
		(sum, item) => sum + (item.oldPrice ?? item.price) * item.quantity,
		0,
	)
	const productsTotal = cartItems.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	)
	const discount = subtotal - productsTotal
	const bonusAmount = Math.round(productsTotal * 0.06)
	const deliveryPreviewLabel = useMemo(
		() => getDeliveryPreviewLabel(productsTotal),
		[productsTotal],
	)

	// Checkout state
	const [showCheckout, setShowCheckout] = useState(false)
	const [city, setCity] = useState('')
	const [address, setAddress] = useState('')
	const [phone, setPhone] = useState('')
	const [contactMethod, setContactMethod] = useState<'PHONE' | 'VIBER'>('PHONE')
	const [comment, setComment] = useState('')
	const [testPushLoading, setTestPushLoading] = useState(false)
	const [addressSuggestions, setAddressSuggestions] = useState<
		AddressAutocompleteSuggestion[]
	>([])
	const [isAddressLoading, setIsAddressLoading] = useState(false)
	const [isAddressSuggestionsOpen, setIsAddressSuggestionsOpen] = useState(false)
	const [addressAutocompleteError, setAddressAutocompleteError] = useState('')
	const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
	const cityFieldId = useId()
	const addressFieldId = useId()
	const phoneFieldId = useId()
	const commentFieldId = useId()
	const checkoutDialogTitleId = useId()
	const checkoutDialogDescriptionId = useId()
	const addressSuggestionsId = useId()
	const checkoutDelivery = useMemo(() => {
		if (city.trim().length === 0 && address.trim().length === 0) return null
		return calculateDeliveryCost({
			subtotal: productsTotal,
			city,
			address,
		})
	}, [address, city, productsTotal])
	const checkoutTotal = productsTotal + (checkoutDelivery?.cost ?? 0)
	const normalizedCity = city.trim()

	const cityError = useMemo(() => {
		const v = normalizedCity
		if (v.length === 0) return 'Укажите город доставки'
		if (v.length < 2) return 'Слишком короткое название города'
		return ''
	}, [normalizedCity])

	const addressError = useMemo(() => {
		const v = address.trim()
		if (v.length === 0) return 'Укажите адрес доставки'
		if (v.length < 5) return 'Слишком короткий адрес'
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

	const isCheckoutValid = cityError === '' && addressError === '' && phoneError === ''

	useEffect(() => {
		const normalizedCityValue = city.trim()
		const normalizedAddressValue = address.trim()

		if (normalizedCityValue.length < 2 || normalizedAddressValue.length < 3) {
			setAddressSuggestions([])
			setAddressAutocompleteError('')
			setIsAddressLoading(false)
			setActiveSuggestionIndex(-1)
			return
		}

		const controller = new AbortController()
		const timeout = setTimeout(async () => {
			setIsAddressLoading(true)
			setAddressAutocompleteError('')
			try {
				const response = await fetch(
					`/api/address/autocomplete?city=${encodeURIComponent(normalizedCityValue)}&q=${encodeURIComponent(normalizedAddressValue)}`,
					{ signal: controller.signal },
				)
				const payload = (await response.json().catch(() => ({ suggestions: [] }))) as {
					suggestions?: AddressAutocompleteSuggestion[]
				}
				const suggestions = Array.isArray(payload.suggestions)
					? payload.suggestions
					: []
				setAddressSuggestions(suggestions)
				setIsAddressSuggestionsOpen(suggestions.length > 0)
				setActiveSuggestionIndex(suggestions.length > 0 ? 0 : -1)
			} catch (error) {
				if ((error as Error).name === 'AbortError') return
				setAddressSuggestions([])
				setIsAddressSuggestionsOpen(false)
				setActiveSuggestionIndex(-1)
				setAddressAutocompleteError(
					'Не удалось загрузить подсказки адреса. Можно продолжить ввод вручную.',
				)
			} finally {
				setIsAddressLoading(false)
			}
		}, 320)

		return () => {
			controller.abort()
			clearTimeout(timeout)
		}
	}, [address, city])

	useEffect(() => {
		if (!showCheckout) {
			document.body.style.overflow = ''
			return
		}

		document.body.style.overflow = 'hidden'
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setShowCheckout(false)
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => {
			document.body.style.overflow = ''
			document.removeEventListener('keydown', handleEscape)
		}
	}, [showCheckout])

	function applyAddressSuggestion(suggestion: AddressAutocompleteSuggestion) {
		setAddress(suggestion.addressLine)
		if (suggestion.city) {
			setCity(suggestion.city)
		}
		setAddressSuggestions([])
		setIsAddressSuggestionsOpen(false)
		setAddressAutocompleteError('')
		setActiveSuggestionIndex(-1)
	}

	function handleAddressKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (!isAddressSuggestionsOpen || addressSuggestions.length === 0) {
			if (event.key === 'Escape') {
				setIsAddressSuggestionsOpen(false)
				setActiveSuggestionIndex(-1)
			}
			return
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault()
			setActiveSuggestionIndex(prev =>
				prev < addressSuggestions.length - 1 ? prev + 1 : 0,
			)
			return
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault()
			setActiveSuggestionIndex(prev =>
				prev > 0 ? prev - 1 : addressSuggestions.length - 1,
			)
			return
		}

		if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
			event.preventDefault()
			applyAddressSuggestion(addressSuggestions[activeSuggestionIndex])
			return
		}

		if (event.key === 'Escape') {
			event.preventDefault()
			setIsAddressSuggestionsOpen(false)
			setActiveSuggestionIndex(-1)
		}
	}

	function renderHighlightedText(value: string, query: string) {
		return splitHighlightedText(value, query).map((part, index) =>
			part.highlighted ? (
				<mark
					key={`${part.text}-${index}`}
					className='rounded-sm bg-primary/15 px-0.5 text-foreground'
				>
					{part.text}
				</mark>
			) : (
				<span key={`${part.text}-${index}`}>{part.text}</span>
			),
		)
	}

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
			const data = (await res.json().catch(() => ({}))) as {
				message?: string
				error?: string
				result?: { sent?: number; totalDevices?: number; diagnostics?: string[] }
			}
			if (res.ok) {
				toast.success(data.message || 'Тестовое уведомление отправлено')
			} else {
				toast.error(
					data.message || data.error || 'Не удалось отправить тестовое уведомление',
				)
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
		if (orderItems.length === 0) {
			toast.error('В корзине нет доступных товаров для оформления')
			return
		}
		createOrderMut.mutate({
			city: normalizedCity,
			address,
			phone,
			contactMethod,
			comment: comment || undefined,
			items: orderItems,
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
			<div className='flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-end sm:justify-between md:py-6'>
				<div>
					<p className='mb-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Оформление заказа
					</p>
					<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-xl'>
						В корзине {itemsCount} {pluralizeProduct(itemsCount)}
					</h1>
					<p className='mt-2 text-sm text-muted-foreground'>
						Проверьте состав заказа, стоимость доставки и перейдите к оформлению.
					</p>
				</div>
				<div className='flex flex-wrap gap-2 self-start'>
					<Button variant='ghost' onClick={clear}>
						Очистить корзину
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
							deliveryLabel={deliveryPreviewLabel}
							bonusAmount={bonusAmount}
							onCheckout={handleCheckout}
						/>
					</div>
				</div>
			</div>

			{/* Checkout form */}
			{showCheckout && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]'>
					<button
						type='button'
						aria-label='Закрыть оформление заказа'
						className='absolute inset-0 cursor-default'
						onClick={() => setShowCheckout(false)}
					/>
					<div
						role='dialog'
						aria-modal='true'
						aria-labelledby={checkoutDialogTitleId}
						aria-describedby={checkoutDialogDescriptionId}
						className='relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-background p-6 shadow-2xl'
					>
						<div className='mb-5 flex items-start justify-between gap-4 border-b border-border pb-4'>
							<div>
								<p className='mb-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground'>
									Заказ
								</p>
								<h2 id={checkoutDialogTitleId} className='text-lg font-semibold text-foreground'>
							Оформление заказа
								</h2>
								<p id={checkoutDialogDescriptionId} className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
									Укажите данные для связи и доставки. Стоимость пересчитается автоматически по городу и адресу.
								</p>
							</div>
							<Button
								type='button'
								variant='icon'
								size='icon'
								onClick={() => setShowCheckout(false)}
								aria-label='Закрыть оформление заказа'
							>
								<X className='h-4 w-4' strokeWidth={1.5} />
							</Button>
						</div>

						<div className='mb-5 grid gap-3 rounded-2xl border border-border bg-card/50 p-4 sm:grid-cols-3'>
							<div>
								<p className='text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground'>
									Товары
								</p>
								<p className='mt-2 text-sm font-medium text-foreground'>
									{itemsCount} {pluralizeProduct(itemsCount)}
								</p>
							</div>
							<div>
								<p className='text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground'>
									Сумма товаров
								</p>
								<div className='mt-2'>
									<PriceBYN value={productsTotal} className='text-sm font-medium' />
								</div>
							</div>
							<div>
								<p className='text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground'>
									Доставка
								</p>
								<p className='mt-2 text-sm font-medium text-foreground'>
									{checkoutDelivery ? getDeliveryPreviewLabel(checkoutTotal) : deliveryPreviewLabel}
								</p>
							</div>
						</div>

						<form onSubmit={handleCreateOrder} className='space-y-4'>
							<Field
								label='Город'
								htmlFor={cityFieldId}
								error={cityError}
								hint='Город используем для расчёта доставки: Мозырь — бесплатно, Беларусь — бесплатно от 400 BYN, иначе 100 BYN.'
							>
								<Input
									id={cityFieldId}
									required
									list='checkout-city-suggestions'
									value={city}
									onChange={e => setCity(e.target.value)}
									autoComplete='address-level2'
									aria-invalid={cityError ? true : undefined}
									placeholder='Например, Мозырь'
								/>
								<datalist id='checkout-city-suggestions'>
									{CITY_SUGGESTIONS.map(option => (
										<option key={option} value={option} />
									))}
								</datalist>
							</Field>
							<Field
								label='Адрес доставки'
								htmlFor={addressFieldId}
								error={addressError}
								hint={
									addressAutocompleteError ||
									'Стоимость доставки обновляется сразу после ввода города и адреса. Подсказки адреса приходят из Photon (OpenStreetMap).'
								}
							>
								<div className='relative'>
									<Input
										id={addressFieldId}
										required
										value={address}
										onChange={e => setAddress(e.target.value)}
										onFocus={() => {
											if (addressSuggestions.length > 0) {
												setIsAddressSuggestionsOpen(true)
												setActiveSuggestionIndex(0)
											}
										}}
										onBlur={() => {
											window.setTimeout(() => setIsAddressSuggestionsOpen(false), 120)
										}}
										onKeyDown={handleAddressKeyDown}
										autoComplete='street-address'
										aria-invalid={addressError ? true : undefined}
										aria-describedby={
											addressError ? 'checkout-address-error' : undefined
										}
										aria-autocomplete='list'
										aria-expanded={isAddressSuggestionsOpen}
										aria-controls={addressSuggestionsId}
										aria-activedescendant={
											activeSuggestionIndex >= 0
												? `${addressSuggestionsId}-option-${activeSuggestionIndex}`
												: undefined
										}
										className='pr-20'
										placeholder='Улица, дом, квартира'
									/>
									<div className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-muted-foreground'>
										{isAddressLoading ? 'Поиск…' : 'Photon'}
									</div>
									{isAddressSuggestionsOpen && addressSuggestions.length > 0 && (
										<div
											id={addressSuggestionsId}
											role='listbox'
											className='absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl'
										>
											<ul className='max-h-64 overflow-y-auto py-1'>
												{addressSuggestions.map((suggestion, index) => (
													<li key={suggestion.id}>
														<button
															id={`${addressSuggestionsId}-option-${index}`}
															type='button'
															role='option'
															aria-selected={activeSuggestionIndex === index}
															onMouseDown={e => {
																e.preventDefault()
																applyAddressSuggestion(suggestion)
															}}
															onMouseEnter={() => setActiveSuggestionIndex(index)}
															className={cn(
																'flex w-full flex-col items-start gap-1 px-3 py-2 text-left transition-colors hover:bg-muted/70 focus:bg-muted/70 focus:outline-none',
																activeSuggestionIndex === index && 'bg-muted/70',
															)}
														>
															<span className='text-sm text-foreground'>
																{renderHighlightedText(suggestion.label, address)}
															</span>
															{suggestion.secondaryLabel && (
																<span className='text-xs text-muted-foreground'>
																	{renderHighlightedText(suggestion.secondaryLabel, city)}
																</span>
															)}
														</button>
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							</Field>
							<fieldset className='space-y-2'>
								<legend className='text-sm font-medium'>Способ связи</legend>
								<div
									className='grid grid-cols-1 gap-2 sm:grid-cols-2'
									role='radiogroup'
									aria-label='Выбор способа связи'
								>
									{CONTACT_METHOD_OPTIONS.map(
										({ value, label, description, Icon }) => {
											const isSelected = contactMethod === value
											return (
												<button
													key={value}
													type='button'
													onClick={() => setContactMethod(value)}
													className={`flex min-h-16 items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
														isSelected
															? 'border-primary bg-primary/10 text-foreground shadow-sm'
															: 'border-border bg-background text-muted-foreground hover:bg-muted/50'
													}`}
													role='radio'
													aria-checked={isSelected}
												>
													<Icon className='mt-0.5 h-4 w-4 shrink-0' />
													<span className='flex flex-col'>
														<span className='text-sm font-medium text-foreground'>
															{label}
														</span>
														<span className='text-xs text-muted-foreground'>
															{description}
														</span>
													</span>
												</button>
											)
										},
									)}
								</div>
								<p className='text-xs text-muted-foreground'>
									Используем номер ниже для звонка или сообщения в Viber.
								</p>
							</fieldset>
							<Field label='Телефон' htmlFor={phoneFieldId} error={phoneError}>
								<Input
									id={phoneFieldId}
									required
									value={phone}
									onChange={e => setPhone(e.target.value)}
									inputMode='tel'
									autoComplete='tel'
									aria-invalid={phoneError ? true : undefined}
									placeholder='+375 29 123-45-67'
								/>
							</Field>
							<Field
								label='Комментарий'
								htmlFor={commentFieldId}
								hint='Если нужно, укажите удобное время звонка, код домофона или детали доставки.'
							>
								<Textarea
									id={commentFieldId}
									value={comment}
									onChange={e => setComment(e.target.value)}
									rows={3}
									className='min-h-24 resize-none bg-background'
								/>
							</Field>
							<div className='space-y-3 rounded-lg bg-muted/50 p-3 text-sm'>
								<div className='flex items-center justify-between gap-3'>
									<span className='text-muted-foreground'>Товары</span>
									<PriceBYN value={productsTotal} className='font-medium' />
								</div>
								<div className='flex items-start justify-between gap-3'>
									<span className='text-muted-foreground'>Доставка</span>
									<div className='text-right'>
										{checkoutDelivery ? (
											checkoutDelivery.cost === 0 ? (
												<span className='font-medium text-primary'>Бесплатно</span>
											) : (
												<PriceBYN
													value={checkoutDelivery.cost}
													className='font-medium'
												/>
											)
										) : (
											<span className='text-xs text-foreground'>
												{deliveryPreviewLabel}
											</span>
										)}
									</div>
								</div>
								<div className='border-t border-border/70 pt-3'>
									<div className='flex items-center justify-between gap-3'>
										<span className='font-medium text-foreground'>
											{checkoutDelivery ? 'Итого к оплате' : 'Итого без доставки'}
										</span>
										<PriceBYN value={checkoutDelivery ? checkoutTotal : productsTotal} className='font-semibold' />
									</div>
								</div>
								<p className='text-xs leading-relaxed text-muted-foreground'>
									{checkoutDelivery
										? getDeliveryExplanation(checkoutDelivery)
										: 'Укажите хотя бы город, и мы покажем точную стоимость доставки до оформления.'}
								</p>
							</div>
							<div className='flex flex-col gap-3 border-t border-border pt-4 sm:flex-row'>
								<Button
									type='button'
									variant='outline'
									className='sm:flex-1'
									onClick={() => setShowCheckout(false)}
								>
									Отмена
								</Button>
								<Button
									type='submit'
									variant='primary'
									className='sm:flex-1'
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

function pluralizeProduct(n: number): string {
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod100 >= 11 && mod100 <= 14) return 'товаров'
	if (mod10 === 1) return 'товар'
	if (mod10 >= 2 && mod10 <= 4) return 'товара'
	return 'товаров'
}

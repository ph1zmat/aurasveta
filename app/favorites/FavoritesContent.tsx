'use client'

import { trpc } from '@/lib/trpc/client'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useCompare } from '@/features/compare/useCompare'
import { useCart } from '@/features/cart/useCart'
import FavoriteProductCard from '@/features/favorites/ui/FavoriteProductCard'
import { Button } from '@/shared/ui/Button'
import Link from 'next/link'
import EmptyState from '@/shared/ui/EmptyState'

export default function FavoritesContent() {
	const { productIds, remove, clear, isAuth, serverFavorites } = useFavorites()
	const compare = useCompare()
	const cart = useCart()

	// Fetch product details for anonymous favorites
	const { data: productsData } = trpc.products.getByIds.useQuery(productIds, {
		enabled: !isAuth && productIds.length > 0,
	})

	type FavoriteCardProps = {
		name: string
		href: string
		image: string
		price: number
		oldPrice?: number
		discountPercent?: number
		availability: string
		productId: string
	}

	let products: FavoriteCardProps[] = []

	if (isAuth && serverFavorites.length > 0) {
		products = serverFavorites.map(fav => {
			const p = fav.product
			const price = (p as { price?: number | null }).price
				? Number((p as { price?: number | null }).price)
				: 0
			const compareAtPrice = (p as { compareAtPrice?: number | null })
				.compareAtPrice
				? Number((p as { compareAtPrice?: number | null }).compareAtPrice)
				: undefined
			return {
				name: p.name,
				href: `/product/${p.slug}`,
				image:
					(p as { imagePath?: string | null }).imagePath ??
					(Array.isArray((p as { images?: unknown }).images)
						? (p as { images: string[] }).images[0]
						: null) ?? '/bulb.svg',
				price,
				oldPrice: compareAtPrice,
				discountPercent:
					price && compareAtPrice
						? Math.round((1 - price / compareAtPrice) * 100)
						: undefined,
				availability:
					((p as { stock?: number }).stock ?? 0) > 0
						? 'В наличии'
						: 'Нет в наличии',
				productId: fav.productId,
			}
		})
	} else if (!isAuth && productsData) {
		products = productsData
			.filter(p => productIds.includes(p.id))
			.map(p => {
				const price = p.price ? Number(p.price) : 0
				const compareAtPrice = p.compareAtPrice
					? Number(p.compareAtPrice)
					: undefined
				return {
					name: p.name,
					href: `/product/${p.slug}`,
					image:
						(p as { imagePath?: string | null }).imagePath ??
						(Array.isArray(p.images) ? (p.images as string[])[0] : null) ??
						'/bulb.svg',
					price,
					oldPrice: compareAtPrice,
					discountPercent:
						price && compareAtPrice
							? Math.round((1 - price / compareAtPrice) * 100)
							: undefined,
					availability: p.stock > 0 ? 'В наличии' : 'Нет в наличии',
					productId: p.id,
				}
			})
	}

	function handleRemove(productId: string) {
		remove(productId)
	}

	function handleClearAll() {
		clear()
	}

	if (products.length === 0) {
		return (
			<EmptyState
				title='Избранное пусто'
				description='Сохраняйте товары, чтобы быстро вернуться к ним позже.'
				primaryAction={{ label: 'Перейти в каталог', href: '/catalog' }}
			/>
		)
	}

	return (
		<>
			<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
				<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-xl'>
					Избранное
				</h1>
				<Button
					variant='ghost'
					className='uppercase tracking-widest'
					onClick={handleClearAll}
				>
					Удалить все
				</Button>
			</div>

			<p className='py-4 text-sm tracking-wider text-muted-foreground'>
				{products.length} товара
			</p>

			<div className='grid grid-cols-1 gap-6 pb-8 sm:grid-cols-2 lg:grid-cols-3'>
				{products.map(product => (
					<FavoriteProductCard
						key={product.href}
						{...product}
						onRemove={() => handleRemove(product.productId)}
						onToggleCompare={() => compare.toggle(product.productId)}
						isCompare={compare.has(product.productId)}
						onAddToCart={() => cart.add(product.productId)}
					/>
				))}
			</div>
		</>
	)
}

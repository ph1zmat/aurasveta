'use client'

import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useCompare } from '@/features/compare/useCompare'
import { useCart } from '@/features/cart/useCart'
import {
	type DbProduct,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { toFavoriteCardProps } from '@/features/favorites/model/adapters'
import FavoriteProductCard from '@/features/favorites/ui/FavoriteProductCard'
import { Button } from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import { FavoritesContentSkeleton } from '@/shared/ui/storefront-skeletons'

type ServerFavorite = RouterOutputs['favorites']['getAll'][number]

export default function FavoritesContent() {
	const { productIds, remove, clear, isAuth, serverFavorites } = useFavorites()
	const compare = useCompare()
	const cart = useCart()

	// Fetch product details for anonymous favorites
	const { data: productsData, isLoading: isProductsLoading } =
		trpc.products.getByIds.useQuery(productIds, {
			enabled: !isAuth && productIds.length > 0,
		})

	type FavoriteCardProps = ReturnType<typeof toFavoriteCardProps> & {
		productId: string
	}

	let products: FavoriteCardProps[] = []
	const anonProducts = (productsData ?? []) as unknown as DbProduct[]

	if (isAuth && serverFavorites.length > 0) {
		products = serverFavorites.map((fav: ServerFavorite) => {
			const product = toFrontendProduct(fav.product as unknown as DbProduct)
			return {
				...toFavoriteCardProps(product),
				productId: fav.productId,
			}
		})
	} else if (!isAuth && productsData) {
		products = anonProducts
			.filter(p => productIds.includes(p.id))
			.map(p => ({
				...toFavoriteCardProps(toFrontendProduct(p as unknown as DbProduct)),
				productId: p.id,
			}))
	}

	function handleRemove(productId: string) {
		remove(productId)
	}

	function handleClearAll() {
		clear()
	}

	if (!isAuth && productIds.length > 0 && isProductsLoading && !productsData) {
		return <FavoritesContentSkeleton />
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

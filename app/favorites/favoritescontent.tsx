'use client'

import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { useFavorites } from '@/features/favorites/usefavorites'
import { useCompare } from '@/features/compare/usecompare'
import { useCart } from '@/features/cart/usecart'
import {
	type DbProduct,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { toFavoriteCardProps } from '@/features/favorites/model/adapters'
import FavoriteProductCard from '@/features/favorites/ui/favoriteproductcard'
import { Button } from '@/shared/ui/button'
import EmptyState from '@/shared/ui/emptystate'
import { FavoritesContentSkeleton } from '@/shared/ui/storefrontskeletons'
import { CATALOG_GRID } from '@/shared/config/cataloggrid'

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
			<div className='flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-end sm:justify-between md:py-6'>
				<div>
					<p className='mb-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Сохранённые товары
					</p>
					<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-xl'>
						Избранное
					</h1>
					<p className='mt-2 text-sm tracking-wide text-muted-foreground'>
						{products.length} {pluralizeProduct(products.length)} в быстром доступе
					</p>
				</div>
				<Button
					variant='ghost'
					className='uppercase tracking-widest'
					onClick={handleClearAll}
				>
					Удалить все
				</Button>
			</div>

			<div className='py-4'>
				<div className='inline-flex rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
					Можно вернуться позже, сравнить или сразу отправить в корзину
				</div>
			</div>

			<div className={`${CATALOG_GRID.default} pb-8`}>
				{products.map(product => (
					<FavoriteProductCard
						key={product.href}
						{...product}
						onRemove={() => handleRemove(product.productId)}
						onToggleCompare={() => compare.toggle(product.productId)}
						isCompare={compare.has(product.productId)}
						isInCart={cart.has(product.productId)}
						onAddToCart={() => cart.add(product.productId)}
					/>
				))}
			</div>
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

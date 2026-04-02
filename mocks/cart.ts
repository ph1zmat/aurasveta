import type { CartItemData } from '@/types/cart'
import { mockProducts } from '@/mocks/products'

export const mockCartItems: CartItemData[] = [
	{
		id: String(mockProducts[4].id),
		name: mockProducts[4].name,
		href: `/product/${mockProducts[4].slug}`,
		image: mockProducts[4].images[0],
		price: mockProducts[4].price,
		oldPrice: mockProducts[4].oldPrice,
		quantity: 1,
		assemblyOption: 'Бесплатная сборка и установка',
		assemblyChecked: true,
	},
	{
		id: String(mockProducts[28].id),
		name: mockProducts[28].name,
		href: `/product/${mockProducts[28].slug}`,
		image: mockProducts[28].images[0],
		price: mockProducts[28].price,
		oldPrice: mockProducts[28].oldPrice,
		quantity: 1,
		assemblyOption: 'Рассчитать стоимость сборки и установки',
	},
	{
		id: String(mockProducts[29].id),
		name: mockProducts[29].name,
		href: `/product/${mockProducts[29].slug}`,
		image: mockProducts[29].images[0],
		price: mockProducts[29].price,
		quantity: 1,
		assemblyOption: 'Рассчитать стоимость сборки и установки',
	},
]

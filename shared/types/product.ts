export interface ProductImage {
	id: string
	productId?: string
	url: string
	key: string
	originalName?: string | null
	size?: number | null
	mimeType?: string | null
	order: number
	isMain: boolean
	createdAt?: string | Date
	updatedAt?: string | Date
}

export interface Product {
	id: string | number
	slug: string
	name: string
	description: string
	price: number
	oldPrice?: number
	discountPercent?: number
	bonusAmount?: number
	category: string
	categorySlug?: string
	brand?: string
	brandCountry?: string
	images: ProductImage[]
	rating?: number
	reviewsCount?: number
	inStock: boolean
	stockQuantity?: number
	badges?: string[]
	createdAt: string
}

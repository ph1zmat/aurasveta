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
	images: string[]
	imagePath?: string | null
	rating?: number
	reviewsCount?: number
	inStock: boolean
	stockQuantity?: number
	badges?: string[]
	createdAt: string
}

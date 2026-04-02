export interface Product {
	id: number
	slug: string
	name: string
	description: string
	price: number
	oldPrice?: number
	discountPercent?: number
	bonusAmount?: number
	category: string
	brand?: string
	brandCountry?: string
	images: string[]
	rating?: number
	reviewsCount?: number
	inStock: boolean
	stockQuantity?: number
	badges?: string[]
	createdAt: string
}

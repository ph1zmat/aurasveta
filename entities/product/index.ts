// Model
export type { Product } from './model/types'
export type { DbProduct } from './model/adapters'
export {
	toFrontendProduct,
	toProductCardProps,
	toCatalogCardProps,
	toCartItemData,
} from './model/adapters'

// API
export {
	getAllProducts,
	getProductById,
	getProductBySlug,
	getProductsByCategory,
	getCategories,
	getQuickSpecs,
	getProductSpecGroups,
	getCompareSpecs,
} from './api/productservice'

// UI
export { default as ProductCard, type ProductCardProps } from './ui/productcard'
export {
	default as CatalogProductCard,
	type CatalogProductCardProps,
} from './ui/catalogproductcard'

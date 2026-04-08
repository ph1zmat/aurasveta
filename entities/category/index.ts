// Model
export type {
	Category,
	Subcategory,
	CategoryTreeItem,
	Tag,
} from './model/types'

// API
export {
	getAllCategories,
	getCategoryBySlug,
	getCategoryTree,
	getSubcategories,
	getPopularTags,
	getCollectionTags,
	getSeoContent,
	getCategoryNameBySlug,
} from './api/categoryService'

// UI
export { default as CatalogCategoryCarousel } from './ui/CatalogCategoryCarousel'
export { default as CategorySection } from './ui/CategorySection'
export { default as CategoryTree } from './ui/CategoryTree'

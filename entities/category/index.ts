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
} from './api/categoryservice'

// UI
export { default as CatalogCategoryCarousel } from './ui/catalogcategorycarousel'
export { default as CategorySection } from './ui/categorysection'
export { default as CategoryTree } from './ui/categorytree'

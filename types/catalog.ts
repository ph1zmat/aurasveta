export interface Subcategory {
	name: string
	href: string
	image?: string
}

export interface Category {
	id: string
	slug: string
	name: string
	href: string
	image: string
	subcategories?: Subcategory[]
	productCount?: number
}

export interface CategoryTreeItem {
	name: string
	href: string
	children?: CategoryTreeItem[]
}

export interface Tag {
	label: string
	href?: string
}

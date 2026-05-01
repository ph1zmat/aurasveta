import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type OrderStatus =
	| 'PENDING'
	| 'PAID'
	| 'SHIPPED'
	| 'DELIVERED'
	| 'CANCELLED'

export interface OrderItem {
	id: string
	productId: string
	quantity: number
	price: number
	product?: { name: string; slug: string }
}

export interface OrderData {
	id: string
	status: OrderStatus
	total: number
	address: string
	phone: string
	comment?: string | null
	createdAt: string
	items: OrderItem[]
	user?: { name: string | null; email: string }
}

export interface CategoryData {
	id: string
	name: string
	slug: string
	parentId?: string | null
	description?: string | null
	image?: string | null
}

// Products stack
export type ProductsStackParamList = {
	ProductsList: undefined
	ProductForm: { id?: string } | undefined
}

// Orders stack
export type OrdersStackParamList = {
	OrdersList: undefined
	OrderDetail: { order: OrderData }
}

// Categories stack
export type CategoriesStackParamList = {
	CategoriesList: undefined
	CategoryDetail: { category: CategoryData }
	CategoryForm: { id?: string; parentId?: string } | undefined
}

// More stack
export type MoreStackParamList = {
	MoreMenu: undefined
	Properties: undefined
	Pages: undefined
	PageForm: { id?: string } | undefined
	Seo: undefined
	Webhooks: undefined
	ImportExport: undefined
	Settings: undefined
	Navigation: undefined
}

// Screen props helpers
export type ProductsListProps = NativeStackScreenProps<
	ProductsStackParamList,
	'ProductsList'
>
export type ProductFormProps = NativeStackScreenProps<
	ProductsStackParamList,
	'ProductForm'
>
export type OrdersListProps = NativeStackScreenProps<
	OrdersStackParamList,
	'OrdersList'
>
export type OrderDetailProps = NativeStackScreenProps<
	OrdersStackParamList,
	'OrderDetail'
>
export type CategoriesListProps = NativeStackScreenProps<
	CategoriesStackParamList,
	'CategoriesList'
>
export type CategoryDetailProps = NativeStackScreenProps<
	CategoriesStackParamList,
	'CategoryDetail'
>
export type CategoryFormProps = NativeStackScreenProps<
	CategoriesStackParamList,
	'CategoryForm'
>
export type MoreMenuProps = NativeStackScreenProps<
	MoreStackParamList,
	'MoreMenu'
>

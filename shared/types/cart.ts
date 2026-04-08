export interface CartItemData {
	id: string
	name: string
	href: string
	image: string
	price: number
	oldPrice?: number
	quantity: number
	assemblyOption?: string
	assemblyChecked?: boolean
}

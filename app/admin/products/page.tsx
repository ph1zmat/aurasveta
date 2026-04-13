import { requireAdmin } from '@/lib/auth/auth-utils'
import ProductsClient from './ProductsClient'

export default async function AdminProductsPage() {
	await requireAdmin()
	return <ProductsClient />
}

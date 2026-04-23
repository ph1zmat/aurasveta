import { requireAdmin } from '@/lib/auth/auth-utils'
import ProductsGalleryClient from './ProductsGalleryClient'

export default async function AdminProductsPage() {
	await requireAdmin()
	return <ProductsGalleryClient />
}

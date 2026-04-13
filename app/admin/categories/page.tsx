import { requireAdmin } from '@/lib/auth/auth-utils'
import CategoriesClient from './CategoriesClient'

export default async function AdminCategoriesPage() {
	await requireAdmin()
	return <CategoriesClient />
}


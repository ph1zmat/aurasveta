import { requireAdmin } from '@/lib/auth/auth-utils'
import PropertiesClient from './PropertiesClient'

export default async function AdminPropertiesPage() {
	await requireAdmin()
	return <PropertiesClient />
}


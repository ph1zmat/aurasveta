import { requireAdmin } from '@/lib/auth/authutils'
import PropertiesClient from './propertiesclient'

export default async function PropertiesPage() {
	await requireAdmin()
	return <PropertiesClient />
}

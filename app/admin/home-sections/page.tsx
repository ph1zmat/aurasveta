import { requireAdmin } from '@/lib/auth/auth-utils'
import HomeSectionsClient from './HomeSectionsClient'

export default async function AdminHomeSectionsPage() {
	await requireAdmin()
	return <HomeSectionsClient />
}

import { requireAdmin } from '@/lib/auth/auth-utils'
import DashboardClient from './DashboardClient'

export default async function AdminPage() {
	await requireAdmin()
	return <DashboardClient />
}

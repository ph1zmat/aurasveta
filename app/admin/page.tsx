import AdminDashboard from './AdminDashboard'
import { requireAdmin } from '@/lib/auth/auth-utils'

export default async function AdminPage() {
	await requireAdmin()
	return <AdminDashboard />
}

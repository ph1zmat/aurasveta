import dynamic from 'next/dynamic'
import { requireAdmin } from '@/lib/auth/auth-utils'

const DashboardClient = dynamic(() => import('./DashboardClient'))

export default async function AdminPage() {
	await requireAdmin()
	return <DashboardClient />
}

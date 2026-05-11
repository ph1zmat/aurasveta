import dynamic from 'next/dynamic'
import { requireAdmin } from '@/lib/auth/authutils'

const DashboardClient = dynamic(() => import('./dashboardclient'))

export default async function AdminPage() {
	await requireAdmin()
	return <DashboardClient />
}

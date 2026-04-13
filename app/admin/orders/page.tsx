import { requireAdmin } from '@/lib/auth/auth-utils'
import OrdersClient from './OrdersClient'

export default async function AdminOrdersPage() {
	await requireAdmin()
	return <OrdersClient />
}

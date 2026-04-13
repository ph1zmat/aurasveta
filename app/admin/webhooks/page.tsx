import { requireAdmin } from '@/lib/auth/auth-utils'
import WebhooksClient from './WebhooksClient'

export default async function AdminWebhooksPage() {
	await requireAdmin()
	return <WebhooksClient />
}


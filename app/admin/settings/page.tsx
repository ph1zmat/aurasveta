import { requireAdmin } from '@/lib/auth/auth-utils'
import SettingsClient from './SettingsClient'

export default async function AdminSettingsPage() {
	await requireAdmin()
	return <SettingsClient />
}

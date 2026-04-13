import { requireAdmin } from '@/lib/auth/auth-utils'
import SeoClient from './SeoClient'

export default async function SeoSettingsPage() {
	await requireAdmin()
	return <SeoClient />
}

import { requireAdmin } from '@/lib/auth/auth-utils'
import ImportExportClient from './ImportExportClient'

export default async function ImportExportPage() {
	await requireAdmin()
	return <ImportExportClient />
}


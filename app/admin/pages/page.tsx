import { requireEditor } from '@/lib/auth/auth-utils'
import PagesClient from './PagesClient'

export default async function AdminPagesPage() {
	await requireEditor()
	return <PagesClient />
}

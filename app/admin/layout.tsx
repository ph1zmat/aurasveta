import { requireCmsAccess } from '@/lib/auth/auth-utils'
import AdminQueryDevtools from './components/AdminQueryDevtools'
import AdminShell from './components/AdminShell'
import { Toaster } from '@/components/ui/sonner'

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { role } = await requireCmsAccess()

	return (
		<>
			<AdminQueryDevtools />
			<AdminShell userRole={role}>{children}</AdminShell>
			<Toaster position='top-right' />
		</>
	)
}

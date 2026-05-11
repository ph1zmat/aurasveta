import { requireCmsAccess } from '@/lib/auth/authutils'
import AdminQueryDevtools from './components/adminquerydevtools'
import AdminShell from './components/adminshell'
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

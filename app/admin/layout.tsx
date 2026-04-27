import { requireCmsAccess } from '@/lib/auth/auth-utils'
import AdminNotificationsClient from './AdminNotificationsClient'
import AdminNotificationsWidget from './AdminNotificationsWidget'
import AdminSidebar from './components/AdminSidebar'

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { session, role } = await requireCmsAccess()

	return (
		<div className='flex min-h-screen bg-background'>
			<AdminNotificationsClient />
			<AdminSidebar userEmail={session.user.email ?? ''} userRole={role} />

			{/* Main */}
			<main className='flex-1 overflow-auto'>
				<div className='container mx-auto max-w-6xl px-6 py-8 lg:px-6'>
					{children}
				</div>
			</main>
		</div>
	)
}

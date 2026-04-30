'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

interface AdminShellProps {
	userRole: string
	children: React.ReactNode
}

export default function AdminShell({ userRole, children }: AdminShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false)

	return (
		<div className='flex h-screen w-full overflow-hidden bg-background text-foreground'>
			<AdminSidebar
				userRole={userRole}
				sidebarOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>

			<div className='flex flex-1 flex-col overflow-hidden'>
				<AdminHeader
					userRole={userRole}
					onMenuToggle={() => setSidebarOpen(true)}
				/>
				<main className='flex-1 overflow-y-auto'>
					<div className='mx-auto max-w-[1440px] p-6'>{children}</div>
				</main>
			</div>
		</div>
	)
}

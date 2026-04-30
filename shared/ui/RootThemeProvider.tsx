'use client'

import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'

export default function RootThemeProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const pathname = usePathname()
	const isAdmin = pathname?.startsWith('/admin')

	return (
		<ThemeProvider
			attribute='class'
			defaultTheme='light'
			forcedTheme={isAdmin ? 'dark' : 'light'}
			enableSystem={false}
		>
			{children}
		</ThemeProvider>
	)
}

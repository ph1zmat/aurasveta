import type { Metadata } from 'next'
import './globals.css'
import MobileHeader from '@/widgets/header/ui/MobileHeader'
import MobileBottomNav from '@/widgets/navigation/ui/MobileBottomNav'
import { TRPCProvider } from '@/lib/trpc/client'
import { trpc, HydrateClient } from '@/lib/trpc/server'
import Toaster from '@/shared/ui/Toaster'
import RootThemeProvider from '@/shared/ui/RootThemeProvider'

export const metadata: Metadata = {
	metadataBase: new URL('https://aurasveta.by'),
	title: {
		default: 'Интернет-магазин люстр и светильников в Мозыре — Аура Света',
		template: '%s | Аура Света',
	},
	description: 'Аура Света — интернет-магазин светильников и декора',
	openGraph: {
		siteName: 'Аура Света',
		locale: 'ru_RU',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		site: '@aurasveta',
	},
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	// Prefetch categories for navigation components (CategoryNav, MobileCatalogMenu)
	void trpc.categories.getNav.prefetch()
	void trpc.categories.getHeaderTree.prefetch()

	return (
		<html lang='ru' suppressHydrationWarning>
			<head>
				<link
					rel='icon'
					type='image/png'
					href='/favicon-96x96.png'
					sizes='96x96'
				/>
				<link rel='icon' type='image/svg+xml' href='/favicon.svg' />
				<link rel='shortcut icon' href='/favicon.ico' />
				<link
					rel='apple-touch-icon'
					sizes='180x180'
					href='/apple-touch-icon.png'
				/>
				<meta name='apple-mobile-web-app-title' content='Аура Света' />
				<link rel='manifest' href='/site.webmanifest' />
			</head>
			<body className='font-sans antialiased'>
				<RootThemeProvider>
					<TRPCProvider>
						<HydrateClient>
							<Toaster />
							<MobileHeader />
							<div className='mobile-content-offset'>{children}</div>
							<MobileBottomNav />
						</HydrateClient>
					</TRPCProvider>
				</RootThemeProvider>
			</body>
		</html>
	)
}

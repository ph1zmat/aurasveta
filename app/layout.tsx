import type { Metadata } from 'next'
import './globals.css'

// Принудительный SSR для всего приложения — layout использует headers() через tRPC
export const dynamic = 'force-dynamic'

import MobileHeader from '@/widgets/header/ui/MobileHeader'
import MobileBottomNav from '@/widgets/navigation/ui/MobileBottomNav'
import { TRPCProvider } from '@/lib/trpc/client'
import { HydrateClient } from '@/lib/trpc/server'
import Toaster from '@/shared/ui/Toaster'
import RootThemeProvider from '@/shared/ui/RootThemeProvider'
import { getPublicStoreSettings } from '@/lib/utils/getPublicStoreSettings'
import { buildOrganizationSchema } from '@/lib/seo/schema/builders/organization'
import { buildWebSiteSchema } from '@/lib/seo/schema/builders/website'

export const metadata: Metadata = {
	metadataBase: new URL('https://aurasveta.by'),
	title: {
		default: 'Интернет-магазин люстр и светильников в Мозыре — Аура Света',
		template: '%s | Аура Света',
	},
	description: 'Аура Света — интернет-магазин светильников и декора',
	icons: {
		icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
		shortcut: ['/favicon.ico'],
	},
	verification: {
		google: 'fA8h5x9FAQDa6OFp09Tvp67Fc9KEF3MvBLZMH3e-OUg',
		yandex: 'ee70a2896ab83afb',
	},
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
	const storeSettings = await getPublicStoreSettings()
	const organizationSchema = buildOrganizationSchema(storeSettings)
	const webSiteSchema = buildWebSiteSchema()

	return (
		<html lang='ru' suppressHydrationWarning>
			<head>
				{/* JSON-LD: Organization (SEO-CLAIM-032) */}
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(organizationSchema),
					}}
				/>
				{/* JSON-LD: WebSite + SearchAction (SEO-CLAIM-033) */}
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
				/>
			</head>
			<body className='font-sans antialiased'>
				<RootThemeProvider>
					<TRPCProvider>
						<HydrateClient>
							<Toaster />
							<MobileHeader phone={storeSettings?.phone} logoUrl={storeSettings?.logoUrl} />
							<div className='mobile-content-offset'>{children}</div>
							<MobileBottomNav />
						</HydrateClient>
					</TRPCProvider>
				</RootThemeProvider>
			</body>
		</html>
	)
}

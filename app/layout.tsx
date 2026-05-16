import type { Metadata } from 'next'
import './globals.css'

// Публичный layout кэшируется через ISR, динамичность остается на уровне конкретных маршрутов
export const revalidate = 3600

import MobileHeader from '@/widgets/header/ui/mobileheader'
import MobileBottomNav from '@/widgets/navigation/ui/mobilebottomnav'
import { TRPCProvider } from '@/lib/trpc/client'
import { HydrateClient } from '@/lib/trpc/server'
import Toaster from '@/shared/ui/toaster'
import RootThemeProvider from '@/shared/ui/rootthemeprovider'
import { getPublicStoreSettings } from '@/lib/utils/getpublicstoresettings'
import { buildOrganizationSchema } from '@/lib/seo/schema/builders/organization'
import { buildWebSiteSchema } from '@/lib/seo/schema/builders/website'
import { buildNavigationSchema } from '@/lib/seo/schema/builders/navigation'
import { buildRootMetadata } from '@/lib/seo/sitemetadata'

export async function generateMetadata(): Promise<Metadata> {
	const storeSettings = await getPublicStoreSettings()

	return buildRootMetadata(storeSettings)
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const storeSettings = await getPublicStoreSettings()
	const organizationSchema = buildOrganizationSchema(storeSettings)
	const webSiteSchema = buildWebSiteSchema()
	const navigationSchema = buildNavigationSchema()

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
				{/* JSON-LD: SiteNavigationElement (sitelinks) */}
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
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

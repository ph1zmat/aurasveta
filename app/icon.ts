import { NextResponse } from 'next/server'
import { getSiteBrandAssets } from '@/lib/seo/sitemetadata'
import { getPublicStoreSettings } from '@/lib/utils/getpublicstoresettings'

export const dynamic = 'force-dynamic'

export default async function Icon() {
	const settings = await getPublicStoreSettings()
	const brandAssets = getSiteBrandAssets(settings)

	return NextResponse.redirect(brandAssets.faviconUrl)
}

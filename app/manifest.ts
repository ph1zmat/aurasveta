import type { MetadataRoute } from 'next'
import { buildSiteManifest } from '@/lib/seo/sitemetadata'

export default function manifest(): MetadataRoute.Manifest {
	return buildSiteManifest()
}

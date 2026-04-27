'use client'

import BannerSection, { type BannerSectionConfig } from './BannerSection'

/**
 * HeroBanner — legacy alias for BannerSection.
 * Delegates rendering to BannerSection so config is fully respected.
 */
export default function HeroBanner({
	title,
	config,
}: {
	title?: string | null
	config?: Record<string, unknown> | null
}) {
	return (
		<BannerSection
			title={title}
			config={config as BannerSectionConfig | undefined}
		/>
	)
}

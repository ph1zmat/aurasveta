/**
 * Серверный компонент-диспетчер HomeSection.
 * Маппит `sectionType.component` → конкретный виджет.
 */
import type { Prisma } from '@prisma/client'
import BannerSection from './BannerSection'
import ProductGridSection from './ProductGridSection'
import BrandCarouselByPropertySection from './BrandCarouselByPropertySection'
import CategoryCarouselSection from './CategoryCarouselSection'
import Advantages from './Advantages'
import AboutSection from './AboutSection'
import RecentlyViewed from './RecentlyViewed'
import RoomsSection from './RoomsSection'

type HomeSectionRecord = Prisma.HomeSectionGetPayload<{ include: { sectionType: true } }>

interface Props {
	section: HomeSectionRecord
}

export default function DynamicHomeSection({ section }: Props) {
	const cfg = (section.config ?? {}) as Record<string, unknown>
	const title = section.title ?? undefined

	switch (section.sectionType.component) {
		case 'Banner':
			return <BannerSection title={title} config={cfg as Parameters<typeof BannerSection>[0]['config']} />
		case 'ProductGrid':
			return <ProductGridSection title={title} config={cfg as Parameters<typeof ProductGridSection>[0]['config']} />
		case 'BrandCarousel':
			return <BrandCarouselByPropertySection title={title} config={cfg as Parameters<typeof BrandCarouselByPropertySection>[0]['config']} />
		case 'CategoryCarousel':
			return <CategoryCarouselSection title={title} config={cfg as Parameters<typeof CategoryCarouselSection>[0]['config']} />
		case 'Advantages':
			return <Advantages title={title} config={cfg as Parameters<typeof Advantages>[0]['config']} />
		case 'AboutText':
			return <AboutSection title={title} config={cfg as Parameters<typeof AboutSection>[0]['config']} />
		case 'Rooms':
			return <RoomsSection title={title} config={cfg as Parameters<typeof RoomsSection>[0]['config']} />
		case 'SeenProducts':
			return <RecentlyViewed />
		default:
			return null
	}
}

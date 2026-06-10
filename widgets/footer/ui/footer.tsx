import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'
import Image from 'next/image'
import { getFooterAboutLinks } from '@/lib/navigation/sitenav'
import { getPublicStoreSettings } from '@/lib/utils/getpublicstoresettings'
import SocialIcon from '@/shared/ui/socialicon'
import { prisma } from '@/lib/prisma'

const sectionTitleClass =
	'mb-4 text-xs font-medium uppercase tracking-[0.22em] text-card/80'

const footerLinkClass =
	'inline-flex rounded-md text-sm text-card/60 transition-colors duration-200 hover:text-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-card focus-visible:ring-offset-2 focus-visible:ring-offset-foreground'

const contactLinkClass =
	'flex items-center gap-2 rounded-md text-card/80 transition-colors duration-200 hover:text-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-card focus-visible:ring-offset-2 focus-visible:ring-offset-foreground'

const fallbackCategoryLinks = [
	{ label: 'Светильники', href: '/catalog/svetilniki' },
	{ label: 'Люстры', href: '/catalog/lyustry' },
	{ label: 'Бра и подсветки', href: '/catalog/bra' },
	{ label: 'Споты', href: '/catalog/spoty' },
	{ label: 'Настольные лампы', href: '/catalog/nastolnye-lampy' },
	{ label: 'Торшеры', href: '/catalog/torshery' },
	{ label: 'Уличное освещение', href: '/catalog/ulichnoe-osveshenie' },
]

const BRANDS_LIMIT = 10
const CATEGORIES_LIMIT = 10

function normalizePhoneHref(phone: string) {
	return phone.replace(/[^\d+]/g, '')
}

async function getFooterCatalogLinks() {
	try {
		const categories = await prisma.category.findMany({
			where: {
				parentId: null,
				showInHeader: true,
			},
			select: { name: true, slug: true },
			orderBy: { name: 'asc' },
			take: CATEGORIES_LIMIT,
		})

		if (categories.length === 0) {
			return fallbackCategoryLinks
		}

		return categories.map(category => ({
			label: category.name,
			href: `/catalog/${category.slug}`,
		}))
	} catch {
		return fallbackCategoryLinks
	}
}

async function getFooterBrandLinks() {
	try {
		const brandProperty = await prisma.property.findUnique({
			where: { slug: 'brand' },
			select: {
				values: {
					orderBy: [{ order: 'asc' }, { value: 'asc' }],
					select: { value: true, slug: true },
					take: BRANDS_LIMIT,
				},
			},
		})

		if (brandProperty?.values.length) {
			return brandProperty.values
				.filter((item): item is { value: string; slug: string } =>
					Boolean(item.value && item.slug),
				)
				.map(item => ({
					label: item.value,
					href: `/catalog?prop.brand=${item.slug}`,
				}))
		}

		const brands = await prisma.product.findMany({
			where: { isActive: true, brand: { not: null } },
			select: { brand: true },
			distinct: ['brand'],
			orderBy: { brand: 'asc' },
			take: BRANDS_LIMIT,
		})

		return brands
			.map(row => row.brand)
			.filter((brand): brand is string => Boolean(brand))
			.map(brand => ({
				label: brand,
				href: `/catalog?prop.brand=${brand.toLowerCase().replace(/\s+/g, '-')}`,
			}))
	} catch {
		return []
	}
}

export default async function Footer() {
	const [aboutLinks, settings, catalogLinks, brandLinks] = await Promise.all([
		getFooterAboutLinks(),
		getPublicStoreSettings(),
		getFooterCatalogLinks(),
		getFooterBrandLinks(),
	])
	const currentYear = new Date().getFullYear()
	const socialLinks = settings?.socialLinks.filter(link => Boolean(link.url?.trim())) ?? []

	return (
		<footer className='border-t border-card/10 bg-foreground text-card'>
			<div className='mx-auto max-w-7xl px-4 py-12 lg:py-14'>
				<div className='mb-8 flex flex-col gap-3 border-b border-card/12 pb-6 md:flex-row md:items-end md:justify-between'>
					<div className='space-y-2'>
						<p className='text-xs font-medium uppercase tracking-[0.24em] text-card/55'>
							Аура Света
						</p>
						<h2 className='max-w-2xl text-xl font-semibold tracking-[0.04em] text-card sm:text-2xl'>
							Освещение для дома, бизнеса и интерьерных проектов — с понятным каталогом и живой консультацией.
						</h2>
					</div>
					<p className='max-w-md text-sm leading-6 text-card/60 md:text-right'>
						Помогаем подобрать люстры, светильники, бра и декоративный свет под стиль, площадь и бюджет.
					</p>
				</div>

				<div className='grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4'>
					{/* Column 1: Logo & Contact */}
					<div className='space-y-6'>
						<Link
							href='/'
							className='inline-flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-card focus-visible:ring-offset-2 focus-visible:ring-offset-foreground'
						>
							<Image
								src='/auralogonolinewhite.png'
								alt='Аура Света'
								width={128}
								height={48}
								className='h-12 w-40 object-cover'
							/>
						</Link>

						<p className='max-w-xs text-sm leading-6 text-card/65'>
							Интернет-магазин освещения с подбором люстр, светильников и
							 интерьерных решений для дома и бизнеса.
						</p>

						<div className='space-y-3 rounded-2xl border border-card/12 bg-card/5 p-4 text-sm'>
							<div className='text-xs font-medium uppercase tracking-[0.22em] text-card/80'>
								Отдел продаж
							</div>
							{(settings?.city || settings?.address) && (
								<div className='flex items-start gap-2 text-card/70'>
									<MapPin className='mt-0.5 h-4 w-4 shrink-0' />
									<p className='leading-6'>
										{[settings.city, settings.address]
											.filter(Boolean)
											.join(', ')}
									</p>
								</div>
							)}

							<div className='space-y-2 text-sm'>
							{settings?.phone && (
								<a
									href={`tel:${normalizePhoneHref(settings.phone)}`}
									aria-label={`Позвонить: ${settings.phone}`}
									className={contactLinkClass}
								>
									<Phone className='h-4 w-4' />
									{settings.phone}
								</a>
							)}
							{settings?.additionalPhone && (
								<a
									href={`tel:${normalizePhoneHref(settings.additionalPhone)}`}
									aria-label={`Позвонить: ${settings.additionalPhone}`}
									className={contactLinkClass}
								>
									<Phone className='h-4 w-4' />
									{settings.additionalPhone}
								</a>
							)}
							{settings?.email && (
								<a
									href={`mailto:${settings.email}`}
									aria-label={`Написать на email: ${settings.email}`}
									className={contactLinkClass}
								>
									<Mail className='h-4 w-4' />
									{settings.email}
								</a>
							)}
							{settings?.workingHours &&
								Object.keys(settings.workingHours).length > 0 && (
									<div className='mt-1 space-y-1 text-xs text-card/50'>
										{Object.entries(settings.workingHours).map(
											([days, hours]) => (
												<div key={days}>
													<span className='text-card/70'>{days}:</span> {hours}
												</div>
											),
										)}
									</div>
								)}
								</div>
						</div>
					</div>

					{/* Column 2: About */}
					<div>
							<h3 className={sectionTitleClass}>
							О Ауре Света
						</h3>
						<ul className='space-y-2.5'>
							{aboutLinks.map(link => (
								<li key={link.href}>
									<Link
										href={link.href}
											className={footerLinkClass}
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Column 3: Catalog */}
					<div>
						<h3 className={sectionTitleClass}>
							Каталог
						</h3>
						<ul className='space-y-2.5'>
							{catalogLinks.map(link => (
								<li key={link.href}>
									<Link
										href={link.href}
										className={footerLinkClass}
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Column 4: Brands & Social */}
					<div className='space-y-6'>
						<div>
							<h3 className={sectionTitleClass}>
								Бренды
							</h3>
							{brandLinks.length > 0 ? (
								<ul className='space-y-2.5'>
									{brandLinks.map(brand => (
										<li key={brand.href}>
											<Link
												href={brand.href}
												className={footerLinkClass}
											>
												{brand.label}
											</Link>
										</li>
									))}
								</ul>
							) : (
								<p className='text-sm leading-6 text-card/55'>
									Популярные бренды появятся здесь после обновления каталога.
								</p>
							)}
						</div>

						<div>
							<h3 className={sectionTitleClass}>
								Мы в соцсетях
							</h3>
							{socialLinks.length > 0 ? (
								<div className='flex flex-wrap gap-2'>
									{socialLinks.map(link => (
										<SocialIcon
											key={`${link.platform}-${link.url}`}
											platform={link.platform}
											url={link.url}
											className='text-card/70 transition-colors hover:text-card'
										/>
									))}
								</div>
							) : (
								<p className='text-sm leading-6 text-card/55'>
									Ссылки на соцсети появятся здесь после заполнения настроек магазина.
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Bottom */}
				<div className='mt-10 flex flex-col gap-4 border-t border-card/20 pt-6 sm:flex-row sm:items-center sm:justify-between'>
					<p className='text-center text-xs text-card/50 sm:text-left'>
						Аура Света © 2011–{currentYear} Все права защищены
					</p>
					<div className='flex flex-col items-center gap-2 sm:items-end'>
						<Link
							href='/privacy'
							className='rounded-md text-center text-xs text-card/50 underline underline-offset-4 transition-colors hover:text-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-card focus-visible:ring-offset-2 focus-visible:ring-offset-foreground'
						>
							Политика в области обработки персональных данных
						</Link>
						<p className='text-center text-[11px] leading-5 text-card/40 sm:text-right'>
							Каталог, контакты и бренды обновляются автоматически из настроек и базы данных.
						</p>
					</div>
				</div>
			</div>
		</footer>
	)
}

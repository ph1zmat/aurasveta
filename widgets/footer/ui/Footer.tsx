import Link from 'next/link'
import { MapPin, Phone, Mail, Send } from 'lucide-react'
import Image from 'next/image'
import { trpc } from '@/lib/trpc/server'
import { prisma } from '@/lib/prisma'
import { resolveCatalogLinkHref } from '@/lib/home-sections/catalog-link-resolver'

async function getFooterBrandLinks() {
	try {
	const brandSection = await prisma.homeSection.findFirst({
		where: {
			isActive: true,
			sectionType: { component: 'BrandCarousel' },
		},
		orderBy: { order: 'asc' },
		select: { config: true },
	})

	if (!brandSection) return [] as Array<{ label: string; href: string }>

	const config = (brandSection.config ?? {}) as Record<string, unknown>
	const propertySlug =
		typeof config.propertySlug === 'string' &&
		config.propertySlug.trim().length > 0
			? config.propertySlug
			: 'brand'
	const filterParam =
		typeof config.filterParam === 'string' &&
		config.filterParam.trim().length > 0
			? config.filterParam
			: propertySlug

	const property = await prisma.property.findUnique({
		where: { slug: propertySlug },
		select: {
			values: {
				orderBy: [{ order: 'asc' }, { value: 'asc' }],
				select: { id: true, value: true, slug: true },
			},
		},
	})

	if (!property || property.values.length === 0) {
		return []
	}

	const rawBrandLinks =
		config.brandLinks && typeof config.brandLinks === 'object'
			? (config.brandLinks as Record<string, Record<string, unknown>>)
			: {}

	const links = await Promise.all(
		property.values.map(async value => {
			const custom = rawBrandLinks[value.id]
			const href =
				(await resolveCatalogLinkHref(prisma, {
					href: typeof custom?.href === 'string' ? custom.href : undefined,
					linkCategoryId:
						typeof custom?.linkCategoryId === 'string'
							? custom.linkCategoryId
							: undefined,
					linkPropertyId:
						typeof custom?.linkPropertyId === 'string'
							? custom.linkPropertyId
							: undefined,
					linkPropertyValueId:
						typeof custom?.linkPropertyValueId === 'string'
							? custom.linkPropertyValueId
							: undefined,
				})) ?? `/catalog?prop.${filterParam}=${value.slug}`

			return { label: value.value, href }
		}),
	)

	return links
	} catch {
		return [] as Array<{ label: string; href: string }>
	}
}

export default async function Footer() {
	// Запрашиваем публичный layout-конфиг
	let layout: Awaited<
		ReturnType<typeof trpc.siteNavigation.getPublicLayoutConfig>
	> | null = null
	try {
		layout = await trpc.siteNavigation.getPublicLayoutConfig()
	} catch {
		// БД недоступна — пропускаем связанный контент
	}

	const [navItems, footerCategories, brandLinks] = await Promise.all([
		Promise.resolve(layout?.navItems ?? []),
		prisma.category.findMany({
			where: { parentId: null, showInHeader: true },
			select: { id: true, name: true, slug: true },
			orderBy: { name: 'asc' },
		}).catch(() => []),
		getFooterBrandLinks().catch(() => [] as Array<{ label: string; href: string }>),
	])

	const vis = layout?.footerVisibility
	const store = layout?.store

	const aboutLinks = navItems
		.filter(i => i.zone === 'FOOTER_ABOUT')
		.map(i => ({ label: i.label, href: i.href }))

	const serviceLinks = footerCategories.map(category => ({
		label: category.name,
		href: `/catalog/${category.slug}`,
	}))

	const showPhone = vis?.showPhone !== false
	const showAdditionalPhone = vis?.showAdditionalPhone !== false
	const showEmail = vis?.showEmail !== false
	const showAddress = vis?.showAddress !== false
	const showSocial = vis?.showSocialLinks !== false

	const phone = store?.phone ?? null
	const additionalPhone = store?.additionalPhone
	const email = store?.email ?? null
	const address = store?.address ?? null
	const city = store?.city

	const socialLinks =
		(store?.socialLinks as Array<{ platform: string; url: string }>) ?? []

	return (
		<footer className='bg-foreground text-card'>
			<div className='mx-auto max-w-7xl px-4 py-12'>
				<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
					{/* Колонка 1: Логотип и контакты */}
					<div className='space-y-6'>
						<Link href='/' className='flex items-center gap-2 shrink-0'>
							<Image
								src='/aura-logo-noline-white.png'
								alt='Logo'
								width={128}
								height={48}
								className='h-12 w-40 object-cover'
							/>
						</Link>

						{(showAddress || city) && (
							<div className='space-y-3 text-sm'>
								<div className='font-normal uppercase tracking-widest text-card/80'>
									Отдел продаж
								</div>
								{showAddress && (
									<div className='flex items-start gap-2 text-card/70'>
										<MapPin className='mt-0.5 h-4 w-4 shrink-0' />
										<span>{city ? `${city}, ${address}` : address}</span>
									</div>
								)}
							</div>
						)}

						<div className='space-y-2 text-sm'>
							{showPhone && phone && (
								<a
									href={`tel:${phone.replace(/[\s().-]/g, '')}`}
									className='flex items-center gap-2 text-card/80 hover:text-card transition-colors'
								>
									<Phone className='h-4 w-4' />
									{phone}
								</a>
							)}
							{showAdditionalPhone && additionalPhone && (
								<a
									href={`tel:${additionalPhone.replace(/[\s().-]/g, '')}`}
									className='flex items-center gap-2 text-card/80 hover:text-card transition-colors'
								>
									<Phone className='h-4 w-4' />
									{additionalPhone}
								</a>
							)}
							{showEmail && email && (
								<a
									href={`mailto:${email}`}
									className='flex items-center gap-2 text-card/80 hover:text-card transition-colors'
								>
									<Mail className='h-4 w-4' />
									{email}
								</a>
							)}
						</div>
					</div>

					{/* Колонка 2: О магазине */}
					<div>
						<h3 className='mb-4 text-sm font-normal uppercase tracking-widest text-card/80'>
							О AURASVETA.RU
						</h3>
						<ul className='space-y-2'>
							{aboutLinks.map(link => (
								<li key={link.href}>
									<Link
										href={link.href}
										className='text-sm text-card/60 hover:text-card transition-colors'
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Колонка 3: Сервис */}
					<div>
						<h3 className='mb-4 text-sm font-normal uppercase tracking-widest text-card/80'>
							Каталог
						</h3>
						<ul className='space-y-2'>
							{serviceLinks.map(link => (
								<li key={link.href}>
									<Link
										href={link.href}
										className='text-sm text-card/60 hover:text-card transition-colors'
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Колонка 4: Бренды + соцсети */}
					<div className='space-y-6'>
						<div>
							<h3 className='mb-4 text-sm font-normal uppercase tracking-widest text-card/80'>
								Бренды
							</h3>
							<ul className='space-y-2'>
								{brandLinks.map(link => (
									<li key={link.href}>
										<Link
											href={link.href}
											className='text-sm text-card/60 hover:text-card transition-colors'
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{showSocial && socialLinks.length > 0 && (
							<div>
								<h3 className='mb-4 text-sm font-normal uppercase tracking-widest text-card/80'>
									Мы в соцсетях
								</h3>
								<div className='space-y-2'>
									{socialLinks.map(s => (
										<a
											key={s.url}
											href={s.url}
											target='_blank'
											rel='noopener noreferrer'
											className='inline-flex items-center gap-2 text-sm text-card/60 hover:text-card transition-colors'
										>
											<Send className='h-4 w-4' />
											{s.platform}
										</a>
									))}
								</div>
							</div>
						)}

						{/* Без fallback: соцсети показываем только если они заданы в БД */}
					</div>
				</div>

				{/* Bottom */}
				<div className='mt-10 flex flex-col items-center justify-between gap-4 border-t border-card/20 pt-6 sm:flex-row'>
					<p className='text-xs text-card/50'>
						Аура Света © 2011–2026 Все права защищены
					</p>
					<Link
						href='/pages/privacy'
						className='text-xs text-card/50 hover:text-card/80 underline'
					>
						Политика в области обработки персональных данных
					</Link>
				</div>
			</div>
		</footer>
	)
}

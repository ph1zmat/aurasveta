import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'
import Image from 'next/image'
import { getFooterAboutLinks } from '@/lib/navigation/site-nav'
import { getPublicStoreSettings } from '@/lib/utils/getPublicStoreSettings'
import SocialIcon from '@/shared/ui/SocialIcon'

const catalogLinks = [
	{ label: 'Все бренды', href: '/brands' },
	{ label: 'Новинки', href: '/new' },
	{ label: 'Светильники', href: '/catalog/svetilniki' },
	{ label: 'Люстры', href: '/catalog/lyustry' },
	{ label: 'Бра и подсветки', href: '/catalog/bra' },
	{ label: 'Споты', href: '/catalog/spoty' },
	{ label: 'Настольные лампы', href: '/catalog/nastolnye-lampy' },
	{ label: 'Торшеры', href: '/catalog/torshery' },
	{ label: 'Уличное освещение', href: '/catalog/ulichnoe-osveshenie' },
]

const brandLinks = [
	'Эра',
	'Feron',
	'Favourite',
	'Maytoni',
	'Arte Lamp',
	'Odeon Light',
	'Uniel',
	'Citilux',
	'ST Luce',
	'Eglo',
]

export default async function Footer() {
	const [aboutLinks, settings] = await Promise.all([
		getFooterAboutLinks(),
		getPublicStoreSettings(),
	])

	return (
		<footer className='bg-foreground text-card'>
			<div className='mx-auto max-w-7xl px-4 py-12'>
				<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
					{/* Column 1: Logo & Contact */}
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

						<div className='space-y-3 text-sm'>
							<div className='font-normal uppercase tracking-widest text-card/80'>
								Отдел продаж
							</div>
							{(settings?.city || settings?.address) && (
								<div className='flex items-start gap-2 text-card/70'>
									<MapPin className='mt-0.5 h-4 w-4 shrink-0' />
									<span>
										{[settings.city, settings.address].filter(Boolean).join(', ')}
									</span>
								</div>
							)}
							<Link href='/stores' className='text-primary underline text-sm'>
								Наши магазины
							</Link>
						</div>

						<div className='space-y-2 text-sm'>
							{settings?.phone && (
								<a
									href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
									className='flex items-center gap-2 text-card/80 hover:text-card transition-colors'
								>
									<Phone className='h-4 w-4' />
									{settings.phone}
								</a>
							)}
							{settings?.additionalPhone && (
								<a
									href={`tel:${settings.additionalPhone.replace(/[^\d+]/g, '')}`}
									className='flex items-center gap-2 text-card/80 hover:text-card transition-colors'
								>
									<Phone className='h-4 w-4' />
									{settings.additionalPhone}
								</a>
							)}
							{settings?.email && (
								<a
									href={`mailto:${settings.email}`}
									className='flex items-center gap-2 text-card/80 hover:text-card transition-colors'
								>
									<Mail className='h-4 w-4' />
									{settings.email}
								</a>
							)}
							{settings?.workingHours && Object.keys(settings.workingHours).length > 0 && (
								<div className='text-card/50 text-xs mt-1 space-y-0.5'>
									{Object.entries(settings.workingHours).map(([days, hours]) => (
										<div key={days}>
											<span className='text-card/70'>{days}:</span> {hours}
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Column 2: About */}
					<div>
						<h3 className='mb-4 text-sm font-normal uppercase tracking-widest text-card/80'>
							О Ауре Света
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

					{/* Column 3: Catalog */}
					<div>
						<h3 className='mb-4 text-sm font-normal uppercase tracking-widest text-card/80'>
							Каталог
						</h3>
						<ul className='space-y-2'>
							{catalogLinks.map(link => (
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

					{/* Column 4: Brands & Social */}
					<div className='space-y-6'>
						<div>
							<h3 className='mb-4 text-sm font-normal uppercase tracking-widest text-card/80'>
								Бренды
							</h3>
							<ul className='space-y-2'>
								{brandLinks.map(brand => (
									<li key={brand}>
										<Link
											href={`/brands/${brand.toLowerCase().replace(/\s/g, '-')}`}
											className='text-sm text-card/60 hover:text-card transition-colors'
										>
											{brand}
										</Link>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h3 className='mb-4 text-sm font-normal uppercase tracking-widest text-card/80'>
								Мы в соцсетях
							</h3>
							{settings?.socialLinks && settings.socialLinks.length > 0 ? (
								<div className='flex flex-wrap gap-1'>
									{settings.socialLinks.map(link => (
										<SocialIcon
											key={link.platform}
											platform={link.platform}
											url={link.url}
											className='text-card/70 hover:text-card'
										/>
									))}
								</div>
							) : null}
						</div>
					</div>
				</div>

				{/* Bottom */}
				<div className='mt-10 flex flex-col items-center justify-between gap-4 border-t border-card/20 pt-6 sm:flex-row'>
					<p className='text-xs text-card/50'>
						Аура Света © 2011–2026 Все права защищены
					</p>
					<Link
						href='/privacy'
						className='text-xs text-card/50 hover:text-card/80 underline'
					>
						Политика в области обработки персональных данных
					</Link>
				</div>
			</div>
		</footer>
	)
}

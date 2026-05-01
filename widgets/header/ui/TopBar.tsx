import { MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { getTopBarNavGroups } from '@/lib/navigation/site-nav'
import { getPublicStoreSettings, getTodayWorkingHours } from '@/lib/utils/getPublicStoreSettings'

export default async function TopBar() {
	const [{ serviceLinks, rightLinks }, settings] = await Promise.all([
		getTopBarNavGroups(),
		getPublicStoreSettings(),
	])

	const city = settings?.city ?? null
	const address = settings?.address ?? null
	const phone = settings?.phone ?? null
	const workingHours = settings?.workingHours ?? {}
	const allHoursEntries = Object.entries(workingHours)
	const todayHours = Object.keys(workingHours).length > 0
		? getTodayWorkingHours(workingHours)
		: null
	// Найти ключ дня для сегодняшних часов (например "Пн-Пт")
	const todayKey = todayHours
		? allHoursEntries.find(([, v]) => v === todayHours)?.[0] ?? null
		: null
	const todayLabel = todayKey && todayHours ? `${todayKey}: ${todayHours}` : todayHours
	const phoneHref = phone
		? `tel:${phone.replace(/[^\d+]/g, '')}`
		: null

	// Строка адреса: "Мозырь, бул. Юности 127" или просто "Мозырь"
	const locationText = [city, address].filter(Boolean).join(', ')

	return (
		<div className='hidden md:block text-sm'>
			<div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-2'>
				<div className='flex items-center gap-6'>
					{locationText && (
						<span className='flex items-center gap-1 text-foreground'>
							<MapPin className='h-4 w-4 shrink-0' />
							<span>{locationText}</span>
						</span>
					)}
					<nav className='hidden md:flex items-center gap-4'>
						{serviceLinks.map(link => (
							<Link
								key={link.href}
								href={link.href}
								className='text-muted-foreground hover:text-foreground transition-colors'
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>

				<div className='flex items-center gap-6'>
					<nav className='hidden lg:flex items-center gap-4'>
						{rightLinks.map(link => (
							<Link
								key={link.href}
								href={link.href}
								className='text-muted-foreground hover:text-foreground transition-colors'
							>
								{link.label}
							</Link>
						))}
					</nav>
					{phone && phoneHref && (
						<div className='flex items-center gap-3'>
							<a
								href={phoneHref}
								className='flex items-center gap-1 text-foreground hover:text-primary transition-colors'
							>
								<Phone className='h-4 w-4' />
								<span className='font-normal'>{phone}</span>
							</a>
							{allHoursEntries.length > 0 && (
								<div className='relative group'>
									<span className='text-muted-foreground text-xs cursor-default select-none'>
										{todayLabel ?? allHoursEntries[0]?.[1]}
									</span>
									{/* CSS-only тултип с полным расписанием */}
									<div className='absolute right-0 top-full mt-1 z-50 hidden group-hover:block
										bg-popover border border-border rounded-md shadow-md p-2 min-w-[160px] text-xs'>
										{allHoursEntries.map(([day, hours]) => (
											<div key={day} className='flex justify-between gap-3 py-0.5'>
												<span className='text-muted-foreground'>{day}:</span>
												<span className='text-foreground font-medium'>{hours}</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

'use client'

/**
 * CategoryNavDropdown — выпадающее мега-меню подкатегорий для CategoryNav.
 *
 * Появляется при наведении на пункт CategoryNav.
 * Показывает колонки подкатегорий (по типу, стилю, месту, особенностям)
 * и опционально промо-баннеры справа.
 *
 * Использует: cn() из дизайн-системы. Ссылки через next/link, изображения через next/image.
 */

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/shared/lib/utils'
import type { CatalogMenuItem } from '@/shared/config/catalogMenu'

interface CategoryNavDropdownProps {
	item: CatalogMenuItem
	onClose: () => void
}

export default function CategoryNavDropdown({
	item,
	onClose,
}: CategoryNavDropdownProps) {
	const hasBanners = item.banners && item.banners.length > 0

	return (
		<div className='absolute left-0 right-0 z-50 border-b border-border bg-card shadow-lg'>
			<div className='mx-auto flex max-w-7xl gap-8 px-4 py-6'>
				{/* Колонки подкатегорий */}
				<div
					className={cn(
						'grid flex-1 gap-x-8 gap-y-6',
						item.groups.length >= 4
							? 'grid-cols-4'
							: item.groups.length === 3
								? 'grid-cols-3'
								: item.groups.length === 2
									? 'grid-cols-2'
									: 'grid-cols-1',
					)}
				>
					{item.groups.map(group => (
						<div key={group.title}>
							<h3 className='mb-3 text-xs font-semibold uppercase tracking-widest text-foreground'>
								{group.title}
							</h3>
							<ul className='space-y-2'>
								{group.links.map(link => (
									<li key={link.href}>
										<Link
											href={link.href}
											onClick={onClose}
											className='text-sm text-foreground transition-colors hover:text-primary'
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{/* Промо-баннеры */}
				{hasBanners && (
					<div className='flex w-64 shrink-0 flex-col gap-4'>
						{item.banners!.map(banner => (
							<Link
								key={banner.href}
								href={banner.href}
								onClick={onClose}
								className='relative block overflow-hidden rounded-sm'
							>
								<Image
									src={banner.image}
									alt={banner.alt}
									width={256}
									height={160}
									className='h-40 w-full object-cover transition-transform duration-300 hover:scale-105'
								/>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { resolveCatalogLinkHref } from '@/lib/home-sections/catalog-link-resolver'
import UnderlineAnimation from '@/shared/ui/UnderlineAnimation'

interface Room {
	label: string
	href: string
	image: string
	linkCategoryId?: string
	linkPropertyId?: string
	linkPropertyValueId?: string
}

const DEFAULT_ROOMS: Room[] = [
	{
		label: 'В СПАЛЬНЮ',
		href: '/catalog?prop.room=bedroom',
		image: '/sleepbed.svg',
	},
	{
		label: 'В ГОСТИНУЮ',
		href: '/catalog?prop.room=living',
		image: '/sofa.svg',
	},
	{ label: 'В ОФИС', href: '/catalog?prop.room=office', image: '/office.svg' },
	{
		label: 'В ВАННУЮ',
		href: '/catalog?prop.room=bathroom',
		image: '/bath.svg',
	},
	{
		label: 'НА КУХНЮ',
		href: '/catalog?prop.room=kitchen',
		image: '/gasstove.svg',
	},
	{
		label: 'В ДЕТСКУЮ',
		href: '/catalog?prop.room=kids',
		image: '/babybed.svg',
	},
	{
		label: 'В ПРИХОЖУЮ',
		href: '/catalog?prop.room=hallway',
		image: '/hanger.svg',
	},
]

function resolveImage(image: string): string {
	if (!image) return ''
	if (image.startsWith('http') || image.startsWith('/')) return image
	return `/api/storage/file?key=${image}`
}

export default async function RoomCategories({
	title,
	config,
}: {
	title?: string | null
	config?: Record<string, unknown> | null
}) {
	const inputRooms: Room[] =
		Array.isArray(config?.rooms) && (config!.rooms as Room[]).length > 0
			? (config!.rooms as Room[])
			: DEFAULT_ROOMS
	const rooms = await Promise.all(
		inputRooms.map(async room => ({
			...room,
			href:
				(await resolveCatalogLinkHref(prisma, {
					href: room.href,
					linkCategoryId: room.linkCategoryId,
					linkPropertyId: room.linkPropertyId,
					linkPropertyValueId: room.linkPropertyValueId,
				})) ?? room.href,
		})),
	)

	const heading =
		(config?.heading as string | undefined) ?? title ?? 'Товары по расположению'

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
				{heading}
			</h2>
			<div className='grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-4 md:grid-cols-7'>
				{rooms.map((room, idx) => (
					<Link
						key={room.href || idx}
						href={room.href || '#'}
						className='group flex flex-col items-center gap-2 p-2 sm:gap-3 sm:p-4'
					>
						<div className='relative h-16 w-16 sm:h-24 sm:w-24'>
							{room.image ? (
								<Image
									src={resolveImage(room.image)}
									alt={room.label}
									fill
									className='object-contain'
									unoptimized
								/>
							) : (
								<div className='h-full w-full rounded-full bg-muted/40' />
							)}
						</div>
						<UnderlineAnimation>
							<span className='text-center text-xs font-normal uppercase tracking-widest text-foreground py-1'>
								{room.label}
							</span>
						</UnderlineAnimation>
					</Link>
				))}
			</div>
		</section>
	)
}

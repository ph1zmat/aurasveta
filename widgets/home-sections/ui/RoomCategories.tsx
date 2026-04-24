import Image from 'next/image'
import Link from 'next/link'
import UnderlineAnimation from '@/shared/ui/UnderlineAnimation'

interface Room {
	label: string
	href: string
	image: string
}

const rooms: Room[] = [
	{ label: 'В СПАЛЬНЮ', href: '/room/bedroom', image: '/sleepbed.svg' },
	{
		label: 'В ГОСТИНУЮ',
		href: '/room/living',
		image: '/sofa.svg',
	},
	{ label: 'В ОФИС', href: '/room/office', image: '/office.svg' },
	{
		label: 'В ВАННУЮ',
		href: '/room/bathroom',
		image: '/bath.svg',
	},
	{
		label: 'НА КУХНЮ',
		href: '/room/kitchen',
		image: '/gasstove.svg',
	},
	{ label: 'В ДЕТСКУЮ', href: '/room/kids', image: '/babybed.svg' },
	{
		label: 'В ПРИХОЖУЮ',
		href: '/room/hallway',
		image: '/hanger.svg',
	},
]

export default function RoomCategories() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
				Товары по расположению
			</h2>
			<div className='grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-4 md:grid-cols-7'>
				{rooms.map(room => (
					<Link
						key={room.href}
						href={room.href}
						className='group flex flex-col items-center gap-2 p-2 sm:gap-3 sm:p-4'
					>
						<div className='relative h-16 w-16 sm:h-24 sm:w-24'>
							<Image
								src={room.image}
								alt={room.label}
								fill
								className='object-contain'
							/>
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

import Link from 'next/link'
import { Button } from '@/shared/ui/Button'

const queries = [
	'люстра для кухни',
	'уличные светодиодные светильники',
	'люстра для детской',
	'люстры-вентиляторы',
	'трековые системы',
	'люстра до 15000',
	'трековые led светильники',
	'светильники maytoni',
	'люстра st luce',
	'подвесной лофт светильник',
]

export default function PopularQueries() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-3 text-base font-semibold uppercase tracking-widest text-foreground md:mb-4 md:text-lg'>
				Популярные запросы
			</h2>
			<div className='flex flex-wrap gap-2'>
				{queries.map(query => (
					<Button asChild key={query} variant='chip'>
						<Link href={`/search?q=${encodeURIComponent(query)}`}>
							{query}
						</Link>
					</Button>
				))}
			</div>
		</section>
	)
}

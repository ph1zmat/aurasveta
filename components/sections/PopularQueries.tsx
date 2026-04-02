import Link from 'next/link'

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
		<section className='mx-auto max-w-7xl px-4 py-8'>
			<h2 className='mb-4 text-lg font-bold uppercase tracking-wider text-foreground'>
				Популярные запросы
			</h2>
			<div className='flex flex-wrap gap-2'>
				{queries.map(query => (
					<Link
						key={query}
						href={`/search?q=${encodeURIComponent(query)}`}
						className='rounded-full border border-foreground bg-transparent px-4 py-2 text-sm text-foreground transition-colors duration-200 hover:bg-foreground hover:text-card'
					>
						{query}
					</Link>
				))}
			</div>
		</section>
	)
}

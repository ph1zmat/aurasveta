import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/shared/ui/Button'

interface PopularQueriesSectionConfig {
	limit?: number
	heading?: string
}

interface PopularQueriesSectionProps {
	title?: string | null
	config?: PopularQueriesSectionConfig
}

const HARDCODED_FALLBACK = [
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

export default async function PopularQueriesSection({
	title,
	config,
}: PopularQueriesSectionProps) {
	const limit = Math.min(Math.max(config?.limit ?? 10, 1), 30)
	const heading = config?.heading ?? title ?? 'Популярные запросы'

	const lastWeek = new Date()
	lastWeek.setDate(lastWeek.getDate() - 7)

	const [results, setting] = await Promise.all([
		prisma.searchQuery.groupBy({
			by: ['query'],
			where: { createdAt: { gte: lastWeek } },
			_count: { query: true },
			orderBy: { _count: { query: 'desc' } },
			take: limit,
		}),
		prisma.setting.findUnique({ where: { key: 'home_popular_queries' } }),
	])

	let queries: string[]

	if (results.length > 0) {
		queries = results.map(r => r.query)
	} else {
		const settingValue = setting?.value
		if (Array.isArray(settingValue) && settingValue.length > 0) {
			queries = settingValue.map(String).filter(Boolean)
		} else {
			queries = HARDCODED_FALLBACK
		}
	}

	if (queries.length === 0) return null

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-3 text-base font-semibold uppercase tracking-widest text-foreground md:mb-4 md:text-lg'>
				{heading}
			</h2>
			<div className='flex flex-wrap gap-2'>
				{queries.map(query => (
					<Button asChild key={query} variant='chip'>
						<Link href={`/search?q=${encodeURIComponent(query)}`}>{query}</Link>
					</Button>
				))}
			</div>
		</section>
	)
}

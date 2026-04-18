import { Suspense } from 'react'
import type { Metadata } from 'next'
import SearchContent from './SearchContent'
import Skeleton from '@/shared/ui/Skeleton'
import { trpc, HydrateClient } from '@/lib/trpc/server'

export const metadata: Metadata = {
	title: 'Поиск товаров | Aura Sveta',
	description: 'Поиск по каталогу товаров',
}

export default async function SearchPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const sp = await searchParams
	const query = typeof sp.q === 'string' ? sp.q : ''

	// Prefetch search results when arriving with ?q=
	if (query.length >= 2) {
		void trpc.search.search.prefetchInfinite({
			query,
			limit: 12,
			sortBy: 'relevance',
		})
	}

	return (
		<HydrateClient>
		<Suspense
			fallback={
				<div className='mx-auto max-w-7xl px-4 py-6 space-y-4'>
					<Skeleton className='h-7 w-64' />
					<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
						{Array.from({ length: 8 }).map((_, i) => (
							<div
								key={i}
								className='rounded-2xl border border-border p-4 space-y-3'
							>
								<Skeleton className='h-36 w-full rounded-xl' />
								<Skeleton className='h-4 w-4/5' />
								<Skeleton className='h-4 w-1/2' />
								<Skeleton className='h-10 w-full rounded-lg' />
							</div>
						))}
					</div>
				</div>
			}
		>
			<SearchContent />
		</Suspense>
		</HydrateClient>
	)
}

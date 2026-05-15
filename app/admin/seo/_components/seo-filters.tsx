'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SEO_FILTERS, TARGET_TYPE_OPTIONS } from '../_lib/constants'
import type { SeoFilter, SeoTargetType } from '../_lib/constants'

interface SeoFiltersProps {
	filter: SeoFilter
	setFilter: (f: SeoFilter) => void
	typeFilter: SeoTargetType | 'all'
	setTypeFilter: (t: SeoTargetType | 'all') => void
	searchQuery: string
	setSearchQuery: (q: string) => void
}

export function SeoFilters({ filter, setFilter, typeFilter, setTypeFilter, searchQuery, setSearchQuery }: SeoFiltersProps) {
	return (
		<div className='flex flex-wrap items-center gap-2'>
			<div className='flex gap-1'>
				<Button size='sm' variant={typeFilter === 'all' ? 'default' : 'outline'} onClick={() => setTypeFilter('all')} className='text-xs h-7'>
					Все типы
				</Button>
				{TARGET_TYPE_OPTIONS.map((t) => (
					<Button key={t} size='sm' variant={typeFilter === t ? 'default' : 'outline'} onClick={() => setTypeFilter(t)} className='text-xs h-7'>
						{t}
					</Button>
				))}
			</div>
			<div className='w-px h-5 bg-border' />
			{SEO_FILTERS.map((f) => (
				<Button
					key={f}
					variant={filter === f ? 'secondary' : 'ghost'}
					size='sm'
					onClick={() => setFilter(f)}
					className='text-xs h-7'
				>
					{f === 'all' && 'Все'}
					{f === 'missing-title' && 'Нет title'}
					{f === 'missing-desc' && 'Нет desc'}
					{f === 'noindex' && 'Noindex'}
				</Button>
			))}
			<div className='w-px h-5 bg-border' />
			<Input
				placeholder='Поиск...'
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className='h-7 text-xs w-40'
			/>
		</div>
	)
}

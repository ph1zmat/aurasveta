'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select'
import { useFilterDrawer } from '@/features/catalog-filter/ui/mobilefilterwrapper'
import CountBadge from '@/shared/ui/countbadge'

interface ResultsBarProps {
	total: number
	filterCount?: number
	onReset?: () => void
}

const SORT_OPTIONS = [
	{ value: 'newest', label: 'Новинки' },
	{ value: 'price-asc', label: 'Цена ↑' },
	{ value: 'price-desc', label: 'Цена ↓' },
	{ value: 'name', label: 'По названию' },
	{ value: 'rating', label: 'По рейтингу' },
] as const

export default function ResultsBar({
	total,
	filterCount,
	onReset,
}: ResultsBarProps) {
	const onMobileFilterOpen = useFilterDrawer()
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const currentSort = searchParams.get('sort') ?? 'newest'

	const resolvedFilterCount =
		filterCount ??
		[
			searchParams.get('search'),
			searchParams.get('minPrice'),
			searchParams.get('maxPrice'),
			searchParams.get('sort') && searchParams.get('sort') !== 'newest'
				? searchParams.get('sort')
				: null,
		].filter(Boolean).length

	const hasActiveControls = useMemo(
		() => resolvedFilterCount > 0 || currentSort !== 'newest',
		[currentSort, resolvedFilterCount],
	)

	function handleSortChange(value: string) {
		const params = new URLSearchParams(searchParams.toString())
		if (value && value !== 'newest') {
			params.set('sort', value)
		} else {
			params.delete('sort')
		}
		params.set('page', '1')
		router.replace(`${pathname}?${params.toString()}`, { scroll: false })
	}

	return (
		<div className='mb-4 flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between'>
			<div className='flex items-center gap-3'>
				<span className='text-sm text-muted-foreground'>
					Найдено{' '}
					<span className='font-medium text-foreground'>
						{total.toLocaleString('ru-RU')}
					</span>{' '}
					товаров
				</span>
				{onMobileFilterOpen && (
					<Button
						variant='subtle'
						size='compact'
						className='lg:hidden'
						onClick={onMobileFilterOpen}
					>
						<span className='relative'>
							<SlidersHorizontal className='h-3.5 w-3.5' strokeWidth={1.5} />
							<CountBadge
								count={resolvedFilterCount}
								className='-right-2 -top-2 text-[9px]'
							/>
						</span>
						Фильтры
					</Button>
				)}
			</div>

			<div className='flex flex-wrap items-center gap-2 sm:justify-end'>
				<Select value={currentSort} onValueChange={handleSortChange}>
					<SelectTrigger className='min-w-[200px] bg-background'>
						<SelectValue placeholder='Сортировка' />
					</SelectTrigger>
					<SelectContent>
						{SORT_OPTIONS.map(option => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{hasActiveControls && onReset ? (
					<Button variant='ghost' size='sm' className='gap-1.5' onClick={onReset}>
						<RotateCcw className='h-3.5 w-3.5' strokeWidth={1.5} />
						Сбросить
					</Button>
				) : null}
			</div>
		</div>
	)
}

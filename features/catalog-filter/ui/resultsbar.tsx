'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useFilterDrawer } from '@/features/catalog-filter/ui/mobilefilterwrapper'
import { useSearchParams } from 'next/navigation'
import CountBadge from '@/shared/ui/countbadge'

interface ResultsBarProps {
	total: number
}

export default function ResultsBar({ total }: ResultsBarProps) {
	const onMobileFilterOpen = useFilterDrawer()
	const searchParams = useSearchParams()

	const filterCount = [
		searchParams.get('search'),
		searchParams.get('minPrice'),
		searchParams.get('maxPrice'),
		searchParams.get('sort') && searchParams.get('sort') !== 'newest'
			? searchParams.get('sort')
			: null,
	].filter(Boolean).length

	return (
		<div className='mb-4 flex items-center justify-between border-b border-border pb-3'>
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
								count={filterCount}
								className='-right-2 -top-2 text-[9px]'
							/>
						</span>
						Фильтры
					</Button>
				)}
			</div>
		</div>
	)
}

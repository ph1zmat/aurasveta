'use client'

import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useFilterDrawer } from '@/components/catalog/MobileFilterWrapper'

interface ResultsBarProps {
	total: number
	sortOptions?: string[]
	defaultSort?: string
}

export default function ResultsBar({
	total,
	sortOptions = [
		'по популярности',
		'по цене ↑',
		'по цене ↓',
		'по новизне',
		'по рейтингу',
	],
	defaultSort = 'по популярности',
}: ResultsBarProps) {
	const [sort, setSort] = useState(defaultSort)
	const [open, setOpen] = useState(false)
	const onMobileFilterOpen = useFilterDrawer()

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
						<SlidersHorizontal className='h-3.5 w-3.5' strokeWidth={1.5} />
						Фильтры
					</Button>
				)}
			</div>

			{/* Sort dropdown */}
			<div className='relative'>
				<button
					onClick={() => setOpen(!open)}
					className='flex items-center gap-1 text-sm text-foreground'
				>
					Сортировать: <span className='font-medium'>{sort}</span>
					<ChevronDown
						className='h-3.5 w-3.5 text-muted-foreground'
						strokeWidth={1.5}
					/>
				</button>

				{open && (
					<div className='absolute right-0 top-full z-30 mt-1 min-w-[180px] rounded-sm border border-border bg-card py-1 shadow-md'>
						{sortOptions.map(opt => (
							<button
								key={opt}
								onClick={() => {
									setSort(opt)
									setOpen(false)
								}}
								className='block w-full px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent'
							>
								{opt}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface AdminPaginationProps {
	page: number
	totalPages: number
	limit: number
	onPageChange: (page: number) => void
	onLimitChange?: (limit: number) => void
	total?: number
}

const LIMIT_OPTIONS = [20, 50, 100]

/**
 * Полноценная пагинация для админ-панели:
 * - Показ страниц с многоточием (1 2 3 ... 48 49 50)
 * - Переход на конкретную страницу через input
 * - Выбор limit на страницу
 */
export default function AdminPagination({
	page,
	totalPages,
	limit,
	onPageChange,
	onLimitChange,
	total,
}: AdminPaginationProps) {
	const [jumpPage, setJumpPage] = useState('')

	const getPageNumbers = useCallback(() => {
		const pages: (number | string)[] = []
		const maxVisible = 5

		if (totalPages <= maxVisible + 2) {
			for (let i = 1; i <= totalPages; i++) pages.push(i)
			return pages
		}

		// Всегда показываем первую, последнюю и текущую с соседями
		pages.push(1)

		const left = Math.max(2, page - 1)
		const right = Math.min(totalPages - 1, page + 1)

		if (left > 2) pages.push('...')
		for (let i = left; i <= right; i++) pages.push(i)
		if (right < totalPages - 1) pages.push('...')

		pages.push(totalPages)
		return pages
	}, [page, totalPages])

	const handleJump = () => {
		const p = parseInt(jumpPage, 10)
		if (!isNaN(p) && p >= 1 && p <= totalPages) {
			onPageChange(p)
			setJumpPage('')
		}
	}

	if (totalPages <= 1) return null

	return (
		<div className='flex flex-wrap items-center justify-between gap-3 mt-4'>
			<div className='flex items-center gap-2 text-xs text-muted-foreground'>
				<span>
					Страница {page} из {totalPages}
					{total !== undefined && ` · ${total} всего`}
				</span>
				{onLimitChange && (
					<div className='flex items-center gap-1 ml-2'>
						<span>По</span>
						{LIMIT_OPTIONS.map((l) => (
							<Button
								key={l}
								variant={limit === l ? 'default' : 'ghost'}
								size='sm'
								className='h-6 px-1.5 text-[10px]'
								onClick={() => onLimitChange(l)}
							>
								{l}
							</Button>
						))}
					</div>
				)}
			</div>

			<div className='flex items-center gap-1'>
				<Button
					variant='outline'
					size='icon'
					className='h-8 w-8'
					onClick={() => onPageChange(1)}
					disabled={page <= 1}
					aria-label='Первая страница'
				>
					<ChevronsLeft className='h-4 w-4' />
				</Button>
				<Button
					variant='outline'
					size='icon'
					className='h-8 w-8'
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
					aria-label='Предыдущая страница'
				>
					<ChevronLeft className='h-4 w-4' />
				</Button>

				{getPageNumbers().map((p, i) =>
					p === '...' ? (
						<span key={`ellipsis-${i}`} className='px-1 text-muted-foreground text-sm'>
							...
						</span>
					) : (
						<Button
							key={p}
							variant={p === page ? 'default' : 'outline'}
							size='sm'
							className='h-8 min-w-[32px]'
							onClick={() => onPageChange(p as number)}
						>
							{p}
						</Button>
					)
				)}

				<Button
					variant='outline'
					size='icon'
					className='h-8 w-8'
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
					aria-label='Следующая страница'
				>
					<ChevronRight className='h-4 w-4' />
				</Button>
				<Button
					variant='outline'
					size='icon'
					className='h-8 w-8'
					onClick={() => onPageChange(totalPages)}
					disabled={page >= totalPages}
					aria-label='Последняя страница'
				>
					<ChevronsRight className='h-4 w-4' />
				</Button>

				<div className='flex items-center gap-1 ml-2'>
					<Input
						type='number'
						min={1}
						max={totalPages}
						value={jumpPage}
						onChange={(e) => setJumpPage(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && handleJump()}
						className='h-8 w-14 text-center text-sm'
						placeholder='#'
					/>
					<Button variant='outline' size='sm' className='h-8' onClick={handleJump}>
						Перейти
					</Button>
				</div>
			</div>
		</div>
	)
}

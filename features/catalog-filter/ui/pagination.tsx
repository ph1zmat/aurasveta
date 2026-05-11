import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface PaginationProps {
	currentPage: number
	totalPages: number
	onPageChange?: (page: number) => void
}

export default function Pagination({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationProps) {
	const pages: (number | '...')[] = []

	if (totalPages <= 5) {
		for (let i = 1; i <= totalPages; i++) pages.push(i)
	} else {
		pages.push(1)
		if (currentPage > 3) pages.push('...')
		const start = Math.max(2, currentPage - 1)
		const end = Math.min(totalPages - 1, currentPage + 1)
		for (let i = start; i <= end; i++) pages.push(i)
		if (currentPage < totalPages - 2) pages.push('...')
		pages.push(totalPages)
	}

	return (
		<nav
			aria-label='Навигация по страницам'
			className='flex items-center justify-center gap-1 py-6'
		>
			<button
				type='button'
				disabled={currentPage === 1}
				onClick={() => onPageChange?.(currentPage - 1)}
				className='cursor-pointer p-2 text-foreground transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40'
				aria-label='Предыдущая страница'
			>
				<ChevronLeft className='h-4 w-4' strokeWidth={1.5} />
			</button>

			{pages.map((page, i) =>
				page === '...' ? (
					<span
						key={`dots-${i}`}
						className='px-2 text-sm text-muted-foreground'
					>
						...
					</span>
				) : (
					<button
						type='button'
						key={page}
						onClick={() => onPageChange?.(page as number)}
						className={cn(
							'min-w-[36px] cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
							page === currentPage
								? 'border border-foreground bg-card text-foreground'
								: 'text-foreground hover:bg-accent',
						)}
					>
						{page}
					</button>
				),
			)}

			<button
				type='button'
				disabled={currentPage === totalPages}
				onClick={() => onPageChange?.(currentPage + 1)}
				className='cursor-pointer p-2 text-foreground transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40'
				aria-label='Следующая страница'
			>
				<ChevronRight className='h-4 w-4' strokeWidth={1.5} />
			</button>
		</nav>
	)
}

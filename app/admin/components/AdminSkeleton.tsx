'use client'

import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Skeleton from '@/shared/ui/Skeleton'

/*
 * Общие skeleton-компоненты для админ-панели.
 * Используются вместо текстовых "Загрузка..." для плавного UX.
 */

/** Skeleton для таблицы с N строками */
export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
	return (
		<Card className='border-border overflow-hidden'>
			<Table>
				<TableHeader>
					<TableRow className='border-border hover:bg-transparent'>
						{Array.from({ length: columns }).map((_, i) => (
							<TableHead key={i}>
								<Skeleton className='h-4 w-16' />
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: rows }).map((_, r) => (
						<TableRow key={r} className='border-border'>
							{Array.from({ length: columns }).map((_, c) => (
								<TableCell key={c}>
									<Skeleton
										className={`h-4 ${c === 0 ? 'w-10' : c === columns - 1 ? 'w-20 ml-auto' : 'w-full max-w-[120px]'}`}
									/>
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Card>
	)
}

/** Skeleton для сетки карточек (KPI, категории и т.д.) */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
			{Array.from({ length: count }).map((_, i) => (
				<Card key={i} className='border-border p-5 space-y-3'>
					<div className='flex items-center justify-between'>
						<Skeleton className='h-4 w-20' />
						<Skeleton className='h-9 w-9 rounded-md' />
					</div>
					<div className='space-y-2'>
						<Skeleton className='h-8 w-24' />
						<Skeleton className='h-3 w-32' />
					</div>
				</Card>
			))}
		</div>
	)
}

/** Skeleton для формы с N полями */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
	return (
		<Card className='border-border p-5 space-y-4'>
			{Array.from({ length: fields }).map((_, i) => (
				<div key={i} className='space-y-2'>
					<Skeleton className='h-4 w-24' />
					<Skeleton className='h-9 w-full' />
				</div>
			))}
			<Skeleton className='h-9 w-32' />
		</Card>
	)
}

/** Skeleton для Kanban-доски (5 колонок) */
export function KanbanSkeleton() {
	return (
		<div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className='space-y-3'>
					<Skeleton className='h-6 w-full' />
					{Array.from({ length: 3 }).map((_, j) => (
						<Card key={j} className='border-border p-3 space-y-2'>
							<Skeleton className='h-4 w-3/4' />
							<Skeleton className='h-3 w-1/2' />
							<div className='flex gap-2'>
								<Skeleton className='h-3 w-12' />
								<Skeleton className='h-3 w-12' />
							</div>
						</Card>
					))}
				</div>
			))}
		</div>
	)
}

/** Skeleton для списка элементов (sidebar, pages list) */
export function ListSkeleton({ items = 6 }: { items?: number }) {
	return (
		<div className='space-y-2'>
			{Array.from({ length: items }).map((_, i) => (
				<div key={i} className='flex items-center gap-3 py-2'>
					<Skeleton className='h-8 w-8 rounded-md' />
					<div className='flex-1 space-y-1'>
						<Skeleton className='h-4 w-3/4' />
						<Skeleton className='h-3 w-1/2' />
					</div>
				</div>
			))}
		</div>
	)
}

import * as React from 'react'
import {
	flexRender,
	getCoreRowModel,
	type OnChangeFn,
	useReactTable,
	type ColumnDef,
	type PaginationState,
	type SortingState,
} from '@tanstack/react-table'

export interface AdminDataTableProps<TData> {
	columns: ColumnDef<TData, unknown>[]
	data: TData[]
	pageCount: number
	pagination: PaginationState
	onPaginationChange: OnChangeFn<PaginationState>
	sorting: SortingState
	onSortingChange: OnChangeFn<SortingState>
	isLoading?: boolean
	emptyTitle?: string
	emptyDescription?: string
	toolbar?: React.ReactNode
	footer?: React.ReactNode
}

export function AdminDataTable<TData>({
	columns,
	data,
	pageCount,
	pagination,
	onPaginationChange,
	sorting,
	onSortingChange,
	isLoading = false,
	emptyTitle = 'Нет данных',
	emptyDescription = 'Попробуйте изменить фильтры или добавить новую запись.',
	toolbar,
	footer,
}: AdminDataTableProps<TData>) {
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
		pageCount,
		state: {
			pagination,
			sorting,
		},
		onPaginationChange,
		onSortingChange,
	})

	const rows = table.getRowModel().rows
	const colSpan = columns.length || 1

	return (
		<div className='space-y-4'>
			{toolbar}

			<div className='overflow-hidden rounded-2xl border border-border bg-background shadow-xs'>
				<div className='overflow-x-auto'>
					<table className='min-w-full border-collapse text-sm'>
						<thead className='bg-muted/30'>
							{table.getHeaderGroups().map(headerGroup => (
								<tr key={headerGroup.id} className='border-b border-border'>
									{headerGroup.headers.map(header => {
										const canSort = header.column.getCanSort()
										const sortState = header.column.getIsSorted()

										return (
											<th
												key={header.id}
												scope='col'
												className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground'
											>
												{header.isPlaceholder ? null : canSort ? (
													<button
														type='button'
														onClick={header.column.getToggleSortingHandler()}
														className='inline-flex items-center gap-2 text-left transition-colors hover:text-foreground'
													>
														<span>
															{flexRender(
																header.column.columnDef.header,
																header.getContext(),
															)}
														</span>
														<span className='text-[10px] text-muted-foreground/80'>
															{sortState === 'asc'
																? '▲'
																: sortState === 'desc'
																	? '▼'
																	: '↕'}
														</span>
													</button>
												) : (
													flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)
												)}
											</th>
										)
									})}
								</tr>
							))}
						</thead>
						<tbody>
							{isLoading ? (
								Array.from({ length: pagination.pageSize }).map((_, index) => (
									<tr
										key={`skeleton-${index}`}
										className='border-b border-border/70'
									>
										<td colSpan={colSpan} className='px-4 py-4'>
											<div className='h-12 animate-pulse rounded-xl bg-muted/40' />
										</td>
									</tr>
								))
							) : rows.length > 0 ? (
								rows.map(row => (
									<tr
										key={row.id}
										className='border-b border-border/70 align-top transition-colors hover:bg-muted/20'
									>
										{row.getVisibleCells().map(cell => (
											<td key={cell.id} className='px-4 py-4'>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</td>
										))}
									</tr>
								))
							) : (
								<tr>
									<td colSpan={colSpan} className='px-6 py-14 text-center'>
										<div className='space-y-2'>
											<p className='text-sm font-medium text-foreground'>
												{emptyTitle}
											</p>
											<p className='text-sm text-muted-foreground'>
												{emptyDescription}
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div className='text-sm text-muted-foreground'>
					Страница {pagination.pageIndex + 1} из {Math.max(pageCount, 1)}
				</div>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() =>
							onPaginationChange({
								...pagination,
								pageIndex: Math.max(pagination.pageIndex - 1, 0),
							})
						}
						disabled={pagination.pageIndex <= 0 || isLoading}
						className='rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
					>
						Назад
					</button>
					<button
						type='button'
						onClick={() =>
							onPaginationChange({
								...pagination,
								pageIndex: Math.min(
									pagination.pageIndex + 1,
									Math.max(pageCount - 1, 0),
								),
							})
						}
						disabled={pagination.pageIndex >= pageCount - 1 || isLoading}
						className='rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
					>
						Вперёд
					</button>
				</div>
			</div>

			{footer}
		</div>
	)
}

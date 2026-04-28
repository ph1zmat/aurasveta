'use client'

import { useMemo } from 'react'
import type {
	ColumnDef,
	PaginationState,
	SortingState,
} from '@tanstack/react-table'
import {
	AdminDataTable,
	readBooleanParam,
	readEnumParam,
	readPositiveIntParam,
	readStringParam,
	useDebouncedValue,
} from '@aurasveta/shared-admin'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import {
	Plus,
	Pencil,
	Trash2,
	ExternalLink,
} from 'lucide-react'
import { useAdminSearchParams } from '../hooks/useAdminSearchParams'
import PageFormModal from './PageFormModal'

type AdminPagesList = RouterOutputs['pages']['getAdminList']
type AdminPageItem = AdminPagesList['items'][number]
type PageSortKey = 'updatedAt' | 'title' | 'slug' | 'createdAt' | 'isPublished'

const PAGE_SIZE = 10

export default function PagesClient() {
	const utils = trpc.useUtils()
	const { searchParams, updateSearchParams } = useAdminSearchParams()
	const deleteMut = trpc.pages.delete.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.pages.getAll.invalidate(),
				utils.pages.getAdminList.invalidate(),
			])
		},
	})
	const showCreate =
		readBooleanParam(searchParams.get('create'), false) === true
	const editId = readStringParam(searchParams.get('edit')) || null
	const search = readStringParam(searchParams.get('search'))
	const page = readPositiveIntParam(searchParams.get('page'), 1)
	const sortBy = readEnumParam(
		searchParams.get('sortBy'),
		['updatedAt', 'title', 'slug', 'createdAt', 'isPublished'] as const,
		'updatedAt',
	)
	const sortDir = readEnumParam(
		searchParams.get('sortDir'),
		['asc', 'desc'] as const,
		'desc',
	)
	const pagination: PaginationState = {
		pageIndex: page - 1,
		pageSize: PAGE_SIZE,
	}
	const sorting: SortingState = [{ id: sortBy, desc: sortDir === 'desc' }]

	const debouncedSearch = useDebouncedValue(search, 300)

	const { data, isLoading, isFetching } = trpc.pages.getAdminList.useQuery({
		page,
		pageSize: pagination.pageSize,
		search: debouncedSearch,
		sortBy,
		sortDir,
	})

	const pages = data?.items ?? []
	const pageCount = data?.pageCount ?? 1

	const columns = useMemo<ColumnDef<AdminPageItem, unknown>[]>(
		() => [
			{
				accessorKey: 'title',
				header: 'Страница',
				cell: ({ row }) => {
					const page = row.original
					const contentPreview = page.content
						? page.content.slice(0, 120) +
							(page.content.length > 120 ? '...' : '')
						: 'Без текстового содержимого'

					return (
						<div className='min-w-[280px] space-y-2'>
							<div className='flex items-start gap-3'>
								<div
									className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
										page.isPublished
											? 'bg-emerald-500/12 text-emerald-600'
											: 'bg-amber-500/12 text-amber-600'
									}`}
								>
									{page.isPublished ? 'Published' : 'Draft'}
								</div>
								<div className='space-y-1'>
									<div className='font-medium text-foreground'>
										{page.title}
									</div>
									<div className='font-mono text-xs text-muted-foreground'>
										/{page.slug}
									</div>
								</div>
							</div>
							<p className='line-clamp-2 text-sm leading-6 text-muted-foreground'>
								{contentPreview}
							</p>
						</div>
					)
				},
			},
			{
				accessorKey: 'updatedAt',
				header: 'Обновлено',
				cell: ({ row }) => (
					<div className='min-w-[150px] text-sm text-foreground'>
						{new Date(row.original.updatedAt).toLocaleDateString('ru-RU', {
							day: 'numeric',
							month: 'short',
							year: 'numeric',
						})}
					</div>
				),
			},
			{
				accessorKey: 'author',
				header: 'Автор',
				enableSorting: false,
				cell: ({ row }) => (
					<div className='min-w-[180px] text-sm text-muted-foreground'>
						{row.original.author?.name || row.original.author?.email || '—'}
					</div>
				),
			},
			{
				id: 'versions',
				header: 'Версии',
				enableSorting: false,
				cell: ({ row }) => (
					<div className='text-sm text-muted-foreground'>
						{row.original._count?.versions ?? 0}
					</div>
				),
			},
			{
				id: 'actions',
				header: 'Действия',
				enableSorting: false,
				cell: ({ row }) => {
					const page = row.original

					return (
						<div className='flex min-w-[180px] items-center gap-2'>
							<button
								type='button'
								onClick={() => {
									updateSearchParams(
										{ edit: page.id, create: null },
										{ history: 'push' },
									)
								}}
								className='inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted'
							>
								<Pencil className='h-3.5 w-3.5' />
							</button>
							<a
								href={`/pages/${page.slug}`}
								target='_blank'
								rel='noreferrer'
								className='inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
							>
								<ExternalLink className='h-3.5 w-3.5' />
							</a>
							<button
								type='button'
								onClick={() => {
									if (confirm('Удалить страницу?')) {
										deleteMut.mutate(page.id)
									}
								}}
								className='inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-destructive'
							>
								<Trash2 className='h-3.5 w-3.5' />
							</button>
						</div>
					)
				},
			},
		],
		[deleteMut, updateSearchParams],
	)

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Страницы
				</h1>
				<button
					onClick={() => {
						updateSearchParams(
							{ create: true, edit: null },
							{ history: 'push' },
						)
					}}
					className='flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
				>
					<Plus className='h-4 w-4' /> Добавить
				</button>
			</div>

			{(showCreate || Boolean(editId)) && (
				<PageFormModal
					editId={editId}
					onClose={() =>
						updateSearchParams(
							{ create: null, edit: null },
							{ history: 'replace' },
						)
					}
					onSuccess={async () => {
						updateSearchParams(
							{ create: null, edit: null },
							{ history: 'replace' },
						)
						await Promise.all([
							utils.pages.getAll.invalidate(),
							utils.pages.getAdminList.invalidate(),
						])
					}}
				/>
			)}

			<AdminDataTable
				columns={columns}
				data={pages}
				pageCount={pageCount}
				pagination={pagination}
				onPaginationChange={updater => {
					const nextPagination =
						typeof updater === 'function' ? updater(pagination) : updater
					updateSearchParams(
						{ page: nextPagination.pageIndex + 1 },
						{ history: 'replace' },
					)
				}}
				sorting={sorting}
				onSortingChange={updater => {
					const nextSorting =
						typeof updater === 'function' ? updater(sorting) : updater
					const activeSort = nextSorting[0]
					updateSearchParams(
						{
							sortBy:
								(activeSort?.id as PageSortKey | undefined) ?? 'updatedAt',
							sortDir: activeSort?.desc ? 'desc' : 'asc',
							page: 1,
						},
						{ history: 'replace' },
					)
				}}
				isLoading={isLoading || isFetching}
				emptyTitle={debouncedSearch ? 'Страницы не найдены' : 'Нет страниц'}
				emptyDescription='Создайте первую страницу или измените параметры поиска.'
				toolbar={
					<div className='flex w-full flex-col gap-2 sm:w-auto sm:min-w-xs'>
						<input
							type='search'
							placeholder='Поиск по title / slug...'
							value={search}
							onChange={e => {
								updateSearchParams(
									{ search: e.target.value, page: 1 },
									{ history: 'replace' },
								)
							}}
							className='flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
						/>
					</div>
				}
			/>
		</div>
	)
}

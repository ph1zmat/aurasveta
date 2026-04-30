'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil } from 'lucide-react'
import dynamic from 'next/dynamic'

const PageFormModal = dynamic(() => import('./components/PageFormModal'))
import ConfirmDialog from '../components/ConfirmDialog'
import { ListSkeleton } from '../components/AdminSkeleton'

type EditablePage = {
	id: string
	title?: string | null
	slug?: string | null
	content?: string | null
	status?: string | null
	metaTitle?: string | null
	metaDesc?: string | null
}

export default function PagesClient() {
	const [modalOpen, setModalOpen] = useState(false)
	const [editingPage, setEditingPage] = useState<EditablePage | undefined>(undefined)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [confirmDelete, setConfirmDelete] = useState(false)

	const { data: pages, refetch, isLoading } = trpc.pages.getAll.useQuery()
	const { mutate: deletePage } = trpc.pages.delete.useMutation({
		onSuccess: () => {
			toast.success('Страница удалена')
			refetch()
			setSelectedId(null)
			setConfirmDelete(false)
		},
	})

	const selected = pages?.find((p) => p.id === selectedId)

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>CMS Страницы</h1>
					<p className='text-sm text-muted-foreground'>
						Управление контентными страницами
					</p>
				</div>
				<Button
					size='sm'
					onClick={() => {
						setEditingPage(undefined)
						setModalOpen(true)
					}}
				>
					<Plus className='h-4 w-4 mr-1' />
					Новая страница
				</Button>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
				{/* List */}
				<Card className='border-border'>
					<CardHeader>
						<CardTitle className='text-base font-bold'>Все страницы</CardTitle>
					</CardHeader>
					<CardContent className='space-y-1'>
						{isLoading ? (
							<ListSkeleton items={6} />
						) : (
							pages?.map((page) => (
								<div
									key={page.id}
									className={`flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-colors
										${selectedId === page.id ? 'bg-accent/10 text-accent' : 'hover:bg-secondary'}
									`}
									onClick={() => setSelectedId(page.id)}
								>
									<div className='flex-1 min-w-0'>
										<div className='text-sm font-medium truncate'>{page.title}</div>
										<div className='text-xs text-muted-foreground'>/{page.slug}</div>
									</div>
									<Badge
										className={
											page.status === 'PUBLISHED'
												? 'bg-success/15 text-success'
												: 'bg-warning/15 text-warning'
										}
									>
										{page.status === 'PUBLISHED' ? 'Опубликована' : 'Черновик'}
									</Badge>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* Editor */}
				<Card className='border-border'>
					<CardHeader className='flex flex-row items-center justify-between'>
						<CardTitle className='text-base font-bold'>
							{selected?.title ?? 'Редактор страницы'}
						</CardTitle>
						{selected && (
							<div className='flex gap-1'>
								<Button
									variant='ghost'
									size='icon'
									onClick={() => { setEditingPage(selected); setModalOpen(true) }}
									aria-label='Редактировать страницу'
								>
									<Pencil className='h-4 w-4' />
								</Button>
								<Button
									variant='ghost'
									size='icon'
									className='text-destructive'
									onClick={() => setConfirmDelete(true)}
									aria-label='Удалить страницу'
								>
									<Trash2 className='h-4 w-4' />
								</Button>
							</div>
						)}
					</CardHeader>
					<CardContent>
						{selected ? (
							<div className='space-y-4'>
								<div className='rounded-md border border-border p-4'>
									<p className='text-sm font-medium text-foreground'>
										Редактирование через Page Builder
									</p>
									<p className='mt-1 text-sm text-muted-foreground'>
										Контент, SEO и блоки теперь редактируются в единой модалке.
									</p>
								</div>
								<div className='flex flex-wrap gap-2'>
									<Button
										onClick={() => {
											setEditingPage(selected)
											setModalOpen(true)
										}}
									>
										<Pencil className='mr-1 h-4 w-4' />
										Открыть редактор
									</Button>
									<Button
										variant='outline'
										onClick={() => setConfirmDelete(true)}
										className='text-destructive'
									>
										<Trash2 className='mr-1 h-4 w-4' />
										Удалить страницу
									</Button>
								</div>
							</div>
						) : (
							<div className='text-center py-12 text-muted-foreground text-sm'>
								Выберите страницу
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<PageFormModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onSuccess={() => refetch()}
				page={editingPage}
			/>

			<ConfirmDialog
				open={confirmDelete}
				onOpenChange={setConfirmDelete}
				title='Подтвердите удаление'
				description='Страница будет безвозвратно удалена. Это действие нельзя отменить.'
				onConfirm={() => selected && deletePage(selected.id)}
			/>
		</div>
	)
}

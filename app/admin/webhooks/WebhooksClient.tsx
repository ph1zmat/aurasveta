'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Play, Pencil, Plus, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const WebhookFormModal = dynamic(() => import('./components/WebhookFormModal'))
import ConfirmDialog from '../components/ConfirmDialog'

type WebhookRow = {
	id: string
	url?: string | null
	events?: string[] | null
}

export default function WebhooksClient() {
	const [modalOpen, setModalOpen] = useState(false)
	const [editingWebhook, setEditingWebhook] = useState<WebhookRow | undefined>(
		undefined,
	)
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
	const [testResult, setTestResult] = useState<{ id: string; success: boolean; error?: string } | null>(null)

	const { data: webhooks, refetch, isLoading } = trpc.webhooks.getAll.useQuery()
	const { mutate: deleteWebhook } = trpc.webhooks.delete.useMutation({
		onSuccess: () => {
			toast.success('Вебхук удалён')
			refetch()
			setConfirmDelete(null)
		},
	})
	const { mutate: testWebhook } = trpc.webhooks.test.useMutation({
		onSuccess: (data, variables) => {
			setTestResult({ id: variables, success: data.success, error: data.error })
			if (data.success) {
				toast.success('Тест успешен')
			} else {
				toast.error(`Тест неудачен: ${data.error || 'unknown error'}`)
			}
		},
	})

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>Вебхуки</h1>
					<p className='text-sm text-muted-foreground'>Интеграции и события</p>
				</div>
				<Button
					size='sm'
					onClick={() => {
						setEditingWebhook(undefined)
						setModalOpen(true)
					}}
				>
					<Plus className='h-4 w-4 mr-1' />
					Новый вебхук
				</Button>
			</div>

			<Card className='border-border'>
				<CardContent className='p-0 overflow-x-auto'>
					<table className='w-full text-sm'>
						<thead>
							<tr className='border-b border-border bg-secondary/50'>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>События</th>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Endpoint</th>
								<th className='text-left p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Статус</th>
								<th className='text-right p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground'>Действия</th>
							</tr>
						</thead>
						<tbody>
							{(webhooks ?? []).map((wh) => (
								<tr key={wh.id} className='border-b border-border hover:bg-secondary/30'>
									<td className='p-3'>
										<div className='flex flex-wrap gap-1'>
											{(wh.events ?? []).map((evt: string) => (
												<Badge key={evt} className='bg-accent/15 text-accent font-mono text-[10px]'>
													{evt}
												</Badge>
											))}
										</div>
									</td>
									<td className='p-3 font-mono text-xs text-muted-foreground truncate max-w-[250px]'>
										{wh.url}
									</td>
									<td className='p-3'>
										{testResult?.id === wh.id ? (
											<Badge className={testResult.success ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}>
												{testResult.success ? 'Активен' : 'Ошибка'}
											</Badge>
										) : (
											<Badge className='bg-success/15 text-success'>Активен</Badge>
										)}
									</td>
									<td className='p-3 text-right'>
										<Button
											variant='ghost'
											size='icon'
											className='h-7 w-7'
											onClick={() => testWebhook(wh.id)}
											aria-label='Тестировать вебхук'
										>
											<Play className='h-3.5 w-3.5' />
										</Button>
										<Button
											variant='ghost'
											size='icon'
											className='h-7 w-7'
											onClick={() => { setEditingWebhook(wh); setModalOpen(true) }}
											aria-label='Редактировать вебхук'
										>
											<Pencil className='h-3.5 w-3.5' />
										</Button>
										<Button
											variant='ghost'
											size='icon'
											className='h-7 w-7 text-destructive'
											onClick={() => setConfirmDelete(wh.id)}
											aria-label='Удалить вебхук'
										>
											<Trash2 className='h-3.5 w-3.5' />
										</Button>
									</td>
								</tr>
							))}
								{(webhooks ?? []).length === 0 && !isLoading && (
									<tr>
										<td colSpan={4} className='text-center py-12 text-muted-foreground text-sm'>
											Нет вебхуков
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</CardContent>
				</Card>

				<WebhookFormModal
					open={modalOpen}
					onOpenChange={setModalOpen}
					onSuccess={() => refetch()}
					webhook={editingWebhook}
				/>

				<ConfirmDialog
					open={!!confirmDelete}
					onOpenChange={() => setConfirmDelete(null)}
					title='Подтвердите удаление'
					description='Вебхук будет безвозвратно удалён. Это действие нельзя отменить.'
					onConfirm={() => confirmDelete && deleteWebhook(confirmDelete)}
				/>
			</div>
		)
}

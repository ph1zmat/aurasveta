'use client'

import { useState } from 'react'
import { readBooleanParam } from '@aurasveta/shared-admin'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { Plus, Trash2, Send, Webhook, Globe } from 'lucide-react'
import { useAdminSearchParams } from '../hooks/useAdminSearchParams'
import WebhookFormModal from './WebhookFormModal'
import { EVENT_COLORS } from './webhook-config'

type WebhookItem = RouterOutputs['webhooks']['getAll'][number]

export default function WebhooksClient() {
	const { searchParams, updateSearchParams } = useAdminSearchParams()
	const { data: webhooks, refetch } = trpc.webhooks.getAll.useQuery()
	const deleteMut = trpc.webhooks.delete.useMutation({
		onSuccess: () => refetch(),
	})
	const testMut = trpc.webhooks.test.useMutation()

	const showForm = readBooleanParam(searchParams.get('create'), false) === true
	const [testResult, setTestResult] = useState<{
		id: string
		data: unknown
	} | null>(null)

	return (
		<div className='space-y-5'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
						<Webhook className='h-5 w-5 text-primary' />
					</div>
					<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
						Вебхуки
					</h1>
				</div>
				<button
					onClick={() =>
						updateSearchParams({ create: true }, { history: 'push' })
					}
					className='flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
				>
					<Plus className='h-4 w-4' /> Добавить
				</button>
			</div>

			{/* Cards */}
			{webhooks && webhooks.length > 0 ? (
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
					{webhooks.map((wh: WebhookItem) => (
						<div
							key={wh.id}
							className='group flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/20'
						>
							{/* URL */}
							<div className='flex items-start gap-3 p-4 pb-3'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
									<Globe className='h-4 w-4 text-primary' />
								</div>
								<p className='break-all text-sm font-medium leading-snug text-foreground'>
									{wh.url}
								</p>
							</div>

							{/* Events */}
							<div className='flex flex-wrap gap-1.5 px-4 pb-3'>
								{wh.events.map((ev: string) => {
									const ec = EVENT_COLORS[ev] ?? {
										color: 'text-muted-foreground',
										bg: 'bg-muted',
									}
									return (
										<span
											key={ev}
											className={`rounded-full ${ec.bg} px-2 py-0.5 text-[10px] font-medium ${ec.color}`}
										>
											{ev}
										</span>
									)
								})}
							</div>

							{/* Test result */}
							{testResult?.id === wh.id && (
								<div className='mx-4 mb-3 break-all rounded-lg bg-muted/30 p-2.5 font-mono text-[11px] text-muted-foreground'>
									{JSON.stringify(testResult.data)}
								</div>
							)}

							{/* Actions */}
							<div className='mt-auto flex border-t border-border'>
								<button
									onClick={async () => {
										const data = await testMut.mutateAsync(wh.id)
										setTestResult({ id: wh.id, data })
									}}
									disabled={testMut.isPending}
									className='flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5'
								>
									<Send className='h-3.5 w-3.5' />
									Тест
								</button>
								<div className='w-px bg-border' />
								<button
									onClick={() => {
										if (confirm('Удалить вебхук?')) deleteMut.mutate(wh.id)
									}}
									className='flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive'
								>
									<Trash2 className='h-3.5 w-3.5' />
									Удалить
								</button>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<Webhook className='mb-3 h-10 w-10 text-muted-foreground/20' />
					<p className='text-sm text-muted-foreground'>
						Нет зарегистрированных вебхуков
					</p>
				</div>
			)}

			{/* Modal */}
			{showForm && (
				<WebhookFormModal
					onClose={() =>
						updateSearchParams({ create: null }, { history: 'replace' })
					}
					onSuccess={() => {
						updateSearchParams({ create: null }, { history: 'replace' })
						refetch()
					}}
				/>
			)}
		</div>
	)
}

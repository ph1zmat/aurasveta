'use client'

import { useState } from 'react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import AdminModal from '@/shared/ui/AdminModal'
import {
	Plus,
	Trash2,
	Send,
	Webhook,
	Link2,
	Zap,
	CheckCircle2,
	Globe,
} from 'lucide-react'

const EVENTS = [
	'product.created',
	'product.updated',
	'order.created',
	'order.updated',
] as const

const EVENT_COLORS: Record<string, { color: string; bg: string }> = {
	'product.created': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
	'product.updated': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
	'order.created': { color: 'text-amber-500', bg: 'bg-amber-500/10' },
	'order.updated': { color: 'text-violet-500', bg: 'bg-violet-500/10' },
}

type WebhookItem = RouterOutputs['webhooks']['getAll'][number]

export default function WebhooksClient() {
	const { data: webhooks, refetch } = trpc.webhooks.getAll.useQuery()
	const deleteMut = trpc.webhooks.delete.useMutation({
		onSuccess: () => refetch(),
	})
	const testMut = trpc.webhooks.test.useMutation()

	const [showForm, setShowForm] = useState(false)
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
					onClick={() => setShowForm(true)}
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
					onClose={() => setShowForm(false)}
					onSuccess={() => {
						setShowForm(false)
						refetch()
					}}
				/>
			)}
		</div>
	)
}

/* ============ Webhook Form Modal ============ */

function WebhookFormModal({
	onClose,
	onSuccess,
}: {
	onClose: () => void
	onSuccess: () => void
}) {
	const createMut = trpc.webhooks.create.useMutation({ onSuccess })
	const [url, setUrl] = useState('')
	const [events, setEvents] = useState<string[]>([])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		createMut.mutate({ url, events })
	}
	const formId = 'webhook-form-modal'

	return (
		<AdminModal
			isOpen
			onClose={onClose}
			title='Новый вебхук'
			size='sm'
			footer={[
				<Button key='cancel' variant='ghost' type='button' onClick={onClose}>
					Отмена
				</Button>,
				<Button
					key='submit'
					type='submit'
					form={formId}
					disabled={events.length === 0 || createMut.isPending}
				>
					Создать
				</Button>,
			]}
		>
			<form id={formId} onSubmit={handleSubmit} className='space-y-5 px-6 py-5'>
					<div>
						<label className='mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
							<Link2 className='h-3 w-3' /> URL
						</label>
						<input
							value={url}
							onChange={e => setUrl(e.target.value)}
							type='url'
							required
							className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
							placeholder='https://example.com/webhook'
						/>
					</div>

					<div>
						<label className='mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
							<Zap className='h-3 w-3' /> События
						</label>
						<div className='space-y-2'>
							{EVENTS.map(ev => {
								const ec = EVENT_COLORS[ev] ?? {
									color: 'text-muted-foreground',
									bg: 'bg-muted',
								}
								const checked = events.includes(ev)
								return (
									<label
										key={ev}
										onClick={() => {
											setEvents(prev =>
												prev.includes(ev)
													? prev.filter(item => item !== ev)
													: [...prev, ev],
											)
										}}
										className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
											checked
												? `border-primary/30 ${ec.bg}`
												: 'border-border bg-muted/10 hover:bg-muted/20'
										}`}
									>
										<input
											type='checkbox'
											checked={checked}
											readOnly
											className='sr-only'
										/>
										<div
											className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
												checked
													? 'border-primary bg-primary'
													: 'border-muted-foreground/30'
											}`}
										>
											{checked && (
												<CheckCircle2 className='h-3 w-3 text-primary-foreground' />
											)}
										</div>
										<span
											className={`text-sm font-medium ${checked ? ec.color : 'text-muted-foreground'}`}
										>
											{ev}
										</span>
									</label>
								)
							})}
						</div>
					</div>
			</form>
		</AdminModal>
	)
}

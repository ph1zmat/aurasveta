'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { Plus, Trash2, TestTube2 } from 'lucide-react'

const EVENTS = [
	'product.created',
	'product.updated',
	'order.created',
	'order.updated',
]

export default function AdminWebhooksPage() {
	const { data: webhooks, refetch } = trpc.webhooks.getAll.useQuery()
	const createMut = trpc.webhooks.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
	const deleteMut = trpc.webhooks.delete.useMutation({ onSuccess: () => refetch() })
	const testMut = trpc.webhooks.test.useMutation()

	const [showForm, setShowForm] = useState(false)
	const [url, setUrl] = useState('')
	const [events, setEvents] = useState<string[]>([])

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		createMut.mutate({ url, events })
	}

	function toggleEvent(event: string) {
		setEvents(prev =>
			prev.includes(event)
				? prev.filter(e => e !== event)
				: [...prev, event],
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Вебхуки
				</h1>
				<Button variant='primary' size='sm' onClick={() => setShowForm(true)}>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
			</div>

			{showForm && (
				<div className='rounded-xl border border-border bg-muted/30 p-6'>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<input
							type='url'
							placeholder='URL (https://...)'
							required
							value={url}
							onChange={e => setUrl(e.target.value)}
							className='input-field w-full'
						/>
						<div className='space-y-2'>
							<p className='text-sm font-medium text-foreground'>События:</p>
							<div className='flex flex-wrap gap-2'>
								{EVENTS.map(event => (
									<label
										key={event}
										className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
											events.includes(event)
												? 'border-primary bg-primary/10 text-primary'
												: 'border-border text-muted-foreground'
										}`}
									>
										<input
											type='checkbox'
											className='sr-only'
											checked={events.includes(event)}
											onChange={() => toggleEvent(event)}
										/>
										{event}
									</label>
								))}
							</div>
						</div>
						<div className='flex gap-2'>
							<Button variant='primary' type='submit' size='sm' disabled={events.length === 0}>
								Создать
							</Button>
							<Button variant='outline' type='button' size='sm' onClick={() => setShowForm(false)}>
								Отмена
							</Button>
						</div>
					</form>
				</div>
			)}

			<div className='space-y-2'>
				{webhooks?.map(wh => (
					<div
						key={wh.id}
						className='flex items-center gap-4 rounded-xl border border-border/50 bg-muted/20 px-4 py-3'
					>
						<div className='flex-1'>
							<p className='text-sm font-medium text-foreground'>{wh.url}</p>
							<div className='mt-1 flex flex-wrap gap-1'>
								{wh.events.map(ev => (
									<span
										key={ev}
										className='rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'
									>
										{ev}
									</span>
								))}
							</div>
						</div>
						<button
							onClick={() => testMut.mutate(wh.id)}
							className='text-muted-foreground hover:text-foreground'
							title='Тестировать'
						>
							<TestTube2 className='h-4 w-4' />
						</button>
						<button
							onClick={() => {
								if (confirm('Удалить вебхук?')) deleteMut.mutate(wh.id)
							}}
							className='text-muted-foreground hover:text-destructive'
						>
							<Trash2 className='h-4 w-4' />
						</button>
					</div>
				))}
				{!webhooks?.length && <p className='text-sm text-muted-foreground'>Вебхуков пока нет</p>}
			</div>
		</div>
	)
}

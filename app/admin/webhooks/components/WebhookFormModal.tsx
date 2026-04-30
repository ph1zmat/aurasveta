'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const EVENT_OPTIONS = [
	'order.created',
	'order.paid',
	'order.shipped',
	'order.delivered',
	'order.cancelled',
	'product.stock_low',
]

type WebhookFormValue = {
	id: string
	url?: string | null
	events?: string[] | null
}

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
	webhook?: WebhookFormValue
}

export default function WebhookFormModal({ open, onOpenChange, onSuccess, webhook }: Props) {
	const isEdit = !!webhook
	const [url, setUrl] = useState('')
	const [events, setEvents] = useState<string[]>([])

	const reset = () => {
		setUrl('')
		setEvents([])
	}

	const { mutate: create } = trpc.webhooks.create.useMutation({
		onSuccess: () => {
			toast.success('Вебхук создан')
			onSuccess()
			onOpenChange(false)
			reset()
		},
	})
	const { mutate: update } = trpc.webhooks.update.useMutation({
		onSuccess: () => {
			toast.success('Вебхук обновлён')
			onSuccess()
			onOpenChange(false)
			reset()
		},
	})

	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (webhook) {
			setUrl(webhook.url ?? '')
			setEvents(webhook.events ?? [])
		} else {
			reset()
		}
	}, [webhook, open])
	/* eslint-enable react-hooks/set-state-in-effect */

	const toggleEvent = (evt: string) => {
		setEvents((prev) =>
			prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]
		)
	}

	const handleSave = () => {
		if (!url.trim() || events.length === 0) {
			toast.error('Заполните URL и выберите хотя бы одно событие')
			return
		}
		if (isEdit) {
			update({ id: webhook.id, url, events })
		} else {
			create({ url, events })
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Редактировать вебхук' : 'Новый вебхук'}</DialogTitle>
				</DialogHeader>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Endpoint URL *</label>
						<Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder='https://' />
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>События *</label>
						<div className='flex flex-wrap gap-2'>
							{EVENT_OPTIONS.map((evt) => (
								<Button
									key={evt}
									variant={events.includes(evt) ? 'default' : 'outline'}
									size='sm'
									onClick={() => toggleEvent(evt)}
									className='text-xs font-mono'
								>
									{evt}
								</Button>
							))}
						</div>
					</div>
					<div className='flex justify-end gap-2'>
						<Button variant='outline' onClick={() => onOpenChange(false)}>Отмена</Button>
						<Button onClick={handleSave}>{isEdit ? 'Сохранить' : 'Создать'}</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

'use client'

import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MessageModalProps {
	open: boolean
	orderId: string
	customerName?: string
	onClose: () => void
}

export function MessageModal({ open, orderId, customerName, onClose }: MessageModalProps) {
	const [subject, setSubject] = useState(`Ваш заказ #${orderId.slice(-6).toUpperCase()}`)
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSend = async () => {
		setLoading(true)
		// Заглушка — в будущем подключить к tRPC/email
		await new Promise((r) => setTimeout(r, 600))
		setLoading(false)
		onClose()
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>
						Сообщение клиенту{customerName ? ` — ${customerName}` : ''}
					</DialogTitle>
				</DialogHeader>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Тема</label>
						<Input value={subject} onChange={(e) => setSubject(e.target.value)} />
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Сообщение</label>
						<textarea
							className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-none'
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder='Введите текст сообщения...'
						/>
					</div>
					<div className='flex justify-end gap-2'>
						<Button variant='ghost' onClick={onClose}>
							Отмена
						</Button>
						<Button
							onClick={() => void handleSend()}
							disabled={loading || !message.trim()}
						>
							{loading ? 'Отправка...' : 'Отправить'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

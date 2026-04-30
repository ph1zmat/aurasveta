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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

const REFUND_REASONS = [
	{ value: 'defect', label: 'Брак / повреждение' },
	{ value: 'wrong', label: 'Не тот товар' },
	{ value: 'not_fit', label: 'Не подошло' },
	{ value: 'other', label: 'Другое' },
]

interface RefundModalProps {
	open: boolean
	orderId: string
	orderTotal: number
	onClose: () => void
}

export function RefundModal({ open, orderId, orderTotal, onClose }: RefundModalProps) {
	const [amount, setAmount] = useState(String(orderTotal))
	const [reason, setReason] = useState('')
	const [comment, setComment] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async () => {
		setLoading(true)
		// Заглушка — в будущем подключить к tRPC
		await new Promise((r) => setTimeout(r, 600))
		setLoading(false)
		onClose()
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>Возврат по заказу #{orderId.slice(-6).toUpperCase()}</DialogTitle>
				</DialogHeader>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Сумма возврата (₽)</label>
						<Input
							type='number'
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							min={0}
							max={orderTotal}
						/>
						<div className='text-xs text-muted-foreground'>
							Максимум: ₽{orderTotal.toLocaleString('ru-RU')}
						</div>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Причина</label>
						<Select value={reason} onValueChange={setReason}>
							<SelectTrigger>
								<SelectValue placeholder='Выберите причину' />
							</SelectTrigger>
							<SelectContent>
								{REFUND_REASONS.map((r) => (
									<SelectItem key={r.value} value={r.value}>
										{r.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Комментарий</label>
						<textarea
							className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px] resize-none'
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder='Дополнительные сведения...'
						/>
					</div>
					<div className='flex justify-end gap-2'>
						<Button variant='ghost' onClick={onClose}>
							Отмена
						</Button>
						<Button
							variant='destructive'
							onClick={() => void handleSubmit()}
							disabled={loading || !reason || !amount}
						>
							{loading ? 'Обработка...' : 'Оформить возврат'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

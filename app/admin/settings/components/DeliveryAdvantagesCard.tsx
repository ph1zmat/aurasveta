'use client'

import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Save, Loader2, Plus, Trash2, GripVertical } from 'lucide-react'

export type DeliveryAdvantage = {
	icon: string
	title: string
	description: string
}

const ICON_OPTIONS = [
	{ value: 'Truck', label: 'Доставка (грузовик)' },
	{ value: 'ShieldCheck', label: 'Гарантия (щит)' },
	{ value: 'RotateCcw', label: 'Возврат (стрелка)' },
	{ value: 'CreditCard', label: 'Оплата (карта)' },
	{ value: 'Star', label: 'Звезда' },
	{ value: 'Package', label: 'Посылка' },
	{ value: 'Clock', label: 'Время' },
	{ value: 'Phone', label: 'Телефон' },
	{ value: 'Gift', label: 'Подарок' },
	{ value: 'BadgeCheck', label: 'Бейдж ✓' },
]

const DEFAULT_ADVANTAGES: DeliveryAdvantage[] = [
	{ icon: 'Truck', title: 'Доставка по Москве от 3 000 руб. - бесплатно', description: 'Доставим товар прямо до двери в удобное для вас время.' },
	{ icon: 'ShieldCheck', title: 'Расширенная гарантия', description: '18 месяцев гарантия от поставщика + 12 месяцев от магазина' },
	{ icon: 'RotateCcw', title: 'Увеличенный срок возврата', description: 'Примем товар в течение 35 дней' },
	{ icon: 'CreditCard', title: 'Оплата с помощью бонусов СберСпасибо', description: 'Оплачивайте до 99% стоимости в обмен на бонусы СберСпасибо' },
]

function parseDbAdvantages(value: unknown): DeliveryAdvantage[] {
	if (!Array.isArray(value) || value.length === 0) return DEFAULT_ADVANTAGES
	const parsed = value.filter(
		(item): item is DeliveryAdvantage =>
			typeof item === 'object' &&
			item !== null &&
			typeof (item as DeliveryAdvantage).title === 'string',
	)
	return parsed.length > 0 ? parsed : DEFAULT_ADVANTAGES
}

export default function DeliveryAdvantagesCard() {
	const { data: setting, isLoading } = trpc.setting.get.useQuery('delivery.advantages', {
		staleTime: 5 * 60 * 1000,
	})
	const { mutate: upsert, isPending } = trpc.setting.upsert.useMutation({
		onSuccess: () => toast.success('Преимущества сохранены'),
		onError: (e) => toast.error(e.message),
	})

	const [items, setItems] = useState<DeliveryAdvantage[] | null>(null)

	const currentItems: DeliveryAdvantage[] = items ?? parseDbAdvantages(setting?.value)

	const update = useCallback(
		(idx: number, field: keyof DeliveryAdvantage, value: string) => {
			setItems(prev => {
				const list = prev ?? parseDbAdvantages(setting?.value)
				const next = [...list]
				next[idx] = { ...next[idx], [field]: value }
				return next
			})
		},
		[setting?.value],
	)

	const add = () =>
		setItems(prev => [
			...(prev ?? parseDbAdvantages(setting?.value)),
			{ icon: 'Truck', title: '', description: '' },
		])

	const remove = (idx: number) =>
		setItems(prev => {
			const list = prev ?? parseDbAdvantages(setting?.value)
			return list.filter((_, i) => i !== idx)
		})

	const moveUp = (idx: number) => {
		if (idx === 0) return
		setItems(prev => {
			const list = [...(prev ?? parseDbAdvantages(setting?.value))]
			;[list[idx - 1], list[idx]] = [list[idx], list[idx - 1]]
			return list
		})
	}

	const moveDown = (idx: number) => {
		setItems(prev => {
			const list = [...(prev ?? parseDbAdvantages(setting?.value))]
			if (idx >= list.length - 1) return list
			;[list[idx], list[idx + 1]] = [list[idx + 1], list[idx]]
			return list
		})
	}

	const save = () => {
		const invalid = currentItems.some(item => !item.title.trim())
		if (invalid) {
			toast.error('Заполните заголовок для всех пунктов')
			return
		}
		upsert({
			key: 'delivery.advantages',
			value: currentItems,
			type: 'json',
			isPublic: false,
			group: 'catalog',
			description: 'Преимущества доставки на карточке товара',
		})
		setItems(null)
	}

	if (isLoading) {
		return (
			<Card className='border-border'>
				<CardContent className='flex items-center gap-2 py-8 text-sm text-muted-foreground'>
					<Loader2 className='h-4 w-4 animate-spin' />
					Загрузка...
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className='border-border'>
			<CardHeader>
				<CardTitle className='text-base font-bold'>Преимущества на карточке товара</CardTitle>
			</CardHeader>
			<CardContent className='space-y-3'>
				{currentItems.map((item, idx) => (
					<div key={idx} className='rounded-lg border border-border p-3 space-y-2'>
						<div className='flex items-center gap-2'>
							<div className='flex flex-col gap-0.5'>
								<button
									type='button'
									onClick={() => moveUp(idx)}
									disabled={idx === 0}
									className='text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors'
									aria-label='Переместить вверх'
								>
									<GripVertical className='h-3 w-3 rotate-90' />
								</button>
								<button
									type='button'
									onClick={() => moveDown(idx)}
									disabled={idx === currentItems.length - 1}
									className='text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors'
									aria-label='Переместить вниз'
								>
									<GripVertical className='h-3 w-3 -rotate-90' />
								</button>
							</div>
							<Select
								value={item.icon}
								onValueChange={(v) => update(idx, 'icon', v)}
							>
								<SelectTrigger className='w-[180px] shrink-0'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ICON_OPTIONS.map(opt => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<button
								type='button'
								onClick={() => remove(idx)}
								className='ml-auto text-muted-foreground hover:text-destructive transition-colors'
								aria-label='Удалить'
							>
								<Trash2 className='h-4 w-4' />
							</button>
						</div>
						<Input
							placeholder='Заголовок'
							value={item.title}
							onChange={(e) => update(idx, 'title', e.target.value)}
						/>
						<Input
							placeholder='Описание'
							value={item.description}
							onChange={(e) => update(idx, 'description', e.target.value)}
						/>
					</div>
				))}
				<Button variant='ghost' size='sm' onClick={add} className='w-full border border-dashed border-border'>
					<Plus className='h-4 w-4 mr-1' />
					Добавить пункт
				</Button>
				<Button className='w-full' onClick={save} disabled={isPending}>
					{isPending ? <Loader2 className='h-4 w-4 mr-1 animate-spin' /> : <Save className='h-4 w-4 mr-1' />}
					Сохранить
				</Button>
			</CardContent>
		</Card>
	)
}

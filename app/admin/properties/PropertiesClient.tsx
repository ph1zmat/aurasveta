'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import PropertyFormModal from './components/PropertyFormModal'
import PropertyValueFormModal from './components/PropertyValueFormModal'
import ConfirmDialog from '../components/ConfirmDialog'

type PropertyRow = {
	id: string
	name: string
	slug: string
	hasPhoto: boolean
	values?: PropertyValueRow[]
}

type PropertyValueRow = {
	id: string
	value: string
	slug: string
	photo?: string | null
	order?: number
}

export default function PropertiesClient() {
	const [modalOpen, setModalOpen] = useState(false)
	const [editingProperty, setEditingProperty] = useState<PropertyRow | undefined>(
		undefined,
	)
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [confirmDeleteProperty, setConfirmDeleteProperty] = useState<string | null>(null)
	const [confirmDeleteValue, setConfirmDeleteValue] = useState<string | null>(null)

	// Стейт для модалки редактирования/создания значения
	const [valueModalOpen, setValueModalOpen] = useState(false)
	const [editingValue, setEditingValue] = useState<PropertyValueRow | undefined>(
		undefined,
	)
	const [valueModalPropertyId, setValueModalPropertyId] = useState<string>('')
	const [valueModalHasPhoto, setValueModalHasPhoto] = useState(false)

	const { data: properties, refetch } = trpc.properties.getAll.useQuery()
	const { mutate: deleteProperty } = trpc.properties.delete.useMutation({
		onSuccess: () => { toast.success('Свойство удалено'); refetch(); setConfirmDeleteProperty(null) },
	})
	const { mutate: deleteValue } = trpc.properties.deleteValue.useMutation({
		onSuccess: () => { toast.success('Значение удалено'); refetch(); setConfirmDeleteValue(null) },
	})
	const { mutate: reorderValues } = trpc.properties.reorderValues.useMutation({
		onSuccess: () => { refetch() },
	})

	const openNewValue = (prop: { id: string; hasPhoto: boolean }) => {
		setEditingValue(undefined)
		setValueModalPropertyId(prop.id)
		setValueModalHasPhoto(prop.hasPhoto)
		setValueModalOpen(true)
	}

	const openEditValue = (
		prop: { id: string; hasPhoto: boolean },
		val: PropertyValueRow,
	) => {
		setEditingValue(val)
		setValueModalPropertyId(prop.id)
		setValueModalHasPhoto(prop.hasPhoto)
		setValueModalOpen(true)
	}

	const moveValue = (_propertyId: string, values: { id: string; order?: number }[], index: number, direction: 'up' | 'down') => {
		const newIndex = direction === 'up' ? index - 1 : index + 1
		if (newIndex < 0 || newIndex >= values.length) return
		const reordered = [...values]
		const temp = reordered[index]
		reordered[index] = reordered[newIndex]
		reordered[newIndex] = temp
		reorderValues(reordered.map((v, i) => ({ id: v.id, order: i })))
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>Свойства</h1>
					<p className='text-sm text-muted-foreground'>Управление характеристиками товаров</p>
				</div>
				<Button
					size='sm'
					onClick={() => {
						setEditingProperty(undefined)
						setModalOpen(true)
					}}
				>
					<Plus className='h-4 w-4 mr-1' />
					Новое свойство
				</Button>
			</div>

			<div className='space-y-3'>
				{(properties ?? []).map((prop) => {
					const isOpen = expandedId === prop.id
					const values = [...(prop.values ?? [])].sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0))
					return (
						<Card key={prop.id} className='border-border'>
							<CardHeader className='flex flex-row items-center justify-between py-3'>
								<div className='flex items-center gap-3'>
									<CardTitle className='text-sm font-bold'>{prop.name}</CardTitle>
									<Badge variant='secondary' className='text-[10px]'>{prop.slug}</Badge>
									{prop.hasPhoto && <Badge className='bg-accent/15 text-accent text-[10px]'>Фото</Badge>}
								</div>
								<div className='flex gap-1'>
									<Button variant='ghost' size='sm' onClick={() => setExpandedId(isOpen ? null : prop.id)}>
										{isOpen ? 'Скрыть' : `Значения (${values.length})`}
									</Button>
									<Button
										variant='ghost'
										size='icon'
										className='h-7 w-7'
										onClick={() => { setEditingProperty(prop); setModalOpen(true) }}
										aria-label='Редактировать свойство'
									>
										<Pencil className='h-3.5 w-3.5' />
									</Button>
									<Button
										variant='ghost'
										size='icon'
										className='h-7 w-7 text-destructive'
										onClick={() => setConfirmDeleteProperty(prop.id)}
										aria-label='Удалить свойство'
									>
										<Trash2 className='h-3.5 w-3.5' />
									</Button>
								</div>
							</CardHeader>
							{isOpen && (
								<CardContent className='pt-0'>
									<div className='space-y-2'>
										{values.map((val: { id: string; value: string; slug: string; photo?: string | null }, index: number) => (
											<div key={val.id} className='flex items-center gap-2 py-2 px-3 rounded-md bg-secondary/30'>
												<span className='text-sm flex-1'>{val.value}</span>
												{val.photo && (
													<Badge className='bg-accent/15 text-accent text-[10px]'>Фото ✓</Badge>
												)}
												{prop.hasPhoto && !val.photo && (
													<Badge variant='outline' className='text-[10px] text-muted-foreground'>Нет фото</Badge>
												)}
												<Button
													variant='ghost'
													size='icon'
													className='h-6 w-6'
													disabled={index === 0}
													onClick={() => moveValue(prop.id, values, index, 'up')}
													aria-label='Переместить вверх'
												>
													<ArrowUp className='h-3 w-3' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													className='h-6 w-6'
													disabled={index === values.length - 1}
													onClick={() => moveValue(prop.id, values, index, 'down')}
													aria-label='Переместить вниз'
												>
													<ArrowDown className='h-3 w-3' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													className='h-6 w-6'
													onClick={() => openEditValue(prop, val)}
													aria-label='Редактировать значение'
												>
													<Pencil className='h-3 w-3' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													className='h-6 w-6 text-destructive'
													onClick={() => setConfirmDeleteValue(val.id)}
													aria-label='Удалить значение'
												>
													<Trash2 className='h-3 w-3' />
												</Button>
											</div>
										))}
										<div className='pt-2'>
											<Button
												size='sm'
												variant='outline'
												onClick={() => openNewValue(prop)}
											>
												<Plus className='h-3.5 w-3.5 mr-1' />
												Добавить значение
											</Button>
										</div>
									</div>
								</CardContent>
							)}
						</Card>
					)
				})}
				{(!properties || properties.length === 0) && (
					<div className='text-center py-12 text-muted-foreground text-sm border-2 border-dashed border-border rounded-(--radius-lg)'>
						Нет свойств
					</div>
				)}
			</div>

			<PropertyFormModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onSuccess={() => refetch()}
				property={editingProperty}
			/>

			<PropertyValueFormModal
				open={valueModalOpen}
				onOpenChange={setValueModalOpen}
				onSuccess={() => refetch()}
				propertyId={valueModalPropertyId}
				hasPhoto={valueModalHasPhoto}
				value={editingValue}
			/>

			<ConfirmDialog
				open={!!confirmDeleteProperty}
				onOpenChange={() => setConfirmDeleteProperty(null)}
				title='Подтвердите удаление'
				description='Свойство и все его значения будут безвозвратно удалены. Это действие нельзя отменить.'
				onConfirm={() => confirmDeleteProperty && deleteProperty(confirmDeleteProperty)}
			/>

			<ConfirmDialog
				open={!!confirmDeleteValue}
				onOpenChange={() => setConfirmDeleteValue(null)}
				title='Подтвердите удаление'
				description='Значение будет безвозвратно удалено. Это действие нельзя отменить.'
				onConfirm={() => confirmDeleteValue && deleteValue(confirmDeleteValue)}
			/>
		</div>
	)
}

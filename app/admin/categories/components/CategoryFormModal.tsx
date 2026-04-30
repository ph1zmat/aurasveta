'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { MediaPicker } from '@/packages/shared-admin/src/ui/admin/MediaPicker'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
	category?: any
}

export default function CategoryFormModal({ open, onOpenChange, onSuccess, category }: Props) {
	const isEdit = !!category
	const NONE_VALUE = '__none__'
	const [name, setName] = useState('')
	const [slug, setSlug] = useState('')
	const [description, setDescription] = useState('')
	const [parentId, setParentId] = useState('')
	const [categoryMode, setCategoryMode] = useState<'MANUAL' | 'FILTER'>('MANUAL')
	const [filterPropertyId, setFilterPropertyId] = useState('')
	const [filterPropertyValueId, setFilterPropertyValueId] = useState('')
	const [showInHeader, setShowInHeader] = useState(true)
	const [imagePath, setImagePath] = useState<string | null>(null)

	const { data: categories } = trpc.categories.getAll.useQuery()
	const { data: properties } = trpc.properties.getAll.useQuery()

	const selectedProperty = properties?.find((property) => property.id === filterPropertyId)
	const selectedPropertyValues = selectedProperty?.values ?? []
	const { mutate: create } = trpc.categories.create.useMutation({
		onSuccess: () => {
			toast.success('Категория создана')
			onSuccess()
			onOpenChange(false)
			reset()
		},
	})
	const { mutate: update } = trpc.categories.update.useMutation({
		onSuccess: () => {
			toast.success('Категория обновлена')
			onSuccess()
			onOpenChange(false)
		},
	})

	useEffect(() => {
		if (category) {
			setName(category.name ?? '')
			setSlug(category.slug ?? '')
			setDescription(category.description ?? '')
			setParentId(category.parentId ?? '')
			setCategoryMode(category.categoryMode === 'FILTER' ? 'FILTER' : 'MANUAL')
			setFilterPropertyId(category.filterPropertyId ?? '')
			setFilterPropertyValueId(category.filterPropertyValueId ?? '')
			setShowInHeader(category.showInHeader ?? true)
			setImagePath(category.imagePath ?? null)
		} else {
			reset()
		}
	}, [category, open])

	const reset = () => {
		setName('')
		setSlug('')
		setDescription('')
		setParentId('')
		setCategoryMode('MANUAL')
		setFilterPropertyId('')
		setFilterPropertyValueId('')
		setShowInHeader(true)
		setImagePath(null)
	}

	const handleSave = () => {
		if (categoryMode === 'FILTER' && (!filterPropertyId || !filterPropertyValueId)) {
			toast.error('Для фильтрующей категории выберите характеристику и значение.')
			return
		}

		const payload = {
			name,
			slug: slug || undefined,
			description: description || undefined,
			parentId: parentId || undefined,
			categoryMode,
			filterKind: categoryMode === 'FILTER' ? ('PROPERTY_VALUE' as const) : undefined,
			filterPropertyId: categoryMode === 'FILTER' ? filterPropertyId : undefined,
			filterPropertyValueId:
				categoryMode === 'FILTER' ? filterPropertyValueId : undefined,
			showInHeader,
			imagePath: imagePath ?? undefined,
		}
		if (isEdit) {
			update({ id: category.id, ...payload })
		} else {
			create(payload)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
				</DialogHeader>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Название *</label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Slug</label>
						<Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder='автоматически' />
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Описание</label>
						<textarea
							className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Родительская категория</label>
						<Select
							value={parentId || NONE_VALUE}
							onValueChange={(value) => setParentId(value === NONE_VALUE ? '' : value)}
						>
							<SelectTrigger>
								<SelectValue placeholder='Корневая' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NONE_VALUE}>Корневая категория</SelectItem>
								{categories?.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Тип категории</label>
						<Select
							value={categoryMode}
							onValueChange={(value: 'MANUAL' | 'FILTER') => setCategoryMode(value)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='MANUAL'>Обычная категория</SelectItem>
								<SelectItem value='FILTER'>Фильтрующая категория</SelectItem>
							</SelectContent>
						</Select>
						{categoryMode === 'FILTER' ? (
							<p className='text-xs text-muted-foreground'>
								Категория будет автоматически показывать товары по фильтру «характеристика: значение».
							</p>
						) : null}
					</div>
					{categoryMode === 'FILTER' ? (
						<>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Характеристика</label>
								<Select
									value={filterPropertyId || NONE_VALUE}
									onValueChange={(value) =>
										{
											setFilterPropertyId(value === NONE_VALUE ? '' : value)
											setFilterPropertyValueId('')
										}
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Выберите характеристику' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={NONE_VALUE}>Не выбрано</SelectItem>
										{properties?.map((property) => (
											<SelectItem key={property.id} value={property.id}>
												{property.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Значение характеристики</label>
								<Select
									value={filterPropertyValueId || NONE_VALUE}
									onValueChange={(value) =>
										setFilterPropertyValueId(value === NONE_VALUE ? '' : value)
									}
									disabled={!filterPropertyId}
								>
									<SelectTrigger>
										<SelectValue placeholder='Выберите значение' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={NONE_VALUE}>Не выбрано</SelectItem>
										{selectedPropertyValues.map((value) => (
											<SelectItem key={value.id} value={value.id}>
												{value.value}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</>
					) : null}
					<div className='flex items-center justify-between py-2'>
						<span className='text-sm font-medium'>Показывать в шапке</span>
						<Switch checked={showInHeader} onCheckedChange={setShowInHeader} />
					</div>
					<MediaPicker
						label='Изображение категории'
						value={imagePath}
						onChange={(val) => {
							setImagePath(val)
						}}
						aspectRatio='landscape'
					/>
					<div className='flex justify-end gap-2'>
						<Button variant='outline' onClick={() => onOpenChange(false)}>Отмена</Button>
						<Button onClick={handleSave}>{isEdit ? 'Сохранить' : 'Создать'}</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

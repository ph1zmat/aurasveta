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
import FileUploader from '@/shared/ui/FileUploader'
import { toast } from 'sonner'

interface PropertyValue {
	id: string
	value: string
	slug: string
	photo?: string | null
	order?: number
}

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
	propertyId: string
	hasPhoto: boolean
	/** Если передан — режим редактирования, иначе — создание */
	value?: PropertyValue | null
}

export default function PropertyValueFormModal({
	open,
	onOpenChange,
	onSuccess,
	propertyId,
	hasPhoto,
	value,
}: Props) {
	const isEdit = !!value

	const [name, setName] = useState('')
	const [slug, setSlug] = useState('')
	const [photo, setPhoto] = useState<string | null>(null)

	useEffect(() => {
		if (open) {
			if (value) {
				setName(value.value ?? '')
				setSlug(value.slug ?? '')
				setPhoto(value.photo ?? null)
			} else {
				setName('')
				setSlug('')
				setPhoto(null)
			}
		}
	}, [value, open])

	const { mutate: create, isPending: creating } = trpc.properties.createValue.useMutation({
		onSuccess: () => {
			toast.success('Значение добавлено')
			onSuccess()
			onOpenChange(false)
		},
	})

	const { mutate: update, isPending: updating } = trpc.properties.updateValue.useMutation({
		onSuccess: () => {
			toast.success('Значение обновлено')
			onSuccess()
			onOpenChange(false)
		},
	})

	const isPending = creating || updating

	const handleSave = () => {
		const trimmedName = name.trim()
		if (!trimmedName) {
			toast.error('Введите название значения')
			return
		}
		const resolvedSlug =
			slug.trim() ||
			trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

		if (isEdit) {
			update({
				id: value!.id,
				value: trimmedName,
				slug: resolvedSlug,
				photo: photo,
			})
		} else {
			create({
				propertyId,
				value: trimmedName,
				slug: resolvedSlug,
				photo: photo,
			})
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? 'Редактировать значение' : 'Новое значение'}
					</DialogTitle>
				</DialogHeader>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Название *</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='Например: Белый'
							onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
						/>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Slug</label>
						<Input
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder='автоматически из названия'
							className='font-mono text-sm'
						/>
					</div>
					{hasPhoto && (
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Фото</label>
							<FileUploader
								currentImage={photo}
								onUploaded={(key) => setPhoto(key)}
								onRemove={() => setPhoto(null)}
								aspectRatio='square'
								compact
								hideLabel
								helperText='PNG, JPG, WebP. Фото для данного значения.'
							/>
						</div>
					)}
					<div className='flex justify-end gap-2 pt-2'>
						<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
							Отмена
						</Button>
						<Button onClick={handleSave} disabled={isPending}>
							{isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

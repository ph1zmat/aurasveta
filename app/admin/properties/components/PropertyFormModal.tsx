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
import { toast } from 'sonner'

type PropertyFormValue = {
	id: string
	name?: string | null
	slug?: string | null
	hasPhoto?: boolean | null
}

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
	property?: PropertyFormValue
}

export default function PropertyFormModal({ open, onOpenChange, onSuccess, property }: Props) {
	const isEdit = !!property
	const [name, setName] = useState('')
	const [slug, setSlug] = useState('')
	const [hasPhoto, setHasPhoto] = useState(false)

	const reset = () => {
		setName('')
		setSlug('')
		setHasPhoto(false)
	}

	const { mutate: create } = trpc.properties.create.useMutation({
		onSuccess: () => {
			toast.success('Свойство создано')
			onSuccess()
			onOpenChange(false)
			reset()
		},
	})
	const { mutate: update } = trpc.properties.update.useMutation({
		onSuccess: () => {
			toast.success('Свойство обновлено')
			onSuccess()
			onOpenChange(false)
			reset()
		},
	})

	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (property) {
			setName(property.name ?? '')
			setSlug(property.slug ?? '')
			setHasPhoto(property.hasPhoto ?? false)
		} else {
			reset()
		}
	}, [property, open])
	/* eslint-enable react-hooks/set-state-in-effect */

	const handleSave = () => {
		const generatedSlug = slug.trim() || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
		const payload = { name, slug: generatedSlug, hasPhoto }
		if (isEdit) {
			update({ id: property.id, ...payload })
		} else {
			create(payload)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Редактировать свойство' : 'Новое свойство'}</DialogTitle>
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
					<div className='flex items-center justify-between py-2'>
						<span className='text-sm font-medium'>Значения с фото</span>
						<Switch checked={hasPhoto} onCheckedChange={setHasPhoto} />
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

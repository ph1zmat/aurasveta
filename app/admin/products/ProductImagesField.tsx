'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import type { ProductImage } from '@/shared/types/product'

export type EditableProductImage = Omit<
	Pick<
		ProductImage,
		| 'id'
		| 'url'
		| 'key'
		| 'originalName'
		| 'size'
		| 'mimeType'
		| 'order'
		| 'isMain'
	>,
	'id'
> & {
	id?: string
}

interface ProductImagesFieldProps {
	images: EditableProductImage[]
	onChange: (images: EditableProductImage[]) => void
	disabled?: boolean
}

function normalizeImages(
	images: EditableProductImage[],
): EditableProductImage[] {
	const normalized = images.map((image, index) => ({
		...image,
		order: index,
		isMain: false,
	}))

	if (normalized.length === 0) return normalized

	const mainIndex = images.findIndex(image => image.isMain)
	const safeMainIndex = mainIndex >= 0 ? mainIndex : 0
	return normalized.map((image, index) => ({
		...image,
		isMain: index === safeMainIndex,
	}))
}

function toEditableProductImage(
	file: Record<string, unknown>,
	order: number,
	isMain: boolean,
): EditableProductImage {
	return {
		id: undefined,
		url: String(file.url ?? file.path ?? ''),
		key: String(file.key ?? file.path ?? ''),
		originalName:
			typeof file.originalName === 'string' ? file.originalName : undefined,
		size: typeof file.size === 'number' ? file.size : null,
		mimeType: typeof file.mimeType === 'string' ? file.mimeType : null,
		order,
		isMain,
	}
}

function isInternalKey(key: string) {
	return key.startsWith('products/') || key.startsWith('uploads/')
}

async function cleanupPendingImage(image: EditableProductImage) {
	if (image.id || !isInternalKey(image.key)) return

	try {
		await fetch('/api/upload/delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ key: image.key }),
		})
	} catch {
		// Best effort cleanup.
	}
}

export default function ProductImagesField({
	images,
	onChange,
	disabled,
}: ProductImagesFieldProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const busy = disabled || uploading

	const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? [])
		if (files.length === 0) return

		setError(null)
		setUploading(true)

		try {
			const formData = new FormData()
			for (const file of files) {
				formData.append('files', file)
			}

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			})

			const payload = await response.json().catch(() => null)
			if (!response.ok) {
				throw new Error(payload?.error ?? 'Не удалось загрузить изображения')
			}

			const uploadedFiles = Array.isArray(payload?.files)
				? payload.files
				: [payload]

			const nextImages = [...images]
			for (const uploadedFile of uploadedFiles) {
				const order = nextImages.length
				nextImages.push(
					toEditableProductImage(
						uploadedFile as Record<string, unknown>,
						order,
						order === 0,
					),
				)
			}

			onChange(normalizeImages(nextImages))
		} catch (uploadError) {
			setError(
				uploadError instanceof Error
					? uploadError.message
					: 'Не удалось загрузить изображения',
			)
		} finally {
			setUploading(false)
			if (inputRef.current) inputRef.current.value = ''
		}
	}

	const removeImage = async (index: number) => {
		const removedImage = images[index]
		if (!removedImage) return

		await cleanupPendingImage(removedImage)
		onChange(
			normalizeImages(images.filter((_, imageIndex) => imageIndex !== index)),
		)
	}

	const moveImage = (index: number, direction: -1 | 1) => {
		const targetIndex = index + direction
		if (targetIndex < 0 || targetIndex >= images.length) return

		const nextImages = [...images]
		const [movedImage] = nextImages.splice(index, 1)
		nextImages.splice(targetIndex, 0, movedImage)
		onChange(normalizeImages(nextImages))
	}

	const setMainImage = (index: number) => {
		onChange(
			normalizeImages(
				images.map((image, imageIndex) => ({
					...image,
					isMain: imageIndex === index,
				})),
			),
		)
	}

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between gap-3'>
				<div>
					<p className='text-sm font-medium text-foreground'>
						Изображения товара
					</p>
					<p className='text-xs text-muted-foreground'>
						Загрузите несколько изображений, выберите главное и поменяйте
						порядок стрелками.
					</p>
				</div>
				<Button
					type='button'
					variant='outline'
					size='sm'
					disabled={busy}
					onClick={() => inputRef.current?.click()}
				>
					<ImagePlus className='mr-1 h-4 w-4' />
					{uploading ? 'Загрузка...' : 'Добавить фото'}
				</Button>
			</div>

			<input
				ref={inputRef}
				type='file'
				accept='image/png,image/jpeg,image/jpg,image/webp,image/gif'
				multiple
				className='hidden'
				onChange={handleUpload}
				disabled={busy}
			/>

			{error ? <p className='text-sm text-destructive'>{error}</p> : null}

			{images.length === 0 ? (
				<div className='rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground'>
					Изображения пока не добавлены.
				</div>
			) : (
				<div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
					{images.map((image, index) => (
						<div
							key={image.id ?? `${image.key}-${index}`}
							className={`overflow-hidden rounded-xl border bg-muted/20 ${
								image.isMain
									? 'border-primary ring-1 ring-primary/40'
									: 'border-border'
							}`}
						>
							<div className='relative aspect-square bg-muted/30'>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={image.url}
									alt={image.originalName ?? `Изображение ${index + 1}`}
									className='h-full w-full object-cover'
								/>
								<div className='absolute left-2 top-2'>
									<span
										className={`rounded-full px-2 py-1 text-[10px] font-medium ${
											image.isMain
												? 'bg-primary text-primary-foreground'
												: 'bg-black/50 text-white'
										}`}
									>
										{image.isMain ? 'Главное' : `#${index + 1}`}
									</span>
								</div>
							</div>
							<div className='space-y-2 p-2'>
								<p className='truncate text-xs text-muted-foreground'>
									{image.originalName ?? image.key}
								</p>
								<div className='grid grid-cols-2 gap-2'>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										disabled={busy || index === 0}
										onClick={() => moveImage(index, -1)}
									>
										<ArrowLeft className='h-4 w-4' />
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										disabled={busy || index === images.length - 1}
										onClick={() => moveImage(index, 1)}
									>
										<ArrowRight className='h-4 w-4' />
									</Button>
									<Button
										type='button'
										variant={image.isMain ? 'primary' : 'outline'}
										size='sm'
										disabled={busy || image.isMain}
										onClick={() => setMainImage(index)}
									>
										<Star className='mr-1 h-4 w-4' /> Главное
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										disabled={busy}
										onClick={() => void removeImage(index)}
										className='text-destructive hover:text-destructive'
									>
										<Trash2 className='mr-1 h-4 w-4' /> Удалить
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

'use client'

import { useEffect, useRef, useState } from 'react'
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
	canUpload?: boolean
	showHeader?: boolean
	emptyTitle?: string
	emptyDescription?: string
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
	canUpload = true,
	showHeader = true,
	emptyTitle,
	emptyDescription,
}: ProductImagesFieldProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [activeIndex, setActiveIndex] = useState(0)

	const busy = disabled || uploading
	const uploadLocked = !canUpload
	const previewImage = images[activeIndex] ?? images[0] ?? null
	const previewIndex = previewImage
		? Math.max(
				0,
				images.findIndex(image => image === previewImage),
			)
		: 0

	useEffect(() => {
		if (images.length === 0) {
			setActiveIndex(0)
			return
		}

		setActiveIndex(currentIndex => {
			if (currentIndex >= 0 && currentIndex < images.length) {
				return currentIndex
			}

			const mainIndex = images.findIndex(image => image.isMain)
			return mainIndex >= 0 ? mainIndex : 0
		})
	}, [images])

	const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (uploadLocked) return

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
		if (activeIndex === index && index > 0) {
			setActiveIndex(index - 1)
		}
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

	const resolvedEmptyTitle =
		emptyTitle ?? (uploadLocked ? 'Сохраните товар, чтобы загрузить фото' : 'Загрузите фото товара')
	const resolvedEmptyDescription =
		emptyDescription ??
		(uploadLocked
			? 'Сначала сохраните карточку, после этого можно будет добавить фотографии и выбрать главное изображение.'
			: 'Нажмите на область или кнопку ниже, чтобы добавить фотографии товара.')

	return (
		<div className='space-y-3'>
			{showHeader ? (
				<div className='flex items-center justify-between gap-3'>
					<div>
						<p className='text-sm font-medium text-foreground'>
							Изображения товара
						</p>
						<p className='text-xs text-muted-foreground'>
							Большое окно показывает текущий кадр, а ниже можно быстро
							переключаться между остальными фото.
						</p>
					</div>
					{images.length > 0 ? (
						<span className='rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground'>
							{images.length} фото
						</span>
					) : null}
				</div>
			) : null}

			<input
				ref={inputRef}
				type='file'
				accept='image/png,image/jpeg,image/jpg,image/webp,image/gif'
				multiple
				className='hidden'
				onChange={handleUpload}
				disabled={busy || uploadLocked}
			/>

			{error ? <p className='text-sm text-destructive'>{error}</p> : null}

			<div className='space-y-3'>
				<button
					type='button'
					onClick={() => {
						if (previewImage || uploadLocked) return
						inputRef.current?.click()
					}}
					disabled={busy || uploadLocked}
					className={`group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted/20 transition-colors ${
						previewImage
							? 'aspect-4/3 border-border bg-muted/30'
							: uploadLocked
								? 'aspect-square border-dashed border-border bg-muted/10'
								: 'aspect-square border-dashed border-border hover:bg-muted/30'
					}`}
				>
					{previewImage ? (
						<>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={previewImage.url}
								alt={previewImage.originalName ?? `Изображение ${previewIndex + 1}`}
								className='h-full w-full object-cover'
							/>
							<div className='absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3'>
								<div className='flex flex-wrap items-center gap-2'>
									<span
										className={`rounded-full px-2.5 py-1 text-[10px] font-medium shadow-sm ${
											previewImage.isMain
												? 'bg-primary text-primary-foreground'
												: 'bg-black/55 text-white'
										}`}
									>
										{previewImage.isMain ? 'Главное фото' : `Фото #${previewIndex + 1}`}
									</span>
									<p className='max-w-2xs truncate rounded-full bg-black/45 px-2.5 py-1 text-[10px] text-white'>
										{previewImage.originalName ?? previewImage.key}
									</p>
								</div>
								<div className='flex items-center gap-1.5 rounded-xl bg-black/35 p-1.5 backdrop-blur-sm'>
									<Button
										type='button'
										variant='icon'
										size='icon-sm'
										disabled={busy || previewIndex === 0}
										onClick={event => {
											event.stopPropagation()
											moveImage(previewIndex, -1)
										}}
										className='rounded-md bg-white/12 text-white hover:bg-white/20 hover:text-white'
										aria-label='Переместить фото влево'
									>
										<ArrowLeft className='h-4 w-4' />
									</Button>
									<Button
										type='button'
										variant='icon'
										size='icon-sm'
										disabled={busy || previewIndex === images.length - 1}
										onClick={event => {
											event.stopPropagation()
											moveImage(previewIndex, 1)
										}}
										className='rounded-md bg-white/12 text-white hover:bg-white/20 hover:text-white'
										aria-label='Переместить фото вправо'
									>
										<ArrowRight className='h-4 w-4' />
									</Button>
									<Button
										type='button'
										variant='icon'
										size='icon-sm'
										disabled={busy || previewImage.isMain}
										onClick={event => {
											event.stopPropagation()
											setMainImage(previewIndex)
										}}
										className='rounded-md bg-white/12 text-white hover:bg-white/20 hover:text-white'
										aria-label='Сделать главным фото'
									>
										<Star className='h-4 w-4' />
									</Button>
									<Button
										type='button'
										variant='icon'
										size='icon-sm'
										disabled={busy}
										onClick={event => {
											event.stopPropagation()
											void removeImage(previewIndex)
										}}
										className='rounded-md bg-white/12 text-white hover:bg-red-500/80 hover:text-white'
										aria-label='Удалить фото'
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</div>
							</div>
						</>
					) : (
						<div className='flex max-w-[15rem] flex-col items-center gap-4 px-6 text-center text-muted-foreground'>
							<div
								className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${
									uploadLocked
										? 'border-border bg-background text-foreground'
										: 'border-dashed border-border bg-background/60'
								}`}
							>
								<ImagePlus className='h-6 w-6' />
							</div>
							<div className='space-y-1'>
								<p className='text-sm font-medium text-foreground'>
									{resolvedEmptyTitle}
								</p>
								{resolvedEmptyDescription ? (
									<p className='text-xs leading-5 text-muted-foreground'>
										{resolvedEmptyDescription}
									</p>
								) : null}
							</div>
						</div>
					)}
				</button>

				{uploadLocked && !previewImage ? null : (
					<div className='flex flex-wrap gap-2'>
					{images.map((image, index) => (
						<button
							key={image.id ?? `${image.key}-${index}`}
							type='button'
							onClick={() => setActiveIndex(index)}
							className={`group relative h-18 w-18 overflow-hidden rounded-xl border transition-all sm:h-20 sm:w-20 ${
								index === previewIndex
									? 'border-primary ring-2 ring-primary/25'
									: 'border-border bg-muted/20 hover:border-primary/40'
							}`}
							aria-label={`Показать фото ${index + 1}`}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={image.url}
								alt={image.originalName ?? `Миниатюра ${index + 1}`}
								className='h-full w-full object-cover'
							/>
							<div className='absolute inset-x-1 bottom-1 flex items-center justify-between gap-1'>
								<span className='rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] text-white'>
									{index + 1}
								</span>
								{image.isMain ? (
									<span className='rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground'>
										<Star className='h-2.5 w-2.5' />
									</span>
								) : null}
							</div>
						</button>
					))}

					<button
						type='button'
						onClick={() => inputRef.current?.click()}
						disabled={busy || uploadLocked}
						className='flex h-18 w-18 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 text-muted-foreground transition-colors hover:bg-muted/25 hover:text-foreground disabled:opacity-50 sm:h-20 sm:w-20'
						aria-label='Добавить изображения'
					>
						<ImagePlus className='h-4 w-4 sm:h-5 sm:w-5' />
						<span className='mt-1 text-[10px] font-medium'>
							{uploading ? '...' : 'Добавить'}
						</span>
					</button>
					</div>
				)}
			</div>
		</div>
	)
}

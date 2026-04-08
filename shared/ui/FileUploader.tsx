'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/shared/ui/Button'
import { ImagePlus, Trash2, AlertCircle, Loader2 } from 'lucide-react'

interface FileUploaderProps {
	currentImage?: string | null
	onUploaded: (path: string, originalName: string) => void
	onRemove?: () => void
	isLoading?: boolean
	label?: string
}

export default function FileUploader({
	currentImage,
	onUploaded,
	onRemove,
	isLoading,
	label = 'Изображение',
}: FileUploaderProps) {
	const [preview, setPreview] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const displayImage = preview ?? currentImage ?? null
	const busy = isLoading || uploading

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			setError(null)
			const file = e.target.files?.[0]
			if (!file) return

			if (!file.type.startsWith('image/')) {
				setError('Файл не является изображением')
				return
			}

			if (file.size > 10 * 1024 * 1024) {
				setError('Файл слишком большой (макс. 10 МБ)')
				return
			}

			setUploading(true)
			try {
				const formData = new FormData()
				formData.append('file', file)

				const res = await fetch('/api/upload', {
					method: 'POST',
					body: formData,
				})

				if (!res.ok) {
					const data = await res.json()
					setError(data.error || 'Ошибка загрузки')
					return
				}

				const { path, originalName } = await res.json()
				setPreview(path)
				onUploaded(path, originalName)
			} catch {
				setError('Ошибка при загрузке файла')
			} finally {
				setUploading(false)
			}

			if (inputRef.current) inputRef.current.value = ''
		},
		[onUploaded],
	)

	const handleRemove = useCallback(() => {
		setPreview(null)
		setError(null)
		onRemove?.()
	}, [onRemove])

	return (
		<div className='space-y-2'>
			<label className='text-sm font-medium text-foreground'>{label}</label>

			{displayImage && (
				<div className='relative w-full max-w-[200px] overflow-hidden rounded-lg border border-border'>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={displayImage}
						alt='Превью'
						className='h-auto w-full object-contain'
					/>
				</div>
			)}

			{error && (
				<div className='flex items-center gap-1.5 text-sm text-destructive'>
					<AlertCircle className='h-4 w-4 shrink-0' />
					{error}
				</div>
			)}

			<div className='flex items-center gap-2'>
				<Button
					type='button'
					variant='outline'
					size='sm'
					disabled={busy}
					onClick={() => inputRef.current?.click()}
				>
					{uploading ? (
						<Loader2 className='mr-1 h-4 w-4 animate-spin' />
					) : (
						<ImagePlus className='mr-1 h-4 w-4' />
					)}
					{uploading ? 'Загрузка...' : displayImage ? 'Заменить' : 'Загрузить'}
				</Button>

				{displayImage && onRemove && (
					<Button
						type='button'
						variant='ghost'
						size='sm'
						disabled={busy}
						onClick={handleRemove}
					>
						<Trash2 className='mr-1 h-4 w-4' /> Удалить
					</Button>
				)}
			</div>

			<input
				ref={inputRef}
				type='file'
				accept='image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
				className='hidden'
				onChange={handleFileChange}
			/>

			<p className='text-xs text-muted-foreground'>
				PNG, JPG, WebP, GIF, SVG. Макс. 10 МБ.
			</p>
		</div>
	)
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/shared/ui/Button'
import { ImagePlus, Trash2, AlertCircle, Loader2 } from 'lucide-react'

// MIME-типы совпадают с серверным ALLOWED_TYPES (SVG исключён — XSS-риск)
const ALLOWED_CLIENT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']

/** Проверяет, является ли строка S3-ключом (не URL и не legacy-путём) */
function isS3Key(value: string): boolean {
	return !value.startsWith('/') && !value.startsWith('http')
}

/** Получает presigned URL для S3-ключа через /api/storage/signed-url */
async function resolveS3Key(key: string): Promise<string | null> {
	try {
		const res = await fetch(
			`/api/storage/signed-url?key=${encodeURIComponent(key)}`,
		)
		if (!res.ok) return null
		const data = await res.json()
		return (data.url as string) ?? null
	} catch {
		return null
	}
}

interface FileUploaderProps {
	currentImage?: string | null
	onUploaded: (key: string, originalName: string, url?: string) => void
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
	const [resolvedCurrent, setResolvedCurrent] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	// Автоматически резолвим S3-ключи в presigned URL для отображения
	useEffect(() => {
		if (!currentImage) {
			setResolvedCurrent(null)
			return
		}
		if (!isS3Key(currentImage)) {
			setResolvedCurrent(currentImage)
			return
		}
		// S3-ключ — получаем подписанный URL
		let cancelled = false
		resolveS3Key(currentImage).then(url => {
			if (!cancelled) setResolvedCurrent(url)
		})
		return () => {
			cancelled = true
		}
	}, [currentImage])

	// preview имеет приоритет (свежая загрузка), затем resolved existing
	const displayImage = preview ?? resolvedCurrent ?? null
	const busy = isLoading || uploading
	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			setError(null)
			const file = e.target.files?.[0]
			if (!file) return

			if (!ALLOWED_CLIENT_TYPES.includes(file.type)) {
				setError('Недопустимый тип файла. Разрешены: PNG, JPG, WebP, GIF')
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

				// key — S3-ключ для хранения в БД (не протухает)
				// url — presigned URL для предпросмотра
				const { key, url, originalName } = await res.json()
				setPreview(url)
				onUploaded(key, originalName, url)
			} catch {
				setError('Ошибка при загрузке файла')
			} finally {
				setUploading(false)
			}

			if (inputRef.current) inputRef.current.value = ''
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
				accept='image/png,image/jpeg,image/webp,image/gif'
				className='hidden'
				onChange={handleFileChange}
			/>

			<p className='text-xs text-muted-foreground'>
				PNG, JPG, WebP, GIF. Макс. 10 МБ.
			</p>
		</div>
	)
}

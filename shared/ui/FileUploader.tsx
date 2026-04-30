'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ImagePlus, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

// MIME-типы совпадают с серверным ALLOWED_TYPES (SVG исключён — XSS-риск)
const ALLOWED_CLIENT_TYPES = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
	'image/gif',
]

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
	aspectRatio?: 'square' | 'landscape' | 'portrait'
	compact?: boolean
	hideLabel?: boolean
	helperText?: string
	className?: string
}

export default function FileUploader({
	currentImage,
	onUploaded,
	onRemove,
	isLoading,
	label = 'Изображение',
	aspectRatio = 'square',
	compact = false,
	hideLabel = true,
	helperText = 'PNG, JPG, WebP, GIF. Макс. 10 МБ.',
	className,
}: FileUploaderProps) {
	const [preview, setPreview] = useState<string | null>(null)
	const [resolvedCurrent, setResolvedCurrent] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [uploading, setUploading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const aspectClassName =
		aspectRatio === 'landscape'
			? 'aspect-4/3'
			: aspectRatio === 'portrait'
				? 'aspect-3/4'
				: 'aspect-square'

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
	const previewLabel = displayImage
		? 'Изображение загружено'
		: 'Изображение не выбрано'
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
		[onUploaded],
	)

	const handleRemove = useCallback(() => {
		setPreview(null)
		setError(null)
		onRemove?.()
	}, [onRemove])

	return (
		<div className={cn('space-y-3', className)}>
			{!hideLabel && (
				<div className='space-y-1'>
					<label className='block text-sm font-medium text-foreground'>
						{label}
					</label>
				</div>
			)}

			<div className={cn('space-y-3', compact && 'space-y-2')}>
				<button
					type='button'
					onClick={() => {
						if (displayImage) return
						inputRef.current?.click()
					}}
					disabled={busy}
					className={cn(
						'group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted/20 transition-colors',
						aspectClassName,
						displayImage
							? 'border-border bg-muted/30'
							: 'border-dashed border-border hover:bg-muted/30',
						compact && 'rounded-xl max-w-lg flex',
					)}
				>
					{displayImage ? (
						<>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={displayImage}
								alt={label}
								className='h-full w-full object-cover'
							/>
							<div className='absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3'>
								<span className='rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm'>
									{previewLabel}
								</span>
								{busy ? (
									<span className='inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm'>
										<Loader2 className='h-3 w-3 animate-spin' />
										Загрузка...
									</span>
								) : null}
							</div>
						</>
					) : (
						<div className='flex max-w-sm flex-col items-center gap-3 px-6 text-center text-muted-foreground'>
							<div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-border bg-background/60 cursor-pointer'>
								{uploading ? (
									<Loader2 className='h-6 w-6 animate-spin' />
								) : (
									<ImagePlus className='h-6 w-6' />
								)}
							</div>
						</div>
					)}
				</button>

				{error && (
					<div className='flex items-center gap-1.5 text-sm text-destructive'>
						<AlertCircle className='h-4 w-4 shrink-0' />
						{error}
					</div>
				)}

				<div className='flex flex-wrap gap-2'>
					<button
						type='button'
						onClick={() => inputRef.current?.click()}
						disabled={busy}
						className='flex h-18 w-18 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 text-muted-foreground transition-colors hover:bg-muted/25 hover:text-foreground disabled:opacity-50 sm:h-20 sm:w-20'
						aria-label={
							displayImage ? 'Заменить изображение' : 'Загрузить изображение'
						}
					>
						{uploading ? (
							<Loader2 className='h-4 w-4 animate-spin sm:h-5 sm:w-5' />
						) : (
							<ImagePlus className='h-4 w-4 sm:h-5 sm:w-5' />
						)}
						<span className='mt-1 text-[10px] font-medium'>
							{uploading ? '...' : displayImage ? 'Заменить' : 'Добавить'}
						</span>
					</button>

					{displayImage && onRemove && (
						<button
							type='button'
							onClick={handleRemove}
							disabled={busy}
							className='flex h-18 w-18 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive disabled:opacity-50 sm:h-20 sm:w-20'
							aria-label='Удалить изображение'
						>
							<Trash2 className='h-4 w-4 sm:h-5 sm:w-5' />
							<span className='mt-1 text-[10px] font-medium'>Удалить</span>
						</button>
					)}
				</div>

				{helperText ? (
					<p className='text-xs text-muted-foreground'>{helperText}</p>
				) : null}
			</div>

			<input
				ref={inputRef}
				type='file'
				accept='image/png,image/jpeg,image/webp,image/gif'
				className='hidden'
				onChange={handleFileChange}
			/>
		</div>
	)
}

'use client'

import { useState, useRef, useCallback } from 'react'
import { ImagePlus, Trash2, ArrowUp, ArrowDown, Star, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALLOWED_CLIENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]

export interface ProductImageDraft {
  id?: string
  url: string
  key: string
  originalName?: string | null
  size?: number | null
  mimeType?: string | null
  order: number
  isMain: boolean
}

interface MultiImageUploaderProps {
  images: ProductImageDraft[]
  onChange: (images: ProductImageDraft[]) => void
  disabled?: boolean
}

function getImageUrl(img: ProductImageDraft): string {
  if (img.url) return img.url
  if (img.key) return `/api/storage/file?key=${encodeURIComponent(img.key)}`
  return ''
}

export default function MultiImageUploader({ images, onChange, disabled }: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const sortedImages = [...images].sort((a, b) => a.order - b.order)

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setError(null)

      const validFiles: File[] = []
      for (const file of Array.from(files)) {
        if (!ALLOWED_CLIENT_TYPES.includes(file.type)) {
          setError(`Недопустимый тип файла: ${file.name}`)
          continue
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(`Файл слишком большой: ${file.name}`)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length === 0) return

      setUploading(true)
      try {
        const formData = new FormData()
        for (const file of validFiles) {
          formData.append('files', file)
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Ошибка загрузки')
          return
        }

        const json = await res.json()
        const uploadedFiles: Array<{
          key: string
          url: string
          originalName: string
          size: number
          mimeType: string
        }> = json.files ?? (json.key ? [json] : [])

        const newImages: ProductImageDraft[] = uploadedFiles.map((file, i) => ({
          url: file.url,
          key: file.key,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          order: images.length + i,
          isMain: images.length === 0 && i === 0,
        }))

        onChange([...images, ...newImages])
      } catch {
        setError('Ошибка при загрузке файлов')
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [images, onChange]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      uploadFiles(e.target.files)
    },
    [uploadFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      uploadFiles(e.dataTransfer.files)
    },
    [uploadFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sortedImages.length) return
    const reordered = [...sortedImages]
    const temp = reordered[index]
    reordered[index] = reordered[newIndex]
    reordered[newIndex] = temp
    onChange(reordered.map((img, i) => ({ ...img, order: i })))
  }

  const setMain = (index: number) => {
    onChange(
      sortedImages.map((img, i) => ({
        ...img,
        isMain: i === index,
      }))
    )
  }

  const removeImage = (index: number) => {
    const filtered = sortedImages.filter((_, i) => i !== index)
    const withOrder = filtered.map((img, i) => ({ ...img, order: i }))
    // Если удалили главное и остались другие — сделать первое главным
    if (!withOrder.some((img) => img.isMain) && withOrder.length > 0) {
      withOrder[0].isMain = true
    }
    onChange(withOrder)
  }

  return (
    <div className='space-y-4'>
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-[var(--radius-lg)] p-8 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-accent hover:bg-accent/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {uploading ? (
          <div className='flex flex-col items-center gap-3 text-muted-foreground'>
            <Loader2 className='h-8 w-8 animate-spin' />
            <div className='text-sm font-medium'>Загрузка...</div>
          </div>
        ) : (
          <div className='flex flex-col items-center gap-3 text-muted-foreground'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-border bg-background/60'>
              <ImagePlus className='h-6 w-6' />
            </div>
            <div>
              <div className='text-sm font-semibold text-foreground'>Перетащите изображения сюда</div>
              <div className='text-xs mt-1'>или нажмите для выбора файлов</div>
            </div>
            <div className='text-[10px]'>PNG, JPG, WebP, GIF. Макс. 10 МБ каждый</div>
          </div>
        )}
      </div>

      {error && (
        <div className='flex items-center gap-1.5 text-sm text-destructive'>
          <AlertCircle className='h-4 w-4 shrink-0' />
          {error}
        </div>
      )}

      {sortedImages.length > 0 && (
        <div className='flex flex-wrap gap-3'>
          {sortedImages.map((img, index) => (
            <div
              key={`${img.key}-${index}`}
              className={cn(
                'relative h-24 w-24 rounded-[var(--radius-md)] border overflow-hidden group',
                img.isMain ? 'border-accent ring-1 ring-accent' : 'border-border'
              )}
            >
              <img
                src={getImageUrl(img)}
                alt={img.originalName || 'Изображение'}
                className='h-full w-full object-cover'
              />

              {img.isMain && (
                <div className='absolute top-1 left-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white'>
                  Главное
                </div>
              )}

              <div className='absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    moveImage(index, 'up')
                  }}
                  disabled={index === 0}
                  className='h-6 w-6 rounded-full bg-white/90 flex items-center justify-center text-foreground hover:bg-white disabled:opacity-30'
                  title='Вверх'
                >
                  <ArrowUp className='h-3 w-3' />
                </button>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    moveImage(index, 'down')
                  }}
                  disabled={index === sortedImages.length - 1}
                  className='h-6 w-6 rounded-full bg-white/90 flex items-center justify-center text-foreground hover:bg-white disabled:opacity-30'
                  title='Вниз'
                >
                  <ArrowDown className='h-3 w-3' />
                </button>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    setMain(index)
                  }}
                  disabled={img.isMain}
                  className='h-6 w-6 rounded-full bg-white/90 flex items-center justify-center text-foreground hover:bg-white disabled:opacity-30'
                  title='Сделать главным'
                >
                  <Star className='h-3 w-3' />
                </button>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  className='h-6 w-6 rounded-full bg-white/90 flex items-center justify-center text-destructive hover:bg-white'
                  title='Удалить'
                >
                  <Trash2 className='h-3 w-3' />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type='file'
        multiple
        accept='image/png,image/jpeg,image/webp,image/gif'
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { generateSlug } from '@/shared/lib/generateSlug'
import { PageBlocksEditor } from '@/features/admin/page-blocks'
import type { PageBlockDraft, PageBlockRecord, PageBlockType } from '@/shared/types/page-builder'
import { PAGE_BLOCK_TYPES } from '@/shared/types/page-builder'

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
	page?: {
		id: string
		title?: string | null
		slug?: string | null
		content?: string | null
		status?: string | null
		metaTitle?: string | null
		metaDesc?: string | null
	}
}

function toBlockDraft(record: PageBlockRecord): PageBlockDraft | null {
	if (!PAGE_BLOCK_TYPES.includes(record.type as PageBlockType)) return null
	return {
		draftId: record.id,
		id: record.id,
		type: record.type as PageBlockType,
		isActive: record.isActive,
		config: (record.config && typeof record.config === 'object' && !Array.isArray(record.config)
			? record.config
			: {}) as Record<string, unknown>,
	}
}

export default function PageFormModal({ open, onOpenChange, onSuccess, page }: Props) {
	const isEdit = !!page

	const [title, setTitle] = useState('')
	const [slug, setSlug] = useState('')
	const [isPublished, setIsPublished] = useState(false)
	const [metaTitle, setMetaTitle] = useState('')
	const [metaDesc, setMetaDesc] = useState('')
	const [blocks, setBlocks] = useState<PageBlockDraft[]>([])

	// Загружаем полные данные страницы (включая блоки) при редактировании
	const { data: fullPage } = trpc.pages.getById.useQuery(page?.id ?? '', {
		enabled: isEdit && open && !!page?.id,
	})

	const { mutate: create, isPending: isCreating } = trpc.pages.create.useMutation({
		onSuccess: () => {
			toast.success('Страница создана')
			onSuccess()
			onOpenChange(false)
			reset()
		},
		onError: (err) => {
			toast.error(err.message ?? 'Ошибка при создании страницы')
		},
	})
	const { mutate: update, isPending: isUpdating } = trpc.pages.update.useMutation({
		onSuccess: () => {
			toast.success('Страница обновлена')
			onSuccess()
			onOpenChange(false)
			reset()
		},
		onError: (err) => {
			toast.error(err.message ?? 'Ошибка при сохранении страницы')
		},
	})

	useEffect(() => {
		if (page && open) {
			setTitle(page.title ?? '')
			setSlug(page.slug ?? '')
			setIsPublished(page.status === 'PUBLISHED')
			setMetaTitle(page.metaTitle ?? '')
			setMetaDesc(page.metaDesc ?? '')
		} else if (!page) {
			reset()
		}
	}, [page, open])

	// Загружаем блоки из полных данных страницы
	useEffect(() => {
		if (fullPage?.blocks && open) {
			const drafts = (fullPage.blocks as PageBlockRecord[])
				.map(toBlockDraft)
				.filter((d): d is PageBlockDraft => d !== null)
			setBlocks(drafts)
		}
	}, [fullPage, open])

	const reset = () => {
		setTitle('')
		setSlug('')
		setIsPublished(false)
		setMetaTitle('')
		setMetaDesc('')
		setBlocks([])
	}

	const handleSave = () => {
		const finalSlug = slug.trim() || generateSlug(title)
		if (!/^[a-z0-9-_]+$/.test(finalSlug)) {
			toast.error('Slug должен содержать только латинские буквы, цифры, дефис и подчёркивание')
			return
		}
		if (!title.trim()) {
			toast.error('Введите заголовок страницы')
			return
		}

		const blocksSave = blocks.map(b => ({
			id: b.id,
			type: b.type,
			isActive: b.isActive,
			config: b.config,
		}))

		const payload = {
			title: title.trim(),
			slug: finalSlug,
			isPublished,
			metaTitle: metaTitle || undefined,
			metaDesc: metaDesc || undefined,
			blocks: blocksSave,
		}

		if (isEdit) {
			update({ id: page.id, ...payload })
		} else {
			create(payload)
		}
	}

	const isPending = isCreating || isUpdating

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Редактировать страницу' : 'Новая страница'}</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue='content' className='space-y-4'>
					<TabsList>
						<TabsTrigger value='content'>Основное</TabsTrigger>
						<TabsTrigger value='blocks'>
							Блоки{blocks.length > 0 ? ` (${blocks.length})` : ''}
						</TabsTrigger>
						<TabsTrigger value='seo'>SEO</TabsTrigger>
					</TabsList>

					<TabsContent value='content' className='space-y-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Заголовок *</label>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder='Введите заголовок'
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Slug</label>
							<Input
								value={slug}
								onChange={(e) => setSlug(e.target.value)}
								placeholder='автоматически из заголовка'
							/>
						</div>
						<div className='flex items-center justify-between py-2'>
							<span className='text-sm font-medium'>Опубликована</span>
							<Switch checked={isPublished} onCheckedChange={setIsPublished} />
						</div>
					</TabsContent>

					<TabsContent value='blocks' className='space-y-4'>
						<p className='text-sm text-muted-foreground'>
							Блоки отображаются на публичной странице вместо старого HTML-контента.
						</p>
						<PageBlocksEditor value={blocks} onChange={setBlocks} />
					</TabsContent>

					<TabsContent value='seo' className='space-y-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Meta Title</label>
							<Input
								value={metaTitle}
								onChange={(e) => setMetaTitle(e.target.value)}
								placeholder={title}
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Meta Description</label>
							<textarea
								className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
								value={metaDesc}
								onChange={(e) => setMetaDesc(e.target.value)}
								placeholder='Краткое описание страницы для поисковиков'
							/>
						</div>
					</TabsContent>
				</Tabs>

				<div className='flex justify-end gap-2 border-t border-border pt-4'>
					<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
						Отмена
					</Button>
					<Button onClick={handleSave} disabled={isPending}>
						{isPending ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { generateSlug } from '@/shared/lib/generateslug'
import { generatePageSeo } from '@/shared/lib/seo/generateseo'
import { SeoEditor, SeoFieldsBlock } from '@aurasveta/shared-admin'
import { PageBlocksEditor } from '@/features/admin/page-blocks'
import type { PageBlockDraft, PageBlockRecord, PageBlockType } from '@/shared/types/pagebuilder'
import { PAGE_BLOCK_TYPES } from '@/shared/types/pagebuilder'
import type { SeoFormValues } from '@/shared/types/seo'

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

function createEmptySeoForm(): SeoFormValues {
	return {
		title: '',
		description: '',
		keywords: '',
		ogTitle: '',
		ogDescription: '',
		ogImage: '',
		canonicalUrl: '',
		noIndex: false,
	}
}

function toNullableSeoValue(value: string) {
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

export default function PageFormModal({ open, onOpenChange, onSuccess, page }: Props) {
	const isEdit = !!page

	const [title, setTitle] = useState('')
	const [slug, setSlug] = useState('')
	const [isPublished, setIsPublished] = useState(false)
	const [metaTitle, setMetaTitle] = useState('')
	const [metaDesc, setMetaDesc] = useState('')
	const [blocks, setBlocks] = useState<PageBlockDraft[]>([])
	const [seoDraft, setSeoDraft] = useState<SeoFormValues>(createEmptySeoForm())

	const reset = () => {
		setTitle('')
		setSlug('')
		setIsPublished(false)
		setMetaTitle('')
		setMetaDesc('')
		setBlocks([])
		setSeoDraft(createEmptySeoForm())
	}

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

	/* eslint-disable react-hooks/set-state-in-effect */
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
	/* eslint-enable react-hooks/set-state-in-effect */

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
			metaTitle: isEdit ? metaTitle || undefined : toNullableSeoValue(seoDraft.title) ?? undefined,
			metaDesc: isEdit ? metaDesc || undefined : toNullableSeoValue(seoDraft.description) ?? undefined,
			seo: !isEdit
				? {
					title: toNullableSeoValue(seoDraft.title),
					description: toNullableSeoValue(seoDraft.description),
					keywords: toNullableSeoValue(seoDraft.keywords),
					ogTitle: toNullableSeoValue(seoDraft.ogTitle),
					ogDescription: toNullableSeoValue(seoDraft.ogDescription),
					ogImage: toNullableSeoValue(seoDraft.ogImage),
					canonicalUrl: toNullableSeoValue(seoDraft.canonicalUrl),
					noIndex: seoDraft.noIndex,
				}
				: undefined,
			blocks: blocksSave,
		}

		if (isEdit) {
			update({ id: page.id, ...payload })
		} else {
			create(payload)
		}
	}

	const isPending = isCreating || isUpdating

	const autoSeoSuggestion = useMemo(
		() =>
			generatePageSeo({
				title,
				metaTitle: seoDraft.title || undefined,
				metaDesc: seoDraft.description || undefined,
			}),
		[title, seoDraft.title, seoDraft.description],
	)

	const applyAutoSeo = () => {
		setSeoDraft(prev => ({
			...prev,
			title: prev.title || autoSeoSuggestion.title,
			description: prev.description || autoSeoSuggestion.description,
			keywords: prev.keywords || autoSeoSuggestion.keywords,
			ogTitle: prev.ogTitle || autoSeoSuggestion.ogTitle,
			ogDescription: prev.ogDescription || autoSeoSuggestion.ogDescription,
			ogImage: prev.ogImage || autoSeoSuggestion.ogImage || '',
		}))
	}

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
						{isEdit && page?.id ? (
							<SeoEditor mode='managed' targetType='page' targetId={page.id} />
						) : (
							<SeoFieldsBlock
								value={seoDraft}
								onChange={setSeoDraft}
								onAutoFill={applyAutoSeo}
								auditNote='Кнопка заполняет SEO-поля по общим правилам генерации для страниц.'
								title={title || undefined}
								description='SEO-поля будут сохранены сразу после создания страницы.'
							/>
						)}
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

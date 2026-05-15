'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Save } from 'lucide-react'
import type { SeoEditFields } from '../_hooks/use-seo-list'

interface SeoItem {
	id: string
	targetType: string
	targetId: string
	title: string | null
	description: string | null
	keywords: string | null
	ogTitle: string | null
	ogDescription: string | null
	ogImage: string | null
	canonicalUrl: string | null
	noIndex: boolean
	createdAt: Date
	updatedAt: Date
}

interface SeoEditFormProps {
	item: SeoItem
	edit: SeoEditFields
	handleEdit: <K extends keyof SeoEditFields>(id: string, field: K, value: SeoEditFields[K]) => void
	handleSave: (item: SeoItem) => void
}

export function SeoEditForm({ item, edit, handleEdit, handleSave }: SeoEditFormProps) {
	return (
		<div className='space-y-3'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
				<div className='space-y-2'>
					<label className='text-xs font-medium text-muted-foreground block'>Title</label>
					<Input value={edit.title ?? ''} onChange={(e) => handleEdit(item.id, 'title', e.target.value)} className='text-xs' />
				</div>
				<div className='space-y-2'>
					<label className='text-xs font-medium text-muted-foreground block'>OG Title</label>
					<Input
						value={edit.ogTitle ?? ''}
						onChange={(e) => handleEdit(item.id, 'ogTitle', e.target.value)}
						className='text-xs'
						placeholder='(пусто — используется title)'
					/>
				</div>
				<div className='md:col-span-2 space-y-2'>
					<label className='text-xs font-medium text-muted-foreground block'>Description</label>
					<textarea
						className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]'
						value={edit.description ?? ''}
						onChange={(e) => handleEdit(item.id, 'description', e.target.value)}
					/>
					<div className='text-[10px] text-muted-foreground text-right'>{(edit.description ?? '').length}/160</div>
				</div>
				<div className='space-y-2'>
					<label className='text-xs font-medium text-muted-foreground block'>Keywords</label>
					<Input value={edit.keywords ?? ''} onChange={(e) => handleEdit(item.id, 'keywords', e.target.value)} className='text-xs' />
				</div>
				<div className='space-y-2'>
					<label className='text-xs font-medium text-muted-foreground block'>OG Image</label>
					<Input
						value={edit.ogImage ?? ''}
						onChange={(e) => handleEdit(item.id, 'ogImage', e.target.value)}
						className='text-xs'
						placeholder='URL изображения'
					/>
				</div>
				<div className='space-y-2'>
					<label className='text-xs font-medium text-muted-foreground block'>Canonical URL</label>
					<Input
						value={edit.canonicalUrl ?? ''}
						onChange={(e) => handleEdit(item.id, 'canonicalUrl', e.target.value)}
						className='text-xs'
						placeholder='(пусто — авто)'
					/>
				</div>
				<div className='flex items-center gap-3'>
					<label className='text-xs font-medium text-muted-foreground'>noindex</label>
					<Switch checked={!!edit.noIndex} onCheckedChange={(v) => handleEdit(item.id, 'noIndex', v)} />
				</div>
			</div>
			<div className='flex items-start gap-3 pt-2'>
				<Button size='sm' onClick={() => handleSave(item)} className='gap-1 shrink-0'>
					<Save className='h-3 w-3' />
					Сохранить
				</Button>
				<GooglePreview edit={edit} item={item} />
			</div>
		</div>
	)
}

function GooglePreview({ edit, item }: { edit: SeoEditFields; item: SeoItem }) {
	const title = edit.title ?? item.title ?? 'Заголовок страницы'
	const url = edit.canonicalUrl ?? item.canonicalUrl ?? `https://aurasveta.by/${item.targetType}/${item.targetId.slice(0, 12)}`
	const desc = edit.description ?? item.description ?? 'Описание страницы будет отображено в результатах поиска Google.'

	return (
		<div className='flex-1 rounded-lg border border-border bg-card p-3 space-y-1'>
			<div className='text-[10px] text-muted-foreground font-medium'>Google Preview</div>
			<div className='text-blue-500 text-xs font-medium truncate'>{title}</div>
			<div className='text-green-400 text-[10px] truncate'>{url}</div>
			<div className='text-[10px] text-muted-foreground line-clamp-2'>{desc}</div>
		</div>
	)
}

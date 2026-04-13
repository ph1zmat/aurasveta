'use client'

import { useState, useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

interface SeoFormProps {
	targetType: 'product' | 'category' | 'page'
	targetId: string
}

export default function SeoForm({ targetType, targetId }: SeoFormProps) {
	const { data: existing, refetch } = trpc.seo.getByTarget.useQuery({
		targetType,
		targetId,
	})

	const updateMutation = trpc.seo.update.useMutation({
		onSuccess: () => {
			refetch()
		},
	})

	const initialForm = useMemo(
		() => ({
			title: existing?.title ?? '',
			description: existing?.description ?? '',
			keywords: existing?.keywords ?? '',
			ogTitle: existing?.ogTitle ?? '',
			ogDescription: existing?.ogDescription ?? '',
			ogImage: existing?.ogImage ?? '',
			canonicalUrl: existing?.canonicalUrl ?? '',
			noIndex: existing?.noIndex ?? false,
		}),
		[existing],
	)

	const [form, setForm] = useState(initialForm)

	// Reset form when data loads
	const [lastExisting, setLastExisting] = useState(existing)
	if (existing !== lastExisting) {
		setLastExisting(existing)
		if (existing) {
			setForm({
				title: existing.title ?? '',
				description: existing.description ?? '',
				keywords: existing.keywords ?? '',
				ogTitle: existing.ogTitle ?? '',
				ogDescription: existing.ogDescription ?? '',
				ogImage: existing.ogImage ?? '',
				canonicalUrl: existing.canonicalUrl ?? '',
				noIndex: existing.noIndex,
			})
		}
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		updateMutation.mutate({
			targetType,
			targetId,
			title: form.title || null,
			description: form.description || null,
			keywords: form.keywords || null,
			ogTitle: form.ogTitle || null,
			ogDescription: form.ogDescription || null,
			ogImage: form.ogImage || null,
			canonicalUrl: form.canonicalUrl || null,
			noIndex: form.noIndex,
		})
	}

	return (
		<form
			onSubmit={handleSubmit}
			className='space-y-4 rounded-lg border border-border p-4'
		>
			<h3 className='text-sm font-semibold uppercase tracking-widest'>
				SEO настройки
			</h3>

			<div className='space-y-2'>
				<label className='text-xs font-medium text-muted-foreground'>
					Title
				</label>
				<Input
					value={form.title}
					onChange={e => setForm({ ...form, title: e.target.value })}
					placeholder='Авто-генерация если пусто'
				/>
			</div>

			<div className='space-y-2'>
				<label className='text-xs font-medium text-muted-foreground'>
					Description
				</label>
				<textarea
					value={form.description}
					onChange={e => setForm({ ...form, description: e.target.value })}
					placeholder='Авто-генерация если пусто'
					className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
					rows={3}
				/>
			</div>

			<div className='space-y-2'>
				<label className='text-xs font-medium text-muted-foreground'>
					Keywords
				</label>
				<Input
					value={form.keywords}
					onChange={e => setForm({ ...form, keywords: e.target.value })}
					placeholder='Через запятую'
				/>
			</div>

			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-2'>
					<label className='text-xs font-medium text-muted-foreground'>
						OG Title
					</label>
					<Input
						value={form.ogTitle}
						onChange={e => setForm({ ...form, ogTitle: e.target.value })}
					/>
				</div>
				<div className='space-y-2'>
					<label className='text-xs font-medium text-muted-foreground'>
						OG Image URL
					</label>
					<Input
						value={form.ogImage}
						onChange={e => setForm({ ...form, ogImage: e.target.value })}
					/>
				</div>
			</div>

			<div className='space-y-2'>
				<label className='text-xs font-medium text-muted-foreground'>
					OG Description
				</label>
				<textarea
					value={form.ogDescription}
					onChange={e => setForm({ ...form, ogDescription: e.target.value })}
					className='flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
					rows={2}
				/>
			</div>

			<div className='space-y-2'>
				<label className='text-xs font-medium text-muted-foreground'>
					Canonical URL
				</label>
				<Input
					value={form.canonicalUrl}
					onChange={e => setForm({ ...form, canonicalUrl: e.target.value })}
				/>
			</div>

			<label className='flex items-center gap-2'>
				<input
					type='checkbox'
					checked={form.noIndex}
					onChange={e => setForm({ ...form, noIndex: e.target.checked })}
				/>
				<span className='text-sm'>noindex (скрыть от поисковиков)</span>
			</label>

			<Button
				type='submit'
				variant='primary'
				size='sm'
				disabled={updateMutation.isPending}
			>
				{updateMutation.isPending ? 'Сохранение...' : 'Сохранить SEO'}
			</Button>
		</form>
	)
}

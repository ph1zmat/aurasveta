'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import {
	Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, X, ChevronUp, ChevronDown,
	LayoutGrid,
} from 'lucide-react'

type SectionItem = RouterOutputs['homeSection']['getAll'][number]
type SectionTypeItem = RouterOutputs['sectionType']['getAll'][number]

const inputCls =
	'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

export default function HomeSectionsClient() {
	const { data: sections, refetch } = trpc.homeSection.getAll.useQuery()
	const { data: sectionTypes } = trpc.sectionType.getAll.useQuery()
	const createMut = trpc.homeSection.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
	const updateMut = trpc.homeSection.update.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
	const deleteMut = trpc.homeSection.delete.useMutation({ onSuccess: () => refetch() })
	const reorderMut = trpc.homeSection.reorder.useMutation({ onSuccess: () => refetch() })

	const [showForm, setShowForm] = useState(false)
	const [editItem, setEditItem] = useState<SectionItem | null>(null)
	const [form, setForm] = useState({ sectionTypeId: '', title: '', isActive: true })

	function openCreate() {
		setEditItem(null)
		setForm({ sectionTypeId: sectionTypes?.[0]?.id ?? '', title: '', isActive: true })
		setShowForm(true)
	}

	function openEdit(s: SectionItem) {
		setEditItem(s)
		setForm({ sectionTypeId: s.sectionTypeId, title: s.title ?? '', isActive: s.isActive })
		setShowForm(true)
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (editItem) {
			updateMut.mutate({ id: editItem.id, title: form.title || undefined, isActive: form.isActive })
		} else {
			createMut.mutate({
				sectionTypeId: form.sectionTypeId,
				title: form.title || undefined,
				isActive: form.isActive,
				order: (sections?.length ?? 0),
				config: {},
			})
		}
	}

	function moveSection(index: number, dir: -1 | 1) {
		if (!sections) return
		const newOrder = sections.map((s, i) => ({ id: s.id, order: i }))
		const targetIndex = index + dir
		if (targetIndex < 0 || targetIndex >= sections.length) return
		// swap
		const tmp = newOrder[index].order
		newOrder[index].order = newOrder[targetIndex].order
		newOrder[targetIndex].order = tmp
		reorderMut.mutate(newOrder)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Секции главной страницы
				</h1>
				<Button variant='primary' size='sm' onClick={openCreate}>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
			</div>

			{/* Form */}
			{showForm && (
				<div className='rounded-xl border border-border bg-muted/30 p-6'>
					<div className='mb-4 flex items-center justify-between'>
						<h2 className='text-sm font-semibold text-foreground'>
							{editItem ? 'Редактировать секцию' : 'Новая секция'}
						</h2>
						<button onClick={() => setShowForm(false)} className='text-muted-foreground hover:text-foreground'>
							<X className='h-4 w-4' />
						</button>
					</div>
					<form onSubmit={handleSubmit} className='grid gap-4 sm:grid-cols-2'>
						{!editItem && (
							<div>
								<label className='mb-1 block text-xs font-medium text-muted-foreground'>
									Тип секции
								</label>
								<select
									required
									value={form.sectionTypeId}
									onChange={e => setForm(f => ({ ...f, sectionTypeId: e.target.value }))}
									className={inputCls}
								>
									<option value=''>Выберите тип...</option>
									{sectionTypes?.map((t: SectionTypeItem) => (
										<option key={t.id} value={t.id}>
											{t.name} ({t.component})
										</option>
									))}
								</select>
							</div>
						)}
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Заголовок (опционально)
							</label>
							<input
								value={form.title}
								onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
								placeholder='Переопределить заголовок секции'
								className={inputCls}
							/>
						</div>
						<div className='flex items-center gap-2 sm:col-span-2'>
							<input
								type='checkbox'
								id='isActive'
								checked={form.isActive}
								onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
								className='h-4 w-4 rounded border-border accent-primary'
							/>
							<label htmlFor='isActive' className='text-sm text-foreground'>
								Активна
							</label>
						</div>
						<div className='flex gap-2 sm:col-span-2'>
							<Button variant='primary' type='submit' size='sm' disabled={createMut.isPending || updateMut.isPending}>
								{editItem ? 'Сохранить' : 'Создать'}
							</Button>
							<Button variant='ghost' type='button' size='sm' onClick={() => setShowForm(false)}>
								Отмена
							</Button>
						</div>
					</form>
				</div>
			)}

			{/* Section list */}
			{sections && sections.length > 0 ? (
				<div className='flex flex-col gap-2'>
					{sections.map((s: SectionItem, idx: number) => (
						<div
							key={s.id}
							className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
								s.isActive ? 'border-border bg-card' : 'border-border/50 bg-muted/10 opacity-60'
							}`}
						>
							<GripVertical className='h-4 w-4 shrink-0 text-muted-foreground/40' />

							<div className='flex items-center gap-2'>
								<button
									onClick={() => moveSection(idx, -1)}
									disabled={idx === 0}
									className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
								>
									<ChevronUp className='h-3.5 w-3.5' />
								</button>
								<button
									onClick={() => moveSection(idx, 1)}
									disabled={idx === (sections.length - 1)}
									className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
								>
									<ChevronDown className='h-3.5 w-3.5' />
								</button>
							</div>

							<span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-mono text-muted-foreground'>
								{s.order + 1}
							</span>

							<div className='min-w-0 flex-1'>
								<div className='flex items-center gap-2'>
									<span className='text-sm font-medium text-foreground truncate'>
										{s.title ?? s.sectionType.name}
									</span>
									<span className='shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground'>
										{s.sectionType.component}
									</span>
								</div>
							</div>

							<div className='flex shrink-0 items-center gap-1'>
								<button
									onClick={() =>
										updateMut.mutate({ id: s.id, isActive: !s.isActive })
									}
									className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
									title={s.isActive ? 'Скрыть' : 'Показать'}
								>
									{s.isActive ? <Eye className='h-3.5 w-3.5' /> : <EyeOff className='h-3.5 w-3.5' />}
								</button>
								<button
									onClick={() => openEdit(s)}
									className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
								>
									<Pencil className='h-3.5 w-3.5' />
								</button>
								<button
									onClick={() => {
										if (confirm(`Удалить секцию "${s.title ?? s.sectionType.name}"?`)) {
											deleteMut.mutate(s.id)
										}
									}}
									className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive'
								>
									<Trash2 className='h-3.5 w-3.5' />
								</button>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<LayoutGrid className='mb-3 h-10 w-10 text-muted-foreground/30' />
					<p className='mb-4 text-sm text-muted-foreground'>Нет секций главной страницы</p>
					{sectionTypes && sectionTypes.length === 0 && (
						<p className='text-xs text-muted-foreground/60'>
							Сначала зарегистрируйте типы секций через сидирование или вручную.
						</p>
					)}
				</div>
			)}
		</div>
	)
}

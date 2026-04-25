'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Image } from 'lucide-react'

// Explicit types matching the new schema (pre-migration tRPC types are stale)
interface PropertyValueItem {
	id: string
	value: string
	slug: string
	photo?: string | null
	order: number
}

interface PropertyItem {
	id: string
	name: string
	slug: string
	hasPhoto: boolean
	values: PropertyValueItem[]
	_count: { productValues: number }
}

export default function PropertiesClient() {
	const { data: propertiesRaw, refetch } = trpc.properties.getAll.useQuery()
	const properties = propertiesRaw as unknown as PropertyItem[] | undefined
	const createMut = trpc.properties.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
	const updateMut = trpc.properties.update.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
	const deleteMut = trpc.properties.delete.useMutation({ onSuccess: () => refetch() })
	const createValueMut = trpc.properties.createValue.useMutation({ onSuccess: () => refetch() })
	const deleteValueMut = trpc.properties.deleteValue.useMutation({ onSuccess: () => refetch() })

	const [showForm, setShowForm] = useState(false)
	const [editProp, setEditProp] = useState<PropertyItem | null>(null)
	const [form, setForm] = useState({ name: '', slug: '', hasPhoto: false })
	const [expanded, setExpanded] = useState<Set<string>>(new Set())
	const [addingValueFor, setAddingValueFor] = useState<string | null>(null)
	const [newValueForm, setNewValueForm] = useState({ value: '', slug: '', photo: '' })

	function openCreate() {
		setEditProp(null)
		setForm({ name: '', slug: '', hasPhoto: false })
		setShowForm(true)
	}

	function openEdit(prop: PropertyItem) {
		setEditProp(prop)
		setForm({ name: prop.name, slug: prop.slug, hasPhoto: prop.hasPhoto })
		setShowForm(true)
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (editProp) {
			updateMut.mutate({ id: editProp.id, ...form })
		} else {
			createMut.mutate(form)
		}
	}

	function toggleExpand(id: string) {
		setExpanded(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	function handleAddValue(propertyId: string) {
		if (!newValueForm.value.trim()) return
		createValueMut.mutate({
			propertyId,
			value: newValueForm.value,
			slug: newValueForm.slug || undefined,
			photo: newValueForm.photo || undefined,
		})
		setNewValueForm({ value: '', slug: '', photo: '' })
		setAddingValueFor(null)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Свойства
				</h1>
				<Button variant='primary' size='sm' onClick={openCreate}>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
			</div>

			{showForm && (
				<div className='rounded-xl border border-border bg-muted/30 p-6'>
					<form onSubmit={handleSubmit} className='grid gap-4 sm:grid-cols-3'>
						<input
							placeholder='Название'
							required
							value={form.name}
							onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
							className='input-field'
						/>
						<input
							placeholder='Slug (авто из названия)'
							value={form.slug}
							onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
							className='input-field'
						/>
						<label className='flex items-center gap-2 text-sm'>
							<input
								type='checkbox'
								checked={form.hasPhoto}
								onChange={e => setForm(f => ({ ...f, hasPhoto: e.target.checked }))}
								className='h-4 w-4 rounded border-border'
							/>
							Значения имеют фото
						</label>
						<div className='flex gap-2 sm:col-span-3'>
							<Button variant='primary' type='submit' size='sm'>Сохранить</Button>
							<Button variant='outline' type='button' size='sm' onClick={() => setShowForm(false)}>Отмена</Button>
						</div>
					</form>
				</div>
			)}

			<div className='space-y-2'>
				{properties?.map((prop: PropertyItem) => (
					<div key={prop.id} className='rounded-xl border border-border bg-card'>
						{/* Property header */}
						<div className='flex items-center justify-between px-4 py-3'>
							<button
								type='button'
								onClick={() => toggleExpand(prop.id)}
								className='flex flex-1 items-center gap-2 text-left'
							>
								{expanded.has(prop.id) ? (
									<ChevronDown className='h-4 w-4 text-muted-foreground' />
								) : (
									<ChevronRight className='h-4 w-4 text-muted-foreground' />
								)}
								<span className='font-medium text-foreground'>{prop.name}</span>
								<span className='font-mono text-xs text-muted-foreground'>{prop.slug}</span>
								{prop.hasPhoto && <Image className='h-3.5 w-3.5 text-accent' />}
								<span className='ml-auto text-xs text-muted-foreground'>
									{prop.values.length} знач. · {prop._count.productValues} товаров
								</span>
							</button>
							<div className='ml-4 flex gap-1'>
								<button onClick={() => openEdit(prop)} className='rounded-md p-1.5 text-muted-foreground hover:text-foreground'>
									<Pencil className='h-3.5 w-3.5' />
								</button>
								<button
									onClick={() => { if (confirm('Удалить свойство?')) deleteMut.mutate(prop.id) }}
									className='rounded-md p-1.5 text-muted-foreground hover:text-destructive'
								>
									<Trash2 className='h-3.5 w-3.5' />
								</button>
							</div>
						</div>

						{/* Values list */}
						{expanded.has(prop.id) && (
							<div className='border-t border-border px-4 pb-3'>
								<div className='space-y-1 pt-2'>
									{prop.values.map((val: PropertyValueItem) => (
										<div key={val.id} className='flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-muted/30'>
											{val.photo && (
												<img src={val.photo} alt={val.value} className='h-6 w-6 rounded object-cover' />
											)}
											<span className='flex-1 text-sm text-foreground'>{val.value}</span>
											<span className='font-mono text-xs text-muted-foreground'>{val.slug}</span>
											<button
												onClick={() => { if (confirm('Удалить значение?')) deleteValueMut.mutate(val.id) }}
												className='p-1 text-muted-foreground hover:text-destructive'
											>
												<Trash2 className='h-3.5 w-3.5' />
											</button>
										</div>
									))}

									{addingValueFor === prop.id ? (
										<div className='mt-2 grid gap-2 sm:grid-cols-4'>
											<input
												placeholder='Значение'
												value={newValueForm.value}
												onChange={e => setNewValueForm(f => ({ ...f, value: e.target.value }))}
												className='input-field sm:col-span-1'
												autoFocus
											/>
											<input
												placeholder='Slug'
												value={newValueForm.slug}
												onChange={e => setNewValueForm(f => ({ ...f, slug: e.target.value }))}
												className='input-field sm:col-span-1'
											/>
											{prop.hasPhoto && (
												<input
													placeholder='URL фото'
													value={newValueForm.photo}
													onChange={e => setNewValueForm(f => ({ ...f, photo: e.target.value }))}
													className='input-field sm:col-span-1'
												/>
											)}
											<div className='flex gap-2'>
												<Button variant='primary' size='sm' type='button' onClick={() => handleAddValue(prop.id)}>
													Добавить
												</Button>
												<Button variant='outline' size='sm' type='button' onClick={() => setAddingValueFor(null)}>
													Отмена
												</Button>
											</div>
										</div>
									) : (
										<button
											type='button'
											onClick={() => { setAddingValueFor(prop.id); setNewValueForm({ value: '', slug: '', photo: '' }) }}
											className='mt-1 flex items-center gap-1 text-xs text-accent hover:text-accent/80'
										>
											<Plus className='h-3.5 w-3.5' /> Добавить значение
										</button>
									)}
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}


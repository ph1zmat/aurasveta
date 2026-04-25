'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

type PropertyItem = RouterOutputs['properties']['getAll'][number]
type PropertyValue = PropertyItem['values'][number]

export default function PropertiesClient() {
	const { data: properties, refetch } = trpc.properties.getAll.useQuery()
	const createMut = trpc.properties.create.useMutation({
		onSuccess: () => { refetch(); setShowForm(false) },
	})
	const updateMut = trpc.properties.update.useMutation({
		onSuccess: () => { refetch(); setShowForm(false) },
	})
	const deleteMut = trpc.properties.delete.useMutation({ onSuccess: () => refetch() })
	const createValueMut = trpc.properties.createValue.useMutation({ onSuccess: () => refetch() })
	const deleteValueMut = trpc.properties.deleteValue.useMutation({ onSuccess: () => refetch() })

	const [showForm, setShowForm] = useState(false)
	const [editProp, setEditProp] = useState<PropertyItem | null>(null)
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [form, setForm] = useState({ slug: '', name: '', hasPhoto: false })
	const [valueForm, setValueForm] = useState<{ propertyId: string; value: string; slug: string } | null>(null)

	function openCreate() {
		setEditProp(null)
		setForm({ slug: '', name: '', hasPhoto: false })
		setShowForm(true)
	}

	function openEdit(prop: PropertyItem) {
		setEditProp(prop)
		setForm({ slug: prop.slug, name: prop.name, hasPhoto: prop.hasPhoto })
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

	function handleAddValue(e: React.FormEvent) {
		e.preventDefault()
		if (!valueForm) return
		createValueMut.mutate({
			propertyId: valueForm.propertyId,
			value: valueForm.value,
			slug: valueForm.slug || undefined,
		})
		setValueForm(null)
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
							placeholder='Slug (латиница)'
							required
							value={form.slug}
							onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
							className='input-field'
						/>
						<input
							placeholder='Название'
							required
							value={form.name}
							onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
							className='input-field'
						/>
						<label className='flex items-center gap-2 text-sm'>
							<input
								type='checkbox'
								checked={form.hasPhoto}
								onChange={e => setForm(f => ({ ...f, hasPhoto: e.target.checked }))}
							/>
							Со фото
						</label>
						<div className='flex gap-2 sm:col-span-3'>
							<Button variant='primary' type='submit' size='sm'>Сохранить</Button>
							<Button variant='ghost' type='button' size='sm' onClick={() => setShowForm(false)}>Отмена</Button>
						</div>
					</form>
				</div>
			)}

			<div className='overflow-x-auto rounded-xl border border-border'>
				<table className='w-full text-sm'>
					<thead>
						<tr className='border-b border-border bg-muted/30 text-left text-muted-foreground'>
							<th className='px-4 py-3 font-medium'>Slug</th>
							<th className='px-4 py-3 font-medium'>Название</th>
							<th className='px-4 py-3 font-medium'>Значений</th>
							<th className='px-4 py-3 font-medium'>Действия</th>
						</tr>
					</thead>
					<tbody>
						{properties?.map((prop: PropertyItem) => (
							<>
								<tr key={prop.id} className='border-b border-border/50'>
									<td className='px-4 py-3 font-mono text-xs'>{prop.slug}</td>
									<td className='px-4 py-3'>{prop.name}</td>
									<td className='px-4 py-3 text-muted-foreground'>
										<button
											onClick={() => setExpandedId(expandedId === prop.id ? null : prop.id)}
											className='flex items-center gap-1 hover:text-foreground'
										>
											{expandedId === prop.id ? <ChevronDown className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
											{prop.values.length}
										</button>
									</td>
									<td className='px-4 py-3'>
										<div className='flex gap-2'>
											<button onClick={() => openEdit(prop)} className='text-muted-foreground hover:text-foreground' aria-label='Редактировать'>
												<Pencil className='h-4 w-4' />
											</button>
											<button
												onClick={() => { if (confirm('Удалить свойство и все его значения?')) deleteMut.mutate(prop.id) }}
												className='text-muted-foreground hover:text-destructive'
												aria-label='Удалить'
											>
												<Trash2 className='h-4 w-4' />
											</button>
										</div>
									</td>
								</tr>
								{expandedId === prop.id && (
									<tr key={`${prop.id}-values`} className='bg-muted/10'>
										<td colSpan={4} className='px-6 py-3'>
											<div className='space-y-2'>
												<p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Значения</p>
												<div className='flex flex-wrap gap-2'>
													{prop.values.map((v: PropertyValue) => (
														<span key={v.id} className='flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs'>
															{v.value}
															<button
																onClick={() => { if (confirm(`Удалить значение "${v.value}"?`)) deleteValueMut.mutate(v.id) }}
																className='ml-1 text-muted-foreground hover:text-destructive'
															>
																<Trash2 className='h-3 w-3' />
															</button>
														</span>
													))}
												</div>
												{valueForm?.propertyId === prop.id ? (
													<form onSubmit={handleAddValue} className='flex gap-2 mt-2'>
														<input
															placeholder='Значение'
															required
															value={valueForm.value}
															onChange={e => setValueForm(f => f ? ({ ...f, value: e.target.value }) : f)}
															className='input-field text-xs'
														/>
														<input
															placeholder='Slug (авто если пусто)'
															value={valueForm.slug}
															onChange={e => setValueForm(f => f ? ({ ...f, slug: e.target.value }) : f)}
															className='input-field text-xs'
														/>
														<Button variant='primary' type='submit' size='sm'>Добавить</Button>
														<Button variant='ghost' type='button' size='sm' onClick={() => setValueForm(null)}>✕</Button>
													</form>
												) : (
													<button
														onClick={() => setValueForm({ propertyId: prop.id, value: '', slug: '' })}
														className='mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
													>
														<Plus className='h-3 w-3' /> Добавить значение
													</button>
												)}
											</div>
										</td>
									</tr>
								)}
							</>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}


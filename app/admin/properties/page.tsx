'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const PROPERTY_TYPES = [
	'STRING',
	'NUMBER',
	'BOOLEAN',
	'DATE',
	'SELECT',
] as const
type PropertyItem = RouterOutputs['properties']['getAll'][number]

export default function AdminPropertiesPage() {
	const { data: properties, refetch } = trpc.properties.getAll.useQuery()
	const createMut = trpc.properties.create.useMutation({
		onSuccess: () => {
			refetch()
			setShowForm(false)
		},
	})
	const updateMut = trpc.properties.update.useMutation({
		onSuccess: () => {
			refetch()
			setShowForm(false)
		},
	})
	const deleteMut = trpc.properties.delete.useMutation({
		onSuccess: () => refetch(),
	})

	const [showForm, setShowForm] = useState(false)
	const [editProp, setEditProp] = useState<PropertyItem | null>(null)
	const [form, setForm] = useState({
		key: '',
		name: '',
		type: 'STRING' as (typeof PROPERTY_TYPES)[number],
	})

	function openCreate() {
		setEditProp(null)
		setForm({ key: '', name: '', type: 'STRING' })
		setShowForm(true)
	}

	function openEdit(prop: PropertyItem) {
		setEditProp(prop)
		setForm({ key: prop.key, name: prop.name, type: prop.type })
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
							placeholder='Ключ (напр. color)'
							required
							value={form.key}
							onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
							className='input-field'
						/>
						<input
							placeholder='Название (напр. Цвет)'
							required
							value={form.name}
							onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
							className='input-field'
						/>
						<select
							value={form.type}
							onChange={e =>
								setForm(f => ({
									...f,
									type: e.target.value as (typeof PROPERTY_TYPES)[number],
								}))
							}
							className='input-field'
						>
							{PROPERTY_TYPES.map(t => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
						<div className='flex gap-2 sm:col-span-3'>
							<Button variant='primary' type='submit' size='sm'>
								Сохранить
							</Button>
							<Button
								variant='outline'
								type='button'
								size='sm'
								onClick={() => setShowForm(false)}
							>
								Отмена
							</Button>
						</div>
					</form>
				</div>
			)}

			<div className='overflow-x-auto rounded-xl border border-border'>
				<table className='w-full text-sm'>
					<thead>
						<tr className='border-b border-border bg-muted/30 text-left text-muted-foreground'>
							<th className='px-4 py-3 font-medium'>Ключ</th>
							<th className='px-4 py-3 font-medium'>Название</th>
							<th className='px-4 py-3 font-medium'>Тип</th>
							<th className='px-4 py-3 font-medium'>Товаров</th>
							<th className='px-4 py-3 font-medium'>Действия</th>
						</tr>
					</thead>
					<tbody>
						{properties?.map(prop => (
							<tr key={prop.id} className='border-b border-border/50'>
								<td className='px-4 py-3 font-mono text-xs'>{prop.key}</td>
								<td className='px-4 py-3'>{prop.name}</td>
								<td className='px-4 py-3'>
									<span className='rounded bg-muted px-2 py-0.5 text-xs'>
										{prop.type}
									</span>
								</td>
								<td className='px-4 py-3 text-muted-foreground'>
									{prop._count?.productValues ?? 0}
								</td>
								<td className='px-4 py-3'>
									<div className='flex gap-2'>
										<button
											onClick={() => openEdit(prop)}
											className='text-muted-foreground hover:text-foreground'
										>
											<Pencil className='h-4 w-4' />
										</button>
										<button
											onClick={() => {
												if (confirm('Удалить свойство?'))
													deleteMut.mutate(prop.id)
											}}
											className='text-muted-foreground hover:text-destructive'
										>
											<Trash2 className='h-4 w-4' />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

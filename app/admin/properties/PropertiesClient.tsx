'use client'

import { useMemo, useState } from 'react'
import { readBooleanParam, readStringParam } from '@aurasveta/shared-admin'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import {
	Plus,
	Pencil,
	Trash2,
	X,
	Tag,
	Package,
	ChevronDown,
	ChevronRight,
	Image as ImageIcon,
} from 'lucide-react'
import PropertyFormModal from './PropertyFormModal'
import { useAdminSearchParams } from '../hooks/useAdminSearchParams'

type PropertyItem = RouterOutputs['properties']['getAll'][number]
type PropertyValue = PropertyItem['values'][number]

/* ============ Main ============ */

export default function PropertiesClient() {
	const { data: properties, refetch } = trpc.properties.getAll.useQuery()
	const { searchParams, updateSearchParams } = useAdminSearchParams()
	const deleteMut = trpc.properties.delete.useMutation({
		onSuccess: () => refetch(),
	})
	const deleteValueMut = trpc.properties.deleteValue.useMutation({
		onSuccess: () => refetch(),
	})
	const createValueMut = trpc.properties.createValue.useMutation({
		onSuccess: () => refetch(),
	})
	const showCreate =
		readBooleanParam(searchParams.get('create'), false) === true
	const editId = readStringParam(searchParams.get('edit')) || null
	const expandedId = readStringParam(searchParams.get('expand')) || null
	const search = readStringParam(searchParams.get('search'))
	const addValueFor = readStringParam(searchParams.get('addValue')) || null
	const [newValue, setNewValue] = useState({ value: '', slug: '' })

	const filtered = useMemo(() => {
		if (!properties) return []
		if (!search) return properties
		const q = search.toLowerCase()
		return properties.filter(
			(p: PropertyItem) =>
				p.name?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q),
		)
	}, [properties, search])

	const handleAddValue = (e: React.FormEvent) => {
		e.preventDefault()
		if (!addValueFor) return
		createValueMut.mutate({
			propertyId: addValueFor,
			value: newValue.value,
			slug: newValue.slug || undefined,
		})
		updateSearchParams({ addValue: null }, { history: 'replace' })
		setNewValue({ value: '', slug: '' })
	}

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Свойства
				</h1>
				<button
					onClick={() => {
						updateSearchParams(
							{ create: true, edit: null },
							{ history: 'push' },
						)
					}}
					className='flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
				>
					<Plus className='h-4 w-4' /> Добавить
				</button>
			</div>

			{properties && properties.length > 4 && (
				<input
					type='search'
					placeholder='Поиск свойств...'
					value={search}
					onChange={e =>
						updateSearchParams(
							{ search: e.target.value },
							{ history: 'replace' },
						)
					}
					className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
				/>
			)}

			{(showCreate || Boolean(editId)) && (
				<PropertyFormModal
					editId={editId}
					onClose={() =>
						updateSearchParams(
							{ create: null, edit: null },
							{ history: 'replace' },
						)
					}
					onSuccess={() => {
						updateSearchParams(
							{ create: null, edit: null },
							{ history: 'replace' },
						)
						refetch()
					}}
				/>
			)}

			{filtered.length > 0 ? (
				<div className='flex flex-col gap-3'>
					{filtered.map((prop: PropertyItem) => {
						const productCount = prop._count?.productValues ?? 0
						const isExpanded = expandedId === prop.id

						return (
							<div
								key={prop.id}
								className='rounded-2xl border border-border bg-muted/10'
							>
								<div className='flex items-center justify-between p-4'>
									<div className='flex items-center gap-3'>
										<button
											onClick={() =>
												updateSearchParams(
													{ expand: isExpanded ? null : prop.id },
													{ history: 'replace' },
												)
											}
											className='flex items-center gap-2 text-left'
										>
											{isExpanded ? (
												<ChevronDown className='h-4 w-4 text-muted-foreground' />
											) : (
												<ChevronRight className='h-4 w-4 text-muted-foreground' />
											)}
											<div>
												<div className='text-sm font-semibold text-foreground'>
													{prop.name}
												</div>
												<div className='mt-0.5 font-mono text-xs text-muted-foreground'>
													{prop.slug}
												</div>
											</div>
										</button>
										{prop.hasPhoto && (
											<span className='inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-500'>
												<ImageIcon className='h-2.5 w-2.5' /> Фото
											</span>
										)}
										<span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
											{prop.values?.length ?? 0} значений
										</span>
										{productCount > 0 && (
											<span className='flex items-center gap-1 text-xs text-muted-foreground'>
												<Package className='h-3 w-3' />
												{productCount}
											</span>
										)}
									</div>
									<div className='flex gap-1'>
										<button
											onClick={() => {
												updateSearchParams(
													{ edit: prop.id, create: null },
													{ history: 'push' },
												)
											}}
											className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
										>
											<Pencil className='h-3.5 w-3.5' />
										</button>
										<button
											onClick={() => {
												if (confirm('Удалить свойство и все его значения?'))
													deleteMut.mutate(prop.id)
											}}
											className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive'
										>
											<Trash2 className='h-3.5 w-3.5' />
										</button>
									</div>
								</div>

								{isExpanded && (
									<div className='border-t border-border px-4 pb-4 pt-3'>
										<div className='flex flex-wrap gap-2'>
											{(prop.values ?? []).map((v: PropertyValue) => (
												<span
													key={v.id}
													className='group flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-foreground'
												>
													{v.value}
													{v.slug && (
														<span className='font-mono text-muted-foreground'>
															({v.slug})
														</span>
													)}
													<button
														onClick={() => {
															if (confirm(`Удалить "${v.value}"?`))
																deleteValueMut.mutate(v.id)
														}}
														className='ml-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive'
													>
														<X className='h-3 w-3' />
													</button>
												</span>
											))}
										</div>

										{addValueFor === prop.id ? (
											<form
												onSubmit={handleAddValue}
												className='mt-3 flex gap-2'
											>
												<input
													placeholder='Значение'
													required
													value={newValue.value}
													onChange={e =>
														setNewValue(v => ({
															...v,
															value: e.target.value,
														}))
													}
													className='h-8 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
												/>
												<input
													placeholder='Slug (авто)'
													value={newValue.slug}
													onChange={e =>
														setNewValue(v => ({
															...v,
															slug: e.target.value,
														}))
													}
													className='h-8 w-36 rounded-lg border border-border bg-background px-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary'
												/>
												<Button size='sm' type='submit'>
													Добавить
												</Button>
												<Button
													size='sm'
													variant='ghost'
													type='button'
													onClick={() =>
														updateSearchParams(
															{ addValue: null },
															{ history: 'replace' },
														)
													}
												>
													<X className='h-4 w-4' />
												</Button>
											</form>
										) : (
											<button
												onClick={() => {
													updateSearchParams(
														{ addValue: prop.id },
														{ history: 'push' },
													)
													setNewValue({ value: '', slug: '' })
												}}
												className='mt-3 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
											>
												<Plus className='h-3 w-3' /> Добавить значение
											</button>
										)}
									</div>
								)}
							</div>
						)
					})}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<Tag className='mb-3 h-10 w-10 text-muted-foreground/30' />
					<p className='text-sm text-muted-foreground'>
						{search ? 'Свойства не найдены' : 'Нет свойств'}
					</p>
				</div>
			)}
		</div>
	)
}

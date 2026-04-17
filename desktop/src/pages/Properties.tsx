import { useEffect, useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Plus, Pencil, Trash2, X, Tag, Hash, Type, ToggleLeft, Calendar, List, Package } from 'lucide-react'

const TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'] as const

const typeConfig: Record<string, { label: string; color: string; icon: typeof Type }> = {
	STRING: { label: 'Строка', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Type },
	NUMBER: { label: 'Число', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Hash },
	BOOLEAN: { label: 'Да/Нет', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: ToggleLeft },
	DATE: { label: 'Дата', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Calendar },
	SELECT: { label: 'Выбор', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: List },
}

export function PropertiesPage() {
	const { data: properties, refetch } = trpc.properties.getAll.useQuery()
	const deleteMut = trpc.properties.delete.useMutation({
		onSuccess: () => refetch(),
	})
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)
	const [search, setSearch] = useState('')

	const filtered = properties?.filter(
		(p: any) =>
			!search ||
			p.name?.toLowerCase().includes(search.toLowerCase()) ||
			p.key?.toLowerCase().includes(search.toLowerCase())
	)

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Свойства
				</h1>
				<Button
					size='sm'
					onClick={() => {
						setEditId(null)
						setShowForm(true)
					}}
				>
					<Plus className='mr-1 h-4 w-4' /> Добавить
				</Button>
			</div>

			{properties && properties.length > 4 && (
				<input
					type='search'
					placeholder='Поиск свойств...'
					value={search}
					onChange={e => setSearch(e.target.value)}
					className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
				/>
			)}

			{showForm && (
				<PropertyFormModal
					editId={editId}
					onClose={() => setShowForm(false)}
					onSuccess={() => {
						setShowForm(false)
						refetch()
					}}
				/>
			)}

			{filtered && filtered.length > 0 ? (
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
					{filtered.map((prop: any) => {
						const tc = typeConfig[prop.type] ?? typeConfig.STRING
						const TypeIcon = tc.icon
						const options = Array.isArray(prop.options) ? (prop.options as string[]) : []
						const productCount = prop._count?.productValues ?? 0

						return (
							<div
								key={prop.id}
								className='group relative flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 transition-colors hover:bg-muted/30'
							>
								{/* Header: Type badge + actions */}
								<div className='flex items-start justify-between'>
									<span
										className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${tc.color}`}
									>
										<TypeIcon className='h-3 w-3' />
										{tc.label}
									</span>
									<div className='flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
										<button
											onClick={() => {
												setEditId(prop.id)
												setShowForm(true)
											}}
											className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
										>
											<Pencil className='h-3.5 w-3.5' />
										</button>
										<button
											onClick={() => {
												if (confirm('Удалить?'))
													deleteMut.mutate(prop.id)
											}}
											className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive'
										>
											<Trash2 className='h-3.5 w-3.5' />
										</button>
									</div>
								</div>

								{/* Name + Key */}
								<div>
									<div className='text-sm font-semibold text-foreground'>
										{prop.name}
									</div>
									<div className='mt-0.5 font-mono text-xs text-muted-foreground'>
										{prop.key}
									</div>
								</div>

								{/* SELECT options preview */}
								{prop.type === 'SELECT' && options.length > 0 && (
									<div className='flex flex-wrap gap-1'>
										{options.slice(0, 5).map((opt: string, i: number) => (
											<span
												key={i}
												className='inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground'
											>
												<Tag className='h-2 w-2 text-muted-foreground' />
												{opt}
											</span>
										))}
										{options.length > 5 && (
											<span className='rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'>
												+{options.length - 5}
											</span>
										)}
									</div>
								)}

								{/* Product count */}
								{productCount > 0 && (
									<div className='mt-auto flex items-center gap-1 text-[11px] text-muted-foreground'>
										<Package className='h-3 w-3' />
										Используется в {productCount} товарах
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

function PropertyFormModal({
	editId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void
}) {
	const createMut = trpc.properties.create.useMutation({ onSuccess })
	const updateMut = trpc.properties.update.useMutation({ onSuccess })
	const { data: editProp } = trpc.properties.getById.useQuery(editId!, {
		enabled: !!editId,
	})

	const emptyForm = useMemo(
		() => ({
			name: '',
			key: '',
			type: 'STRING' as (typeof TYPES)[number],
			optionsText: '',
		}),
		[],
	)

	const [form, setForm] = useState(emptyForm)

	useEffect(() => {
		if (!editId) {
			setForm(emptyForm)
			return
		}
		if (editProp) {
			const options = Array.isArray(editProp.options)
				? (editProp.options as unknown as string[])
				: []
			setForm({
				name: editProp.name ?? '',
				key: editProp.key ?? '',
				type: (editProp.type as (typeof TYPES)[number]) ?? 'STRING',
				optionsText: options.join(', '),
			})
		}
	}, [editId, editProp, emptyForm])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		const options =
			form.type === 'SELECT'
				? form.optionsText
						.split(',')
						.map(s => s.trim())
						.filter(Boolean)
				: null

		if (form.type === 'SELECT' && (!options || options.length === 0)) {
			return
		}

		if (editId)
			updateMut.mutate({
				id: editId,
				name: form.name,
				key: form.key,
				type: form.type as any,
				options,
			})
		else
			createMut.mutate({
				name: form.name,
				key: form.key,
				type: form.type as any,
				options,
			})
	}

	const inputCls =
		'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

	const typeLabels: Record<string, string> = {
		STRING: 'Строка',
		NUMBER: 'Число',
		BOOLEAN: 'Да/Нет',
		DATE: 'Дата',
		SELECT: 'Выбор из списка',
	}

	return (
		<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
			<div className='flex w-full max-w-md flex-col rounded-2xl border border-border bg-card shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-6 py-4'>
					<h2 className='text-lg font-semibold text-foreground'>
						{editId ? 'Редактировать свойство' : 'Новое свойство'}
					</h2>
					<button
						onClick={onClose}
						className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Body */}
				<form
					onSubmit={handleSubmit}
					className='flex-1 overflow-y-auto px-6 py-5 space-y-4'
				>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Название
							</label>
							<input
								value={form.name}
								onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
								required
								placeholder='Цвет'
								className={inputCls}
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Ключ
							</label>
							<input
								value={form.key}
								onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
								required
								placeholder='color'
								className={`${inputCls} font-mono`}
							/>
						</div>
					</div>

					{/* Type selector as buttons */}
					<div>
						<label className='mb-2 block text-xs font-medium text-muted-foreground'>
							Тип значения
						</label>
						<div className='flex flex-wrap gap-1.5'>
							{TYPES.map(t => (
								<button
									key={t}
									type='button'
									onClick={() => setForm(f => ({ ...f, type: t }))}
									className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
										form.type === t
											? 'border-primary bg-primary/10 text-primary'
											: 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
									}`}
								>
									{typeLabels[t]}
								</button>
							))}
						</div>
					</div>

					{form.type === 'SELECT' && (
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>
								Варианты выбора
							</label>
							<input
								value={form.optionsText}
								onChange={e =>
									setForm(f => ({ ...f, optionsText: e.target.value }))
								}
								placeholder='Белый, Чёрный, Золотой'
								className={inputCls}
							/>
							<p className='mt-1.5 text-[11px] text-muted-foreground'>
								Перечислите варианты через запятую
							</p>
							{form.optionsText && (
								<div className='mt-2 flex flex-wrap gap-1.5'>
									{form.optionsText
										.split(',')
										.map(s => s.trim())
										.filter(Boolean)
										.map((opt, i) => (
											<span
												key={i}
												className='inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground'
											>
												<Tag className='h-2.5 w-2.5 text-muted-foreground' />
												{opt}
											</span>
										))}
								</div>
							)}
						</div>
					)}
				</form>

				{/* Footer */}
				<div className='flex justify-end gap-2 border-t border-border px-6 py-4'>
					<Button variant='ghost' type='button' onClick={onClose}>
						Отмена
					</Button>
					<Button
						type='submit'
						disabled={createMut.isPending || updateMut.isPending}
						onClick={handleSubmit}
					>
						{editId ? 'Сохранить' : 'Создать'}
					</Button>
				</div>
			</div>
		</div>
	)
}

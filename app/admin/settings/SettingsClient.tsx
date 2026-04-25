'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { Plus, Pencil, Trash2, X, Settings } from 'lucide-react'

type SettingItem = RouterOutputs['setting']['getAll'][number]

const inputCls =
	'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
	const map = new Map<string, T[]>()
	for (const item of arr) {
		const k = key(item)
		if (!map.has(k)) map.set(k, [])
		map.get(k)!.push(item)
	}
	return map
}

function valueToString(v: unknown): string {
	if (v === null || v === undefined) return ''
	if (typeof v === 'object') return JSON.stringify(v)
	return String(v)
}

export default function SettingsClient() {
	const { data: settings, refetch } = trpc.setting.getAll.useQuery()
	const upsertMut = trpc.setting.upsert.useMutation({ onSuccess: () => { refetch(); setShowForm(false) } })
	const deleteMut = trpc.setting.delete.useMutation({ onSuccess: () => refetch() })

	const [showForm, setShowForm] = useState(false)
	const [editItem, setEditItem] = useState<SettingItem | null>(null)
	const [form, setForm] = useState({
		key: '',
		value: '',
		type: 'string',
		group: '',
		description: '',
		isPublic: false,
	})

	function openCreate() {
		setEditItem(null)
		setForm({ key: '', value: '', type: 'string', group: '', description: '', isPublic: false })
		setShowForm(true)
	}

	function openEdit(s: SettingItem) {
		setEditItem(s)
		setForm({
			key: s.key,
			value: valueToString(s.value),
			type: s.type ?? 'string',
			group: s.group ?? '',
			description: s.description ?? '',
			isPublic: s.isPublic ?? false,
		})
		setShowForm(true)
	}

	function parseValue(raw: string, type: string): unknown {
		if (type === 'number') return Number(raw)
		if (type === 'boolean') return raw === 'true'
		if (type === 'json') {
			try { return JSON.parse(raw) } catch { return raw }
		}
		return raw
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		upsertMut.mutate({
			key: form.key,
			value: parseValue(form.value, form.type),
			type: form.type,
			group: form.group || undefined,
			description: form.description || undefined,
			isPublic: form.isPublic,
		})
	}

	const grouped = groupBy(settings ?? [], s => s.group ?? 'Без группы')

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Настройки
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
							{editItem ? 'Редактировать настройку' : 'Новая настройка'}
						</h2>
						<button onClick={() => setShowForm(false)} className='text-muted-foreground hover:text-foreground'>
							<X className='h-4 w-4' />
						</button>
					</div>
					<form onSubmit={handleSubmit} className='grid gap-4 sm:grid-cols-2'>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>Ключ</label>
							<input
								required
								value={form.key}
								onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
								placeholder='site_name'
								disabled={!!editItem}
								className={`${inputCls} font-mono`}
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>Тип</label>
							<select
								value={form.type}
								onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
								className={inputCls}
							>
								<option value='string'>string</option>
								<option value='number'>number</option>
								<option value='boolean'>boolean</option>
								<option value='json'>json</option>
							</select>
						</div>
						<div className='sm:col-span-2'>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>Значение</label>
							{form.type === 'boolean' ? (
								<select
									value={form.value}
									onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
									className={inputCls}
								>
									<option value='true'>true</option>
									<option value='false'>false</option>
								</select>
							) : form.type === 'json' ? (
								<textarea
									value={form.value}
									onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
									placeholder='{}'
									rows={4}
									className='flex w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
								/>
							) : (
								<input
									value={form.value}
									onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
									placeholder='Значение'
									type={form.type === 'number' ? 'number' : 'text'}
									className={inputCls}
								/>
							)}
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>Группа</label>
							<input
								value={form.group}
								onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
								placeholder='general'
								className={inputCls}
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-muted-foreground'>Описание</label>
							<input
								value={form.description}
								onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
								placeholder='Необязательное описание'
								className={inputCls}
							/>
						</div>
						<div className='flex items-center gap-2 sm:col-span-2'>
							<input
								type='checkbox'
								id='isPublic'
								checked={form.isPublic}
								onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))}
								className='h-4 w-4 rounded border-border accent-primary'
							/>
							<label htmlFor='isPublic' className='text-sm text-foreground'>
								Публичная (доступна без авторизации)
							</label>
						</div>
						<div className='flex gap-2 sm:col-span-2'>
							<Button variant='primary' type='submit' size='sm' disabled={upsertMut.isPending}>
								{editItem ? 'Сохранить' : 'Создать'}
							</Button>
							<Button variant='ghost' type='button' size='sm' onClick={() => setShowForm(false)}>
								Отмена
							</Button>
						</div>
					</form>
				</div>
			)}

			{/* Settings grouped */}
			{settings && settings.length > 0 ? (
				<div className='space-y-6'>
					{Array.from(grouped.entries()).map(([group, items]) => (
						<div key={group}>
							<h2 className='mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
								{group}
							</h2>
							<div className='flex flex-col divide-y divide-border/50 rounded-xl border border-border bg-card overflow-hidden'>
								{items.map((s: SettingItem) => (
									<div key={s.key} className='flex items-center gap-4 px-4 py-3'>
										<div className='min-w-0 flex-1'>
											<div className='flex items-center gap-2 flex-wrap'>
												<span className='font-mono text-sm text-foreground'>{s.key}</span>
												<span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
													{s.type ?? 'string'}
												</span>
												{s.isPublic && (
													<span className='rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400'>
														public
													</span>
												)}
											</div>
											{s.description && (
												<p className='mt-0.5 text-xs text-muted-foreground'>{s.description}</p>
											)}
											<p className='mt-1 truncate font-mono text-xs text-muted-foreground'>
												{valueToString(s.value).slice(0, 120)}
											</p>
										</div>
										<div className='flex shrink-0 gap-1'>
											<button
												onClick={() => openEdit(s)}
												className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
											>
												<Pencil className='h-3.5 w-3.5' />
											</button>
											<button
												onClick={() => {
													if (confirm(`Удалить настройку "${s.key}"?`)) {
														deleteMut.mutate(s.key)
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
						</div>
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<Settings className='mb-3 h-10 w-10 text-muted-foreground/30' />
					<p className='text-sm text-muted-foreground'>Нет настроек</p>
				</div>
			)}
		</div>
	)
}

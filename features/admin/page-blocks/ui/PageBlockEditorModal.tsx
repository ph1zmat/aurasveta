'use client'

import { useState, useEffect, type LabelHTMLAttributes } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
	PAGE_BLOCK_META,
	HeadingBlockConfigSchema,
	ParagraphBlockConfigSchema,
	TableBlockConfigSchema,
	ImageBlockConfigSchema,
	LinkBlockConfigSchema,
	IconLinkBlockConfigSchema,
	type PageBlockDraft,
} from '@/shared/types/page-builder'

interface Props {
	draft: PageBlockDraft
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (updated: PageBlockDraft) => void
}

function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
	return <label className={`text-sm font-medium ${className}`.trim()} {...props} />
}

// ── Lucide token список для icon-link ──────────────────────────────────────

const LUCIDE_TOKENS = [
	'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
	'Star', 'Heart', 'Zap', 'Shield', 'CheckCircle', 'Info',
	'Phone', 'Mail', 'MapPin', 'Clock', 'Calendar', 'User',
	'Truck', 'Package', 'ShoppingCart', 'Gift', 'Tag',
	'Link', 'ExternalLink', 'Download', 'Upload', 'Share2',
	'Settings', 'HelpCircle', 'AlertCircle', 'XCircle',
	'Home', 'Building2', 'Lightbulb', 'Sparkles',
]

// ── Редакторы по типу блока ────────────────────────────────────────────────

function HeadingEditor({
	config,
	onChange,
}: {
	config: Record<string, unknown>
	onChange: (c: Record<string, unknown>) => void
}) {
	return (
		<div className='space-y-4'>
			<div className='space-y-2'>
				<Label>Текст заголовка *</Label>
				<Input
					value={typeof config.text === 'string' ? config.text : ''}
					onChange={e => onChange({ ...config, text: e.target.value })}
					placeholder='Введите заголовок'
				/>
			</div>
			<div className='space-y-2'>
				<Label>Уровень</Label>
				<Select
					value={typeof config.level === 'string' ? config.level : 'h2'}
					onValueChange={v => onChange({ ...config, level: v })}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{(['h1', 'h2', 'h3', 'h4'] as const).map(l => (
							<SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}

function ParagraphEditor({
	config,
	onChange,
}: {
	config: Record<string, unknown>
	onChange: (c: Record<string, unknown>) => void
}) {
	return (
		<div className='space-y-2'>
			<Label>Текст *</Label>
			<textarea
				className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[140px] resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
				value={typeof config.text === 'string' ? config.text : ''}
				onChange={e => onChange({ ...config, text: e.target.value })}
				placeholder='Введите текст абзаца'
			/>
		</div>
	)
}

function TableEditor({
	config,
	onChange,
}: {
	config: Record<string, unknown>
	onChange: (c: Record<string, unknown>) => void
}) {
	const columns = Array.isArray(config.columns)
		? (config.columns as Array<{ key: string; label: string }>)
		: [{ key: 'col1', label: 'Колонка 1' }]
	const rows = Array.isArray(config.rows)
		? (config.rows as string[][])
		: [['']]

	function updateColumn(idx: number, label: string) {
		const next = columns.map((c, i) => (i === idx ? { ...c, label } : c))
		onChange({ ...config, columns: next })
	}

	function addColumn() {
		const key = `col${Date.now()}`
		const next = [...columns, { key, label: `Колонка ${columns.length + 1}` }]
		const nextRows = rows.map(row => [...row, ''])
		onChange({ ...config, columns: next, rows: nextRows })
	}

	function removeColumn(idx: number) {
		if (columns.length <= 1) return
		const next = columns.filter((_, i) => i !== idx)
		const nextRows = rows.map(row => row.filter((_, i) => i !== idx))
		onChange({ ...config, columns: next, rows: nextRows })
	}

	function updateCell(rowIdx: number, colIdx: number, val: string) {
		const nextRows = rows.map((row, ri) =>
			ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? val : cell)) : row,
		)
		onChange({ ...config, rows: nextRows })
	}

	function addRow() {
		onChange({ ...config, rows: [...rows, columns.map(() => '')] })
	}

	function removeRow(idx: number) {
		if (rows.length <= 1) return
		onChange({ ...config, rows: rows.filter((_, i) => i !== idx) })
	}

	return (
		<div className='space-y-4'>
			<div className='space-y-2'>
				<Label>Подпись таблицы</Label>
				<Input
					value={typeof config.caption === 'string' ? config.caption : ''}
					onChange={e => onChange({ ...config, caption: e.target.value })}
					placeholder='Необязательно'
				/>
			</div>

			<div className='space-y-2'>
				<div className='flex items-center justify-between'>
					<Label>Колонки *</Label>
					<Button type='button' variant='outline' size='sm' onClick={addColumn}>
						+ Колонка
					</Button>
				</div>
				<div className='flex flex-wrap gap-2'>
					{columns.map((col, i) => (
						<div key={col.key} className='flex items-center gap-1'>
							<Input
								className='w-32'
								value={col.label}
								onChange={e => updateColumn(i, e.target.value)}
								placeholder={`Колонка ${i + 1}`}
							/>
							{columns.length > 1 ? (
								<Button
									type='button'
									variant='ghost'
									size='sm'
									className='text-destructive'
									onClick={() => removeColumn(i)}
								>
									×
								</Button>
							) : null}
						</div>
					))}
				</div>
			</div>

			<div className='space-y-2'>
				<div className='flex items-center justify-between'>
					<Label>Строки *</Label>
					<Button type='button' variant='outline' size='sm' onClick={addRow}>
						+ Строка
					</Button>
				</div>
				<div className='overflow-x-auto'>
					<table className='min-w-full text-sm'>
						<thead>
							<tr>
								{columns.map(col => (
									<th key={col.key} className='border border-border bg-muted px-2 py-1 text-left font-medium'>
										{col.label}
									</th>
								))}
								<th className='border border-border bg-muted px-2 py-1 w-8' />
							</tr>
						</thead>
						<tbody>
							{rows.map((row, ri) => (
								<tr key={ri}>
									{columns.map((col, ci) => (
										<td key={col.key} className='border border-border p-0.5'>
											<Input
												className='h-7 border-0 bg-transparent text-xs focus-visible:ring-0'
												value={row[ci] ?? ''}
												onChange={e => updateCell(ri, ci, e.target.value)}
											/>
										</td>
									))}
									<td className='border border-border px-1 text-center'>
										{rows.length > 1 ? (
											<Button
												type='button'
												variant='ghost'
												size='sm'
												className='h-6 w-6 p-0 text-destructive'
												onClick={() => removeRow(ri)}
											>
												×
											</Button>
										) : null}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

function ImageEditor({
	config,
	onChange,
}: {
	config: Record<string, unknown>
	onChange: (c: Record<string, unknown>) => void
}) {
	return (
		<div className='space-y-4'>
			<div className='space-y-2'>
				<Label>Storage Key (путь к файлу) *</Label>
				<Input
					value={typeof config.storageKey === 'string' ? config.storageKey : ''}
					onChange={e => onChange({ ...config, storageKey: e.target.value })}
					placeholder='images/example.jpg'
				/>
				<p className='text-xs text-muted-foreground'>
					Скопируйте ключ из загруженного файла в хранилище
				</p>
			</div>
			<div className='space-y-2'>
				<Label>Alt текст</Label>
				<Input
					value={typeof config.alt === 'string' ? config.alt : ''}
					onChange={e => onChange({ ...config, alt: e.target.value })}
					placeholder='Описание изображения'
				/>
			</div>
			<div className='space-y-2'>
				<Label>Подпись</Label>
				<Input
					value={typeof config.caption === 'string' ? config.caption : ''}
					onChange={e => onChange({ ...config, caption: e.target.value })}
					placeholder='Необязательно'
				/>
			</div>
			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-2'>
					<Label>Выравнивание</Label>
					<Select
						value={typeof config.alignment === 'string' ? config.alignment : 'center'}
						onValueChange={v => onChange({ ...config, alignment: v })}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='left'>Слева</SelectItem>
							<SelectItem value='center'>По центру</SelectItem>
							<SelectItem value='right'>Справа</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className='space-y-2'>
					<Label>Ширина</Label>
					<Select
						value={typeof config.widthMode === 'string' ? config.widthMode : 'normal'}
						onValueChange={v => onChange({ ...config, widthMode: v })}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='narrow'>Узкая</SelectItem>
							<SelectItem value='normal'>Нормальная</SelectItem>
							<SelectItem value='wide'>Широкая</SelectItem>
							<SelectItem value='full'>Во всю ширину</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	)
}

function LinkEditor({
	config,
	onChange,
}: {
	config: Record<string, unknown>
	onChange: (c: Record<string, unknown>) => void
}) {
	return (
		<div className='space-y-4'>
			<div className='space-y-2'>
				<Label>Текст ссылки *</Label>
				<Input
					value={typeof config.label === 'string' ? config.label : ''}
					onChange={e => onChange({ ...config, label: e.target.value })}
					placeholder='Нажмите здесь'
				/>
			</div>
			<div className='space-y-2'>
				<Label>URL *</Label>
				<Input
					value={typeof config.href === 'string' ? config.href : ''}
					onChange={e => onChange({ ...config, href: e.target.value })}
					placeholder='/catalog или https://example.com'
				/>
			</div>
			<div className='flex items-center gap-2'>
				<Switch
					id='link-external'
					checked={config.isExternal === true}
					onCheckedChange={v => onChange({ ...config, isExternal: v })}
				/>
				<Label htmlFor='link-external'>Открывать в новой вкладке</Label>
			</div>
		</div>
	)
}

function IconLinkEditor({
	config,
	onChange,
}: {
	config: Record<string, unknown>
	onChange: (c: Record<string, unknown>) => void
}) {
	return (
		<div className='space-y-4'>
			<div className='space-y-2'>
				<Label>Текст *</Label>
				<Input
					value={typeof config.label === 'string' ? config.label : ''}
					onChange={e => onChange({ ...config, label: e.target.value })}
					placeholder='Заголовок ссылки'
				/>
			</div>
			<div className='space-y-2'>
				<Label>URL *</Label>
				<Input
					value={typeof config.href === 'string' ? config.href : ''}
					onChange={e => onChange({ ...config, href: e.target.value })}
					placeholder='/catalog или https://example.com'
				/>
			</div>
			<div className='space-y-2'>
				<Label>Иконка (Lucide token) *</Label>
				<Select
					value={typeof config.icon === 'string' ? config.icon : 'ArrowRight'}
					onValueChange={v => onChange({ ...config, icon: v })}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent className='max-h-60'>
						{LUCIDE_TOKENS.map(token => (
							<SelectItem key={token} value={token}>{token}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className='space-y-2'>
				<Label>Описание</Label>
				<Input
					value={typeof config.description === 'string' ? config.description : ''}
					onChange={e => onChange({ ...config, description: e.target.value })}
					placeholder='Необязательная подпись'
				/>
			</div>
			<div className='flex items-center gap-2'>
				<Switch
					id='icon-link-external'
					checked={config.isExternal === true}
					onCheckedChange={v => onChange({ ...config, isExternal: v })}
				/>
				<Label htmlFor='icon-link-external'>Открывать в новой вкладке</Label>
			</div>
		</div>
	)
}

// ── Главная модалка ────────────────────────────────────────────────────────

export default function PageBlockEditorModal({ draft, open, onOpenChange, onSubmit }: Props) {
	const [config, setConfig] = useState<Record<string, unknown>>(draft.config)
	const [isActive, setIsActive] = useState(draft.isActive)

	useEffect(() => {
		setConfig(draft.config)
		setIsActive(draft.isActive)
	}, [draft])

	const meta = PAGE_BLOCK_META[draft.type]

	function handleSave() {
		// Валидация по схеме
		let result: { success: boolean; error?: { issues: Array<{ message: string }> } }
		switch (draft.type) {
			case 'heading':
				result = HeadingBlockConfigSchema.safeParse(config)
				break
			case 'paragraph':
				result = ParagraphBlockConfigSchema.safeParse(config)
				break
			case 'table':
				result = TableBlockConfigSchema.safeParse(config)
				break
			case 'image':
				result = ImageBlockConfigSchema.safeParse(config)
				break
			case 'link':
				result = LinkBlockConfigSchema.safeParse(config)
				break
			case 'icon-link':
				result = IconLinkBlockConfigSchema.safeParse(config)
				break
			default:
				result = { success: true }
		}

		if (!result.success && result.error) {
			toast.error(result.error.issues[0]?.message ?? 'Проверьте заполненные поля')
			return
		}

		onSubmit({ ...draft, config, isActive })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>{meta.label}</DialogTitle>
				</DialogHeader>

				<div className='space-y-6 py-2'>
					{/* Редактор конфига по типу */}
					{draft.type === 'heading' && (
						<HeadingEditor config={config} onChange={setConfig} />
					)}
					{draft.type === 'paragraph' && (
						<ParagraphEditor config={config} onChange={setConfig} />
					)}
					{draft.type === 'table' && (
						<TableEditor config={config} onChange={setConfig} />
					)}
					{draft.type === 'image' && (
						<ImageEditor config={config} onChange={setConfig} />
					)}
					{draft.type === 'link' && (
						<LinkEditor config={config} onChange={setConfig} />
					)}
					{draft.type === 'icon-link' && (
						<IconLinkEditor config={config} onChange={setConfig} />
					)}

					{/* Переключатель видимости */}
					<div className='flex items-center gap-2 border-t border-border pt-4'>
						<Switch
							id='block-active'
							checked={isActive}
							onCheckedChange={setIsActive}
						/>
						<Label htmlFor='block-active'>Блок активен (виден на сайте)</Label>
					</div>
				</div>

				<DialogFooter>
					<Button variant='ghost' onClick={() => onOpenChange(false)}>
						Отмена
					</Button>
					<Button onClick={handleSave}>Сохранить</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

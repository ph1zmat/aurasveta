'use client'

import { useState, useMemo } from 'react'
import { X, Plus, Trash2, GripVertical, Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { MediaPicker } from '@aurasveta/shared-admin'
import { trpc } from '@/lib/trpc/client'

// ─── Helpers ────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
	return <label className='block text-xs font-medium text-muted-foreground mb-1'>{children}</label>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div>
			<Label>{label}</Label>
			{children}
		</div>
	)
}

function SelectInput({
	value,
	options,
	onChange,
}: {
	value: string
	options: { label: string; value: string }[]
	onChange: (v: string) => void
}) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
		>
			{options.map((o) => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	)
}

function NumberInput({
	value,
	onChange,
	min,
	max,
	placeholder,
}: {
	value: number | undefined
	onChange: (v: number) => void
	min?: number
	max?: number
	placeholder?: string
}) {
	return (
		<Input
			type='number'
			value={value ?? ''}
			onChange={(e) => onChange(Number(e.target.value))}
			min={min}
			max={max}
			placeholder={placeholder}
		/>
	)
}

// ─── CategoryMultiSelect ─────────────────────────────────────────────────────

function CategoryMultiSelect({
	value,
	onChange,
}: {
	value: string[]
	onChange: (ids: string[]) => void
}) {
	const [search, setSearch] = useState('')
	const { data: categories = [], isLoading } = trpc.categories.getAll.useQuery()

	const flat = useMemo(() => {
		const result: { id: string; name: string; parentId?: string | null }[] = []
		for (const cat of categories) {
			result.push({ id: cat.id, name: cat.name, parentId: cat.parentId })
			for (const child of cat.children ?? []) {
				result.push({ id: child.id, name: `  └ ${child.name}`, parentId: child.parentId })
			}
		}
		return result
	}, [categories])

	const filtered = flat.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

	const toggle = (id: string) => {
		onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
	}

	return (
		<div className='border border-border rounded-md overflow-hidden'>
			<div className='flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30'>
				<Search className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
				<input
					type='text'
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder='Поиск категорий...'
					className='flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
				/>
			</div>
			<div className='max-h-[200px] overflow-y-auto'>
				{isLoading && <div className='text-xs text-muted-foreground text-center py-4'>Загрузка...</div>}
				{!isLoading && filtered.length === 0 && (
					<div className='text-xs text-muted-foreground text-center py-4'>Нет категорий</div>
				)}
				{filtered.map(cat => (
					<button
						key={cat.id}
						type='button'
						onClick={() => toggle(cat.id)}
						className='flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent/30 transition-colors'
					>
						<span className={`flex h-4 w-4 shrink-0 rounded border items-center justify-center transition-colors ${value.includes(cat.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
							{value.includes(cat.id) && <Check className='h-3 w-3' />}
						</span>
						<span>{cat.name}</span>
					</button>
				))}
			</div>
			{value.length > 0 && (
				<div className='px-3 py-2 border-t border-border bg-muted/20 flex flex-wrap gap-1'>
					{value.map(id => {
						const cat = flat.find(c => c.id === id)
						if (!cat) return null
						return (
							<span key={id} className='inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5'>
								{cat.name.trim()}
								<button type='button' onClick={() => toggle(id)} className='hover:text-destructive'>×</button>
							</span>
						)
					})}
				</div>
			)}
		</div>
	)
}

// ─── ProductMultiSelect ───────────────────────────────────────────────────────

function ProductMultiSelect({
	value,
	onChange,
}: {
	value: string[]
	onChange: (ids: string[]) => void
}) {
	const [search, setSearch] = useState('')
	const { data: result, isLoading } = trpc.products.getMany.useQuery(
		{ search: search || undefined, limit: 20, page: 1 },
		{ placeholderData: prev => prev },
	)
	const products = result?.items ?? []

	const toggle = (id: string) => {
		onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
	}

	return (
		<div className='border border-border rounded-md overflow-hidden'>
			<div className='flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30'>
				<Search className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
				<input
					type='text'
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder='Поиск товаров...'
					className='flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
				/>
			</div>
			<div className='max-h-[200px] overflow-y-auto'>
				{isLoading && <div className='text-xs text-muted-foreground text-center py-4'>Загрузка...</div>}
				{!isLoading && products.length === 0 && (
					<div className='text-xs text-muted-foreground text-center py-4'>Нет товаров</div>
				)}
				{products.map(p => (
					<button
						key={p.id}
						type='button'
						onClick={() => toggle(p.id)}
						className='flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent/30 transition-colors'
					>
						<span className={`flex h-4 w-4 shrink-0 rounded border items-center justify-center transition-colors ${value.includes(p.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
							{value.includes(p.id) && <Check className='h-3 w-3' />}
						</span>
						<span className='flex-1 truncate'>{p.name}</span>
						{p.price != null && (
							<span className='text-xs text-muted-foreground shrink-0'>{p.price} ₽</span>
						)}
					</button>
				))}
			</div>
			{value.length > 0 && (
				<div className='px-3 py-2 border-t border-border bg-muted/20'>
					<span className='text-xs text-muted-foreground'>Выбрано: {value.length} товаров</span>
				</div>
			)}
		</div>
	)
}

// ─── Banner form ─────────────────────────────────────────────────────────────

interface BannerSlide {
	title?: string
	subtitle?: string
	cta?: string
	href?: string
	/** Storage key or external URL (legacy) */
	imageKey?: string
	imageUrl?: string
	/** Responsive image storage keys */
	src_1300?: string
	src_992?: string
	src_768?: string
	src_375?: string
	bg?: string
}

interface BannerConfig {
	slides?: BannerSlide[]
	autoPlay?: boolean
	autoPlayInterval?: number
}

function BannerForm({
	config,
	onChange,
}: {
	config: BannerConfig
	onChange: (c: BannerConfig) => void
}) {
	const slides = config.slides ?? []

	const updateSlide = (i: number, patch: Partial<BannerSlide>) => {
		const next = slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
		onChange({ ...config, slides: next })
	}

	const addSlide = () => onChange({ ...config, slides: [...slides, {}] })

	const removeSlide = (i: number) =>
		onChange({ ...config, slides: slides.filter((_, idx) => idx !== i) })

	return (
		<div className='space-y-5'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium'>Слайды ({slides.length})</span>
				<Button variant='ghost' size='sm' onClick={addSlide}>
					<Plus className='h-3.5 w-3.5 mr-1' />
					Добавить слайд
				</Button>
			</div>

			{slides.map((slide, i) => (
				<div key={i} className='border border-border rounded-lg p-4 space-y-3'>
					<div className='flex items-center justify-between'>
						<span className='text-xs font-medium text-muted-foreground uppercase'>Слайд {i + 1}</span>
						<Button
							variant='ghost'
							size='icon'
							className='h-6 w-6 text-destructive hover:text-destructive'
							onClick={() => removeSlide(i)}
						>
							<Trash2 className='h-3 w-3' />
						</Button>
					</div>
					<Field label='Заголовок'>
						<Input value={slide.title ?? ''} onChange={(e) => updateSlide(i, { title: e.target.value })} placeholder='Заголовок слайда' />
					</Field>
					<Field label='Подзаголовок'>
						<Input value={slide.subtitle ?? ''} onChange={(e) => updateSlide(i, { subtitle: e.target.value })} placeholder='Текст подзаголовка' />
					</Field>
					<div className='grid grid-cols-2 gap-3'>
						<Field label='Кнопка CTA'>
							<Input value={slide.cta ?? ''} onChange={(e) => updateSlide(i, { cta: e.target.value })} placeholder='Текст кнопки' />
						</Field>
						<Field label='Ссылка'>
							<Input value={slide.href ?? ''} onChange={(e) => updateSlide(i, { href: e.target.value })} placeholder='/catalog' />
						</Field>
					</div>

					<div className='space-y-3 pt-1'>
						<p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Изображения (по ширине экрана)</p>
						<div className='grid grid-cols-2 gap-3'>
							<div>
								<Label>≥1300px (десктоп)</Label>
								<MediaPicker
									label='≥1300px'
									hideLabel
									compact
									aspectRatio='landscape'
									value={slide.src_1300 ?? slide.imageKey ?? slide.imageUrl ?? null}
									onChange={(key) => updateSlide(i, { src_1300: key ?? undefined })}
								/>
							</div>
							<div>
								<Label>≥992px (ноутбук)</Label>
								<MediaPicker
									label='≥992px'
									hideLabel
									compact
									aspectRatio='landscape'
									value={slide.src_992 ?? null}
									onChange={(key) => updateSlide(i, { src_992: key ?? undefined })}
								/>
							</div>
							<div>
								<Label>≥768px (планшет)</Label>
								<MediaPicker
									label='≥768px'
									hideLabel
									compact
									aspectRatio='landscape'
									value={slide.src_768 ?? null}
									onChange={(key) => updateSlide(i, { src_768: key ?? undefined })}
								/>
							</div>
							<div>
								<Label>≥375px (мобильный)</Label>
								<MediaPicker
									label='≥375px'
									hideLabel
									compact
									aspectRatio='portrait'
									value={slide.src_375 ?? null}
									onChange={(key) => updateSlide(i, { src_375: key ?? undefined })}
								/>
							</div>
						</div>
					</div>
				</div>
			))}

			<div className='grid grid-cols-2 gap-3'>
				<div className='flex items-center gap-2'>
					<Switch
						checked={config.autoPlay ?? false}
						onCheckedChange={(v) => onChange({ ...config, autoPlay: v })}
					/>
					<Label>Автопрокрутка</Label>
				</div>
				{config.autoPlay && (
					<Field label='Интервал (мс)'>
						<NumberInput
							value={config.autoPlayInterval}
							onChange={(v) => onChange({ ...config, autoPlayInterval: v })}
							min={500}
							placeholder='4000'
						/>
					</Field>
				)}
			</div>
		</div>
	)
}

// ─── ProductGrid form ────────────────────────────────────────────────────────

interface ProductGridConfig {
	source?: string
	propertyValueId?: string
	categoryId?: string
	productIds?: string[]
	limit?: number
	sortBy?: string
	viewAllHref?: string
	viewAllLabel?: string
	cols?: number
	show_price?: boolean
	show_discount?: boolean
}

function ProductGridForm({
	config,
	onChange,
}: {
	config: ProductGridConfig
	onChange: (c: ProductGridConfig) => void
}) {
	const source = config.source ?? 'promotion'
	return (
		<div className='space-y-4'>
			<Field label='Источник товаров'>
				<SelectInput
					value={source}
					options={[
						{ value: 'promotion', label: 'Акции и скидки' },
						{ value: 'novelty', label: 'Новинки' },
						{ value: 'popular', label: 'Популярные' },
						{ value: 'category', label: 'По категории' },
						{ value: 'manual', label: 'Вручную (выбрать товары)' },
					]}
					onChange={(v) => onChange({ ...config, source: v })}
				/>
			</Field>

			{source === 'category' && (
				<Field label='Категория'>
					<CategoryMultiSelect
						value={config.categoryId ? [config.categoryId] : []}
						onChange={(ids) => onChange({ ...config, categoryId: ids[0] ?? undefined })}
					/>
				</Field>
			)}

			{source === 'manual' && (
				<Field label='Товары'>
					<ProductMultiSelect
						value={config.productIds ?? []}
						onChange={(ids) => onChange({ ...config, productIds: ids })}
					/>
				</Field>
			)}

			<div className='grid grid-cols-2 gap-3'>
				<Field label='Максимум товаров'>
					<NumberInput
						value={config.limit}
						onChange={(v) => onChange({ ...config, limit: v })}
						min={1}
						max={48}
						placeholder='8'
					/>
				</Field>
				<Field label='Колонки'>
					<SelectInput
						value={String(config.cols ?? 4)}
						options={[
							{ value: '2', label: '2 колонки' },
							{ value: '3', label: '3 колонки' },
							{ value: '4', label: '4 колонки' },
							{ value: '6', label: '6 колонок' },
						]}
						onChange={(v) => onChange({ ...config, cols: Number(v) })}
					/>
				</Field>
			</div>

			<Field label='Сортировка'>
				<SelectInput
					value={config.sortBy ?? 'newest'}
					options={[
						{ value: 'newest', label: 'Новинки' },
						{ value: 'price_asc', label: 'Цена: по возрастанию' },
						{ value: 'price_desc', label: 'Цена: по убыванию' },
						{ value: 'popular', label: 'Популярные' },
					]}
					onChange={(v) => onChange({ ...config, sortBy: v })}
				/>
			</Field>

			<div className='flex gap-4'>
				<div className='flex items-center gap-2'>
					<Switch
						checked={config.show_price ?? true}
						onCheckedChange={(v) => onChange({ ...config, show_price: v })}
					/>
					<Label>Показывать цену</Label>
				</div>
				<div className='flex items-center gap-2'>
					<Switch
						checked={config.show_discount ?? true}
						onCheckedChange={(v) => onChange({ ...config, show_discount: v })}
					/>
					<Label>Показывать скидку</Label>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-3'>
				<Field label='Текст кнопки "Все товары"'>
					<Input
						value={config.viewAllLabel ?? ''}
						onChange={(e) => onChange({ ...config, viewAllLabel: e.target.value })}
						placeholder='Смотреть все'
					/>
				</Field>
				<Field label='Ссылка кнопки'>
					<Input
						value={config.viewAllHref ?? ''}
						onChange={(e) => onChange({ ...config, viewAllHref: e.target.value })}
						placeholder='/catalog'
					/>
				</Field>
			</div>
		</div>
	)
}

// ─── BrandCarousel form ───────────────────────────────────────────────────────

interface BrandCarouselConfig {
	propertySlug?: string
	viewAllHref?: string
	viewAllLabel?: string
	autoplay?: boolean
	autoplay_interval?: number
	visible_count?: number
}

function BrandCarouselForm({
	config,
	onChange,
}: {
	config: BrandCarouselConfig
	onChange: (c: BrandCarouselConfig) => void
}) {
	return (
		<div className='space-y-4'>
			<Field label='Слаг свойства (бренд)'>
				<Input
					value={config.propertySlug ?? 'brand'}
					onChange={(e) => onChange({ ...config, propertySlug: e.target.value })}
					placeholder='brand'
				/>
			</Field>

			<div className='grid grid-cols-2 gap-3'>
				<Field label='Ссылка "Все бренды"'>
					<Input
						value={config.viewAllHref ?? ''}
						onChange={(e) => onChange({ ...config, viewAllHref: e.target.value })}
						placeholder='/catalog?brand=all'
					/>
				</Field>
				<Field label='Текст кнопки'>
					<Input
						value={config.viewAllLabel ?? ''}
						onChange={(e) => onChange({ ...config, viewAllLabel: e.target.value })}
						placeholder='Все бренды'
					/>
				</Field>
			</div>

			<div className='grid grid-cols-2 gap-3'>
				<Field label='Видимых брендов'>
					<SelectInput
						value={String(config.visible_count ?? 6)}
						options={[
							{ value: '4', label: '4' },
							{ value: '6', label: '6' },
							{ value: '8', label: '8' },
						]}
						onChange={(v) => onChange({ ...config, visible_count: Number(v) })}
					/>
				</Field>
			</div>

			<div className='flex items-center gap-4'>
				<div className='flex items-center gap-2'>
					<Switch
						checked={config.autoplay ?? false}
						onCheckedChange={(v) => onChange({ ...config, autoplay: v })}
					/>
					<Label>Автопрокрутка</Label>
				</div>
				{config.autoplay && (
					<Field label='Интервал (сек)'>
						<NumberInput
							value={config.autoplay_interval}
							onChange={(v) => onChange({ ...config, autoplay_interval: v })}
							min={1}
							max={30}
							placeholder='4'
						/>
					</Field>
				)}
			</div>
		</div>
	)
}

// ─── CategoryCarousel form ────────────────────────────────────────────────────

interface CategoryCarouselConfig {
	parentId?: string
	categories?: string[]
	limit?: number
	orderBy?: string
	columns?: number
	show_names?: boolean
	use_category_images?: boolean
}

function CategoryCarouselForm({
	config,
	onChange,
}: {
	config: CategoryCarouselConfig
	onChange: (c: CategoryCarouselConfig) => void
}) {
	return (
		<div className='space-y-4'>
			<Field label='Категории (выбрать вручную)'>
				<CategoryMultiSelect
					value={config.categories ?? []}
					onChange={(ids) => onChange({ ...config, categories: ids })}
				/>
			</Field>

			{(!config.categories || config.categories.length === 0) && (
				<Field label='Или: ID родительской категории (загрузить дочерние)'>
					<Input
						value={config.parentId ?? ''}
						onChange={(e) => onChange({ ...config, parentId: e.target.value || undefined })}
						placeholder='Оставьте пустым для корневых категорий'
					/>
				</Field>
			)}

			<div className='grid grid-cols-2 gap-3'>
				<Field label='Максимум категорий'>
					<NumberInput
						value={config.limit}
						onChange={(v) => onChange({ ...config, limit: v })}
						min={1}
						max={48}
						placeholder='12'
					/>
				</Field>
				<Field label='Колонки'>
					<SelectInput
						value={String(config.columns ?? 4)}
						options={[
							{ value: '3', label: '3 колонки' },
							{ value: '4', label: '4 колонки' },
							{ value: '6', label: '6 колонок' },
						]}
						onChange={(v) => onChange({ ...config, columns: Number(v) })}
					/>
				</Field>
			</div>

			<Field label='Сортировка'>
				<SelectInput
					value={config.orderBy ?? 'name'}
					options={[
						{ value: 'name', label: 'По названию' },
						{ value: 'createdAt', label: 'По дате' },
					]}
					onChange={(v) => onChange({ ...config, orderBy: v })}
				/>
			</Field>

			<div className='flex gap-4'>
				<div className='flex items-center gap-2'>
					<Switch
						checked={config.show_names ?? true}
						onCheckedChange={(v) => onChange({ ...config, show_names: v })}
					/>
					<Label>Показывать названия</Label>
				</div>
				<div className='flex items-center gap-2'>
					<Switch
						checked={config.use_category_images ?? true}
						onCheckedChange={(v) => onChange({ ...config, use_category_images: v })}
					/>
					<Label>Фото из категории</Label>
				</div>
			</div>
		</div>
	)
}

// ─── Advantages form ──────────────────────────────────────────────────────────

interface AdvantageItem {
	icon?: string
	title: string
	subtitle?: string
}

interface AdvantagesConfig {
	heading?: string
	items?: AdvantageItem[]
}

function AdvantagesForm({
	config,
	onChange,
}: {
	config: AdvantagesConfig
	onChange: (c: AdvantagesConfig) => void
}) {
	const items = config.items ?? []

	const updateItem = (i: number, patch: Partial<AdvantageItem>) => {
		const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))
		onChange({ ...config, items: next })
	}

	const addItem = () => onChange({ ...config, items: [...items, { title: '' }] })
	const removeItem = (i: number) => onChange({ ...config, items: items.filter((_, idx) => idx !== i) })

	return (
		<div className='space-y-4'>
			<Field label='Заголовок секции'>
				<Input
					value={config.heading ?? ''}
					onChange={(e) => onChange({ ...config, heading: e.target.value })}
					placeholder='Наши преимущества'
				/>
			</Field>

			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium'>Элементы ({items.length})</span>
				<Button variant='ghost' size='sm' onClick={addItem}>
					<Plus className='h-3.5 w-3.5 mr-1' />
					Добавить
				</Button>
			</div>

			{items.map((item, i) => (
				<div key={i} className='border border-border rounded-lg p-3 space-y-2'>
					<div className='flex items-center justify-between mb-1'>
						<span className='text-xs text-muted-foreground font-medium'>Элемент {i + 1}</span>
						<Button
							variant='ghost'
							size='icon'
							className='h-6 w-6 text-destructive hover:text-destructive'
							onClick={() => removeItem(i)}
						>
							<Trash2 className='h-3 w-3' />
						</Button>
					</div>
					<Field label='URL иконки (SVG или изображение)'>
						<Input
							value={item.icon ?? ''}
							onChange={(e) => updateItem(i, { icon: e.target.value })}
							placeholder='/icons/star.svg'
						/>
					</Field>
					<div className='grid grid-cols-2 gap-2'>
						<Field label='Заголовок'>
							<Input
								value={item.title}
								onChange={(e) => updateItem(i, { title: e.target.value })}
								placeholder='Заголовок'
							/>
						</Field>
						<Field label='Подпись'>
							<Input
								value={item.subtitle ?? ''}
								onChange={(e) => updateItem(i, { subtitle: e.target.value })}
								placeholder='Подпись'
							/>
						</Field>
					</div>
				</div>
			))}
		</div>
	)
}

// ─── Rooms form ───────────────────────────────────────────────────────────────

interface RoomItem {
	label?: string
	link?: string
	icon_image?: string
}

interface RoomsConfig {
	title?: string
	items?: RoomItem[]
	columns?: number
}

function RoomsForm({
	config,
	onChange,
}: {
	config: RoomsConfig
	onChange: (c: RoomsConfig) => void
}) {
	const items = config.items ?? []

	const updateItem = (i: number, patch: Partial<RoomItem>) => {
		const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))
		onChange({ ...config, items: next })
	}

	const addItem = () => onChange({ ...config, items: [...items, {}] })
	const removeItem = (i: number) => onChange({ ...config, items: items.filter((_, idx) => idx !== i) })

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium'>Разделы ({items.length})</span>
				<Button variant='ghost' size='sm' onClick={addItem}>
					<Plus className='h-3.5 w-3.5 mr-1' />
					Добавить
				</Button>
			</div>

			{items.map((item, i) => (
				<div key={i} className='border border-border rounded-lg p-4 space-y-3'>
					<div className='flex items-center justify-between'>
						<span className='text-xs font-medium text-muted-foreground uppercase'>Раздел {i + 1}</span>
						<Button
							variant='ghost'
							size='icon'
							className='h-6 w-6 text-destructive hover:text-destructive'
							onClick={() => removeItem(i)}
						>
							<Trash2 className='h-3 w-3' />
						</Button>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<Field label='Название (напр. «В спальню»)'>
							<Input
								value={item.label ?? ''}
								onChange={(e) => updateItem(i, { label: e.target.value })}
								placeholder='В спальню'
							/>
						</Field>
						<Field label='Ссылка'>
							<Input
								value={item.link ?? ''}
								onChange={(e) => updateItem(i, { link: e.target.value })}
								placeholder='/catalog?room=bedroom'
							/>
						</Field>
					</div>
					<div>
						<Label>Иконка / изображение</Label>
						<MediaPicker
							label='Иконка'
							hideLabel
							compact
							aspectRatio='square'
							value={item.icon_image ?? null}
							onChange={(key) => updateItem(i, { icon_image: key ?? undefined })}
						/>
					</div>
				</div>
			))}

			<Field label='Колонок'>
				<SelectInput
					value={String(config.columns ?? 4)}
					options={[
						{ value: '3', label: '3 колонки' },
						{ value: '4', label: '4 колонки' },
						{ value: '6', label: '6 колонок' },
					]}
					onChange={(v) => onChange({ ...config, columns: Number(v) })}
				/>
			</Field>
		</div>
	)
}

// ─── AboutText form ───────────────────────────────────────────────────────────

interface AboutTextConfig {
	heading?: string
	paragraphs?: string[]
	expandable?: boolean
}

function AboutTextForm({
	config,
	onChange,
}: {
	config: AboutTextConfig
	onChange: (c: AboutTextConfig) => void
}) {
	const paragraphs = config.paragraphs ?? ['']

	const updatePara = (i: number, value: string) => {
		const next = paragraphs.map((p, idx) => (idx === i ? value : p))
		onChange({ ...config, paragraphs: next })
	}

	const addPara = () => onChange({ ...config, paragraphs: [...paragraphs, ''] })
	const removePara = (i: number) => onChange({ ...config, paragraphs: paragraphs.filter((_, idx) => idx !== i) })

	return (
		<div className='space-y-4'>
			<Field label='Заголовок секции'>
				<Input
					value={config.heading ?? ''}
					onChange={(e) => onChange({ ...config, heading: e.target.value })}
					placeholder='О компании'
				/>
			</Field>

			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium'>Абзацы ({paragraphs.length})</span>
				<Button variant='ghost' size='sm' onClick={addPara}>
					<Plus className='h-3.5 w-3.5 mr-1' />
					Добавить абзац
				</Button>
			</div>

			{paragraphs.map((para, i) => (
				<div key={i} className='flex gap-2 items-start'>
					<GripVertical className='h-4 w-4 mt-2 text-muted-foreground shrink-0' />
					<div className='flex-1'>
						<textarea
							value={para}
							onChange={(e) => updatePara(i, e.target.value)}
							className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y'
							placeholder={`Абзац ${i + 1}`}
						/>
					</div>
					<Button
						variant='ghost'
						size='icon'
						className='h-7 w-7 mt-1 text-destructive hover:text-destructive shrink-0'
						onClick={() => removePara(i)}
					>
						<Trash2 className='h-3 w-3' />
					</Button>
				</div>
			))}

			<div className='flex items-center gap-2'>
				<Switch
					checked={config.expandable ?? true}
					onCheckedChange={(v) => onChange({ ...config, expandable: v })}
				/>
				<Label>Раскрывающийся текст</Label>
			</div>
		</div>
	)
}

// ─── SectionFormModal ─────────────────────────────────────────────────────────

type SectionRecord = {
	id: string
	title: string | null
	config: unknown
	sectionType?: { id: string; name: string; component: string } | null
}

interface SectionFormModalProps {
	section: SectionRecord
	onSave: (data: { title: string; config: Record<string, unknown> }) => void
	onClose: () => void
}

function getDefaultConfig(component: string): Record<string, unknown> {
	switch (component) {
		case 'Banner':
		case 'HeroBanner':
			return { slides: [{ title: '', subtitle: '', cta: '', href: '' }], autoPlay: false, autoPlayInterval: 4000 }
		case 'ProductGrid':
		case 'ProductGridSection':
		case 'NewProducts':
		case 'SaleProducts':
		case 'PopularProducts':
			return { source: 'promotion', limit: 8, cols: 4, show_price: true, show_discount: true }
		case 'BrandCarousel':
		case 'BrandsCarousel':
			return { propertySlug: 'brand', autoplay: false, visible_count: 6 }
		case 'CategoryCarousel':
		case 'PopularCategories':
			return { categories: [], columns: 4, show_names: true, use_category_images: true }
		case 'Advantages':
			return { heading: 'Наши преимущества', items: [{ icon: '', title: '', subtitle: '' }] }
		case 'AboutText':
		case 'AboutSection':
			return { heading: '', paragraphs: [''] }
		case 'Rooms':
		case 'RoomCategories':
			return { items: [{ label: '', link: '', icon_image: undefined }], columns: 4 }
		default:
			return {}
	}
}

export default function SectionFormModal({ section, onSave, onClose }: SectionFormModalProps) {
	const [title, setTitle] = useState(section.title ?? '')

	const rawConfig =
		typeof section.config === 'object' && section.config !== null
			? (section.config as Record<string, unknown>)
			: {}

	const component = section.sectionType?.component ?? ''

	const [config, setConfig] = useState<Record<string, unknown>>(
		Object.keys(rawConfig).length > 0 ? rawConfig : getDefaultConfig(component),
	)

	const handleSave = () => {
		onSave({ title, config })
	}

	const renderForm = () => {
		switch (component) {
			case 'Banner':
			case 'HeroBanner':
				return (
					<BannerForm
						config={config as BannerConfig}
						onChange={(c) => setConfig(c as Record<string, unknown>)}
					/>
				)
			case 'ProductGrid':
			case 'ProductGridSection':
			case 'NewProducts':
			case 'SaleProducts':
			case 'PopularProducts':
				return (
					<ProductGridForm
						config={config as ProductGridConfig}
						onChange={(c) => setConfig(c as Record<string, unknown>)}
					/>
				)
			case 'BrandCarousel':
			case 'BrandsCarousel':
				return (
					<BrandCarouselForm
						config={config as BrandCarouselConfig}
						onChange={(c) => setConfig(c as Record<string, unknown>)}
					/>
				)
			case 'CategoryCarousel':
			case 'PopularCategories':
				return (
					<CategoryCarouselForm
						config={config as CategoryCarouselConfig}
						onChange={(c) => setConfig(c as Record<string, unknown>)}
					/>
				)
			case 'Advantages':
				return (
					<AdvantagesForm
						config={config as AdvantagesConfig}
						onChange={(c) => setConfig(c as Record<string, unknown>)}
					/>
				)
			case 'AboutText':
			case 'AboutSection':
				return (
					<AboutTextForm
						config={config as AboutTextConfig}
						onChange={(c) => setConfig(c as Record<string, unknown>)}
					/>
				)
			case 'Rooms':
			case 'RoomCategories':
				return (
					<RoomsForm
						config={config as RoomsConfig}
						onChange={(c) => setConfig(c as Record<string, unknown>)}
					/>
				)
			case 'SeenProducts':
		case 'RecentlyViewed':
				return (
					<p className='text-sm text-muted-foreground text-center py-4'>
						Секция &quot;Вы смотрели&quot; не требует настройки — отображает товары на основе истории браузера.
					</p>
				)
			default:
				return (
					<p className='text-sm text-muted-foreground text-center py-4'>
						Тип секции <Badge variant='secondary'>{component || 'неизвестен'}</Badge> не имеет формы настроек.{' '}
						{!component && (
							<span className='block mt-1'>Убедитесь что тип секции сохранён в базе данных (запустите seed).</span>
						)}
					</p>
				)
		}
	}

	return (
		<div className='fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-10 overflow-y-auto'>
			<div className='bg-card border border-border rounded-xl shadow-xl w-full max-w-xl mb-10'>
				{/* Header */}
				<div className='flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-xl z-10'>
					<div>
						<h3 className='text-base font-bold'>Редактировать секцию</h3>
						{section.sectionType && (
							<p className='text-xs text-muted-foreground mt-0.5'>{section.sectionType.name}</p>
						)}
					</div>
					<Button variant='ghost' size='icon' onClick={onClose}>
						<X className='h-4 w-4' />
					</Button>
				</div>

				{/* Body */}
				<div className='p-5 space-y-5'>
					<div>
						<Label>Заголовок секции</Label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder='Заголовок (отображается в блоке)'
						/>
					</div>

					{component !== 'SeenProducts' && component !== 'RecentlyViewed' && component !== '' && (
						<div className='border-t border-border pt-4'>
							<p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4'>
								Настройки секции
							</p>
							{renderForm()}
						</div>
					)}

					{(component === 'SeenProducts' || component === 'RecentlyViewed') && renderForm()}

					{component === '' && (
						<div className='border-t border-border pt-4 text-center py-6'>
							<p className='text-sm text-muted-foreground'>
								Тип секции не определён. Убедитесь что запущен{' '}
								<code className='text-xs bg-muted px-1 py-0.5 rounded'>npx prisma db seed</code>.
							</p>
							<p className='text-xs text-muted-foreground mt-1'>
								sectionTypeId: <code className='bg-muted px-1 rounded'>{section.sectionType?.id ?? '(нет)'}</code>
								{' '} | component: <code className='bg-muted px-1 rounded'>{section.sectionType?.component ?? '(нет)'}</code>
							</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className='flex justify-end gap-2 px-5 pb-5'>
					<Button variant='outline' onClick={onClose}>
						Отмена
					</Button>
					<Button onClick={handleSave}>Сохранить</Button>
				</div>
			</div>
		</div>
	)
}

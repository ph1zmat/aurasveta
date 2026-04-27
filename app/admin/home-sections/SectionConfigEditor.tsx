'use client'

/**
 * SectionConfigEditor (web admin version)
 * Визуальный редактор конфига секции главной страницы.
 */
import { useEffect, useMemo, useState } from 'react'
import {
	DndContext,
	PointerSensor,
	type DragEndEvent,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	Plus,
	Trash2,
	ChevronUp,
	ChevronDown,
	Code2,
	GripVertical,
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import FileUploader from '@/shared/ui/FileUploader'

// ─── helpers ──────────────────────────────────────────────────────────────────

function Field({
	label,
	children,
	hint,
	className,
}: {
	label: string
	children: React.ReactNode
	hint?: string
	className?: string
}) {
	return (
		<div className={`space-y-1 ${className ?? ''}`}>
			<label className='block text-xs font-medium text-muted-foreground'>
				{label}
			</label>
			{children}
			{hint && <p className='text-[10px] text-muted-foreground/70'>{hint}</p>}
		</div>
	)
}

const inputCls =
	'h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40'
const selectCls = inputCls + ' cursor-pointer'
const textareaCls =
	'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-none'

function getRemoteSelectPlaceholder({
	isLoading,
	hasError,
	hasItems,
	emptyLabel,
}: {
	isLoading: boolean
	hasError: boolean
	hasItems: boolean
	emptyLabel: string
}) {
	if (isLoading) return 'Загрузка…'
	if (hasError) return 'Ошибка загрузки'
	if (!hasItems) return emptyLabel
	return 'Не выбрано'
}

function buildCatalogFilterHref({
	categorySlug,
	propertySlug,
	propertyValueSlug,
}: {
	categorySlug?: string
	propertySlug?: string
	propertyValueSlug?: string
}) {
	if (categorySlug) return `/catalog/${categorySlug}`
	if (propertySlug && propertyValueSlug) {
		return `/catalog?prop.${propertySlug}=${propertyValueSlug}`
	}
	return '/catalog'
}

function CatalogFilterLinkControls({
	href,
	onHrefChange,
	categoryId,
	onCategoryIdChange,
	propertyId,
	onPropertyIdChange,
	propertyValueId,
	onPropertyValueIdChange,
	hrefLabel,
	hrefPlaceholder,
	className,
}: {
	href?: string
	onHrefChange: (href?: string) => void
	categoryId?: string
	onCategoryIdChange: (id?: string) => void
	propertyId?: string
	onPropertyIdChange: (id?: string) => void
	propertyValueId?: string
	onPropertyValueIdChange: (id?: string) => void
	hrefLabel: string
	hrefPlaceholder: string
	className?: string
}) {
	const categoriesQuery = trpc.categories.getAll.useQuery()
	const propertiesQuery = trpc.properties.getAll.useQuery()
	const categories = categoriesQuery.data ?? []
	const properties = propertiesQuery.data ?? []
	const [linkMode, setLinkMode] = useState<'manual' | 'auto'>(() =>
		categoryId || propertyId || propertyValueId ? 'auto' : 'manual',
	)
	const { data: selectedProperty } = trpc.properties.getById.useQuery(
		propertyId ?? '',
		{ enabled: Boolean(propertyId) },
	)

	useEffect(() => {
		if (categoryId || propertyId || propertyValueId) {
			setLinkMode('auto')
		}
	}, [categoryId, propertyId, propertyValueId])

	const selectedCategory = categories?.find(c => c.id === categoryId)
	const selectedValue = selectedProperty?.values.find(
		v => v.id === propertyValueId,
	)
	const noAutoDataAvailable =
		!categoriesQuery.isLoading &&
		!propertiesQuery.isLoading &&
		categories.length === 0 &&
		properties.length === 0

	const autoHref = buildCatalogFilterHref({
		categorySlug: selectedCategory?.slug,
		propertySlug: selectedProperty?.slug,
		propertyValueSlug: selectedValue?.slug,
	})
	const finalHref =
		linkMode === 'manual'
			? (href ?? '').trim()
			: (href ?? '').trim() || autoHref
	const modeLabel = selectedCategory
		? `Категория: ${selectedCategory.name}`
		: selectedProperty && selectedValue
			? `${selectedProperty.name}: ${selectedValue.value}`
			: 'Без фильтра'

	useEffect(() => {
		if (linkMode === 'auto') {
			onHrefChange(autoHref)
		}
	}, [autoHref, linkMode, onHrefChange])

	return (
		<div className={`grid grid-cols-2 gap-3 ${className ?? ''}`}>
			<Field label='Режим ссылки' className='col-span-2'>
				<div className='inline-flex rounded-lg border border-border bg-muted/20 p-1'>
					<button
						type='button'
						onClick={() => {
							setLinkMode('manual')
							onCategoryIdChange(undefined)
							onPropertyIdChange(undefined)
							onPropertyValueIdChange(undefined)
						}}
						className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
							linkMode === 'manual'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						Ручная ссылка
					</button>
					<button
						type='button'
						onClick={() => setLinkMode('auto')}
						className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
							linkMode === 'auto'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						Автоссылка
					</button>
				</div>
			</Field>
			<Field
				label={hrefLabel}
				hint='Можно ввести вручную или сгенерировать из фильтров'
			>
				<input
					className={inputCls}
					value={href ?? ''}
					onChange={e => onHrefChange(e.target.value || undefined)}
					placeholder={hrefPlaceholder}
				/>
			</Field>
			<Field label='Категория для автоссылки'>
				<select
					className={selectCls}
					value={categoryId ?? ''}
					onChange={e => {
						const next = e.target.value || undefined
						setLinkMode(next ? 'auto' : linkMode)
						onCategoryIdChange(next)
						if (next) {
							onPropertyIdChange(undefined)
							onPropertyValueIdChange(undefined)
						}
					}}
				>
					<option value=''>
						{getRemoteSelectPlaceholder({
							isLoading: categoriesQuery.isLoading,
							hasError: Boolean(categoriesQuery.error),
							hasItems: categories.length > 0,
							emptyLabel: 'Нет категорий',
						})}
					</option>
					{categories.map(c => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
				</select>
			</Field>
			<Field label='Характеристика для автоссылки'>
				<select
					className={selectCls}
					value={propertyId ?? ''}
					onChange={e => {
						const next = e.target.value || undefined
						setLinkMode(next ? 'auto' : linkMode)
						onPropertyIdChange(next)
						onPropertyValueIdChange(undefined)
						if (next) onCategoryIdChange(undefined)
					}}
				>
					<option value=''>
						{getRemoteSelectPlaceholder({
							isLoading: propertiesQuery.isLoading,
							hasError: Boolean(propertiesQuery.error),
							hasItems: properties.length > 0,
							emptyLabel: 'Нет свойств',
						})}
					</option>
					{properties.map(p => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>
			</Field>
			<Field label='Значение характеристики'>
				<select
					className={selectCls}
					value={propertyValueId ?? ''}
					onChange={e => {
						const next = e.target.value || undefined
						setLinkMode(next ? 'auto' : linkMode)
						onPropertyValueIdChange(next)
					}}
					disabled={linkMode === 'manual' || !selectedProperty}
				>
					<option value=''>
						{selectedProperty
							? getRemoteSelectPlaceholder({
									isLoading: false,
									hasError: false,
									hasItems: selectedProperty.values.length > 0,
									emptyLabel: 'Нет значений у свойства',
								})
							: 'Сначала выберите свойство'}
					</option>
					{selectedProperty?.values.map(v => (
						<option key={v.id} value={v.id}>
							{v.value}
						</option>
					))}
				</select>
			</Field>
			<Field label='Автогенерация ссылки' className='col-span-2'>
				<div className='space-y-2 rounded-lg border border-dashed border-border px-3 py-2'>
					<div className='flex items-center justify-between gap-2'>
						<p className='text-[10px] text-muted-foreground'>{modeLabel}</p>
						<button
							type='button'
							onClick={() => {
								setLinkMode('auto')
								onCategoryIdChange(undefined)
								onPropertyIdChange(undefined)
								onPropertyValueIdChange(undefined)
							}}
							className='rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							Сбросить фильтры
						</button>
					</div>
					<div className='flex items-center gap-2'>
						<p className='min-w-0 flex-1 truncate text-xs text-muted-foreground'>
							{finalHref}
						</p>
						<button
							type='button'
							onClick={() => onHrefChange(autoHref)}
							className='rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							Подставить
						</button>
					</div>
					{linkMode === 'auto' && noAutoDataAvailable && (
						<p className='text-[10px] text-amber-600'>
							Для автоссылок пока нет реальных категорий или свойств. Сначала
							заполните каталог, и списки появятся здесь автоматически.
						</p>
					)}
				</div>
			</Field>
		</div>
	)
}

// ─── DnD helpers ──────────────────────────────────────────────────────────────

function SortableBlock({
	id,
	children,
}: {
	id: string
	children: React.ReactNode
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={isDragging ? 'opacity-90' : ''}
		>
			<div className='mb-1 flex justify-end'>
				<button
					type='button'
					{...attributes}
					{...listeners}
					className='cursor-grab rounded p-1 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing'
					title='Перетащить'
				>
					<GripVertical className='h-4 w-4' />
				</button>
			</div>
			{children}
		</div>
	)
}

// ─── SlideImagePicker ─────────────────────────────────────────────────────────

function SlideImagePicker({
	imageKey,
	onChange,
}: {
	imageKey?: string
	onChange: (key: string) => void
}) {
	return (
		<FileUploader
			currentImage={imageKey ?? null}
			onUploaded={key => onChange(key)}
			onRemove={() => onChange('')}
			label='Изображение слайда'
		/>
	)
}

// ─── Banner ───────────────────────────────────────────────────────────────────

interface BannerSlide {
	title?: string
	subtitle?: string
	cta?: string
	href?: string
	imageKey?: string
	bg?: string
}

const BG_OPTIONS = [
	{ label: 'Тёмный', value: 'from-foreground/80 to-foreground/60' },
	{ label: 'Основной (primary)', value: 'from-primary/80 to-primary/60' },
	{ label: 'Тёмный 70%', value: 'from-foreground/70 to-foreground/50' },
	{ label: 'Синий', value: 'from-blue-600/80 to-blue-800/80' },
	{ label: 'Зелёный', value: 'from-emerald-600/80 to-emerald-800/80' },
]

function BannerConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const sensors = useSensors(useSensor(PointerSensor))
	const slides: BannerSlide[] = Array.isArray(value.slides)
		? (value.slides as BannerSlide[])
		: [{}]
	const slideIds = slides.map((_, idx) => `slide-${idx}`)

	function setSlides(next: BannerSlide[]) {
		onChange({ ...value, slides: next })
	}
	function updateSlide(idx: number, patch: Partial<BannerSlide>) {
		setSlides(slides.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
	}
	function moveSlide(idx: number, dir: -1 | 1) {
		const next = [...slides]
		const t = idx + dir
		if (t < 0 || t >= next.length) return
		;[next[idx], next[t]] = [next[t], next[idx]]
		setSlides(next)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return
		const oldIndex = slideIds.indexOf(String(active.id))
		const newIndex = slideIds.indexOf(String(over.id))
		if (oldIndex === -1 || newIndex === -1) return
		setSlides(arrayMove(slides, oldIndex, newIndex))
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<p className='text-xs font-medium text-muted-foreground'>
					Слайды ({slides.length})
				</p>
				<button
					type='button'
					onClick={() =>
						setSlides([
							...slides,
							{ title: '', subtitle: '', cta: 'Подробнее', href: '/catalog' },
						])
					}
					className='flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
				>
					<Plus className='h-3.5 w-3.5' /> Добавить слайд
				</button>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={slideIds}
					strategy={verticalListSortingStrategy}
				>
					<div className='space-y-3'>
						{slides.map((slide, idx) => (
							<SortableBlock key={slideIds[idx]} id={slideIds[idx]}>
								<div className='rounded-xl border border-border bg-muted/10 p-4 space-y-3'>
									<div className='flex items-center justify-between'>
										<span className='text-xs font-semibold text-foreground'>
											Слайд {idx + 1}
										</span>
										<div className='flex items-center gap-1'>
											<button
												type='button'
												onClick={() => moveSlide(idx, -1)}
												disabled={idx === 0}
												className='rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30'
											>
												<ChevronUp className='h-3.5 w-3.5' />
											</button>
											<button
												type='button'
												onClick={() => moveSlide(idx, 1)}
												disabled={idx === slides.length - 1}
												className='rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30'
											>
												<ChevronDown className='h-3.5 w-3.5' />
											</button>
											<button
												type='button'
												onClick={() =>
													setSlides(slides.filter((_, i) => i !== idx))
												}
												className='rounded p-1 text-destructive/60 hover:text-destructive'
											>
												<Trash2 className='h-3.5 w-3.5' />
											</button>
										</div>
									</div>

									<SlideImagePicker
										imageKey={slide.imageKey}
										onChange={key => updateSlide(idx, { imageKey: key })}
									/>

									<div className='grid grid-cols-2 gap-3'>
										<Field label='Заголовок'>
											<input
												className={inputCls}
												value={slide.title ?? ''}
												onChange={e =>
													updateSlide(idx, { title: e.target.value })
												}
												placeholder='ПРАВИЛЬНЫЙ СВЕТ'
											/>
										</Field>
										<Field label='Подзаголовок'>
											<input
												className={inputCls}
												value={slide.subtitle ?? ''}
												onChange={e =>
													updateSlide(idx, { subtitle: e.target.value })
												}
												placeholder='Создайте атмосферу уюта'
											/>
										</Field>
										<Field label='Текст кнопки'>
											<input
												className={inputCls}
												value={slide.cta ?? ''}
												onChange={e =>
													updateSlide(idx, { cta: e.target.value })
												}
												placeholder='Смотреть каталог'
											/>
										</Field>
										<Field label='Ссылка кнопки'>
											<input
												className={inputCls}
												value={slide.href ?? ''}
												onChange={e =>
													updateSlide(idx, { href: e.target.value })
												}
												placeholder='/catalog'
											/>
										</Field>
									</div>

									{!slide.imageKey && (
										<Field label='Цвет фона (если нет фото)'>
											<select
												className={selectCls}
												value={slide.bg ?? BG_OPTIONS[0].value}
												onChange={e => updateSlide(idx, { bg: e.target.value })}
											>
												{BG_OPTIONS.map(o => (
													<option key={o.value} value={o.value}>
														{o.label}
													</option>
												))}
											</select>
										</Field>
									)}
								</div>
							</SortableBlock>
						))}
					</div>
				</SortableContext>
			</DndContext>

			<div className='grid grid-cols-2 gap-3 border-t border-border pt-3'>
				<Field label='Мин. высота слайда (px)'>
					<input
						type='number'
						min={160}
						max={600}
						className={inputCls}
						value={(value.minHeight as number | undefined) ?? 280}
						onChange={e =>
							onChange({ ...value, minHeight: Number(e.target.value) })
						}
					/>
				</Field>
				<Field label='Автопрокрутка'>
					<div className='flex h-9 items-center gap-3'>
						<label className='flex items-center gap-2 text-sm text-foreground'>
							<input
								type='checkbox'
								checked={Boolean(value.autoPlay)}
								onChange={e =>
									onChange({ ...value, autoPlay: e.target.checked })
								}
								className='h-4 w-4 rounded accent-primary'
							/>
							Включить
						</label>
						{Boolean(value.autoPlay) && (
							<input
								type='number'
								min={1000}
								max={10000}
								step={500}
								className={inputCls}
								style={{ maxWidth: 100 }}
								value={(value.autoPlayInterval as number | undefined) ?? 4000}
								onChange={e =>
									onChange({
										...value,
										autoPlayInterval: Number(e.target.value),
									})
								}
								title='Интервал (мс)'
							/>
						)}
					</div>
				</Field>
			</div>
		</div>
	)
}

// ─── ProductGrid ──────────────────────────────────────────────────────────────

function ProductGridConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const categoriesQuery = trpc.categories.getAll.useQuery()
	const propertiesQuery = trpc.properties.getAll.useQuery()
	const categories = categoriesQuery.data ?? []
	const properties = propertiesQuery.data ?? []
	const source = (value.source as string | undefined) ?? 'promotion'
	const selectedPropId =
		(value.propertyId as string | undefined) ??
		(value._propertyId as string | undefined) ??
		''
	const selectedCategoryId = (value.categoryId as string | undefined) ?? ''
	const selectedPropertyValueId =
		(value.propertyValueId as string | undefined) ?? ''

	const { data: selectedProperty } = trpc.properties.getById.useQuery(
		selectedPropId,
		{ enabled: Boolean(selectedPropId) },
	)

	function set(key: string, val: unknown) {
		onChange({ ...value, [key]: val })
	}

	const selectedCategory = categories.find(c => c.id === selectedCategoryId)
	const selectedPropertyValue = selectedProperty?.values.find(
		v => v.id === selectedPropertyValueId,
	)

	const autoViewAllHref = buildCatalogFilterHref({
		categorySlug: source === 'category' ? selectedCategory?.slug : undefined,
		propertySlug: source === 'property' ? selectedProperty?.slug : undefined,
		propertyValueSlug:
			source === 'property' ? selectedPropertyValue?.slug : undefined,
	})

	return (
		<div className='space-y-3'>
			<Field label='Источник товаров'>
				<select
					className={selectCls}
					value={source}
					onChange={e =>
						onChange({
							...value,
							source: e.target.value,
							...(e.target.value !== 'property'
								? {
										propertyId: undefined,
										_propertyId: undefined,
										propertyValueId: undefined,
									}
								: {}),
						})
					}
				>
					<option value='promotion'>Акции (со скидкой)</option>
					<option value='novelty'>Новинки</option>
					<option value='popular'>Популярные</option>
					<option value='category'>Из категории</option>
					<option value='property'>По характеристике (значение)</option>
				</select>
			</Field>

			{source === 'category' && (
				<Field label='Категория'>
					<select
						className={selectCls}
						value={(value.categoryId as string | undefined) ?? ''}
						onChange={e => set('categoryId', e.target.value || undefined)}
					>
						<option value=''>
							{getRemoteSelectPlaceholder({
								isLoading: categoriesQuery.isLoading,
								hasError: Boolean(categoriesQuery.error),
								hasItems: categories.length > 0,
								emptyLabel: 'Нет категорий в каталоге',
							})}
						</option>
						{categories.map(cat => (
							<option key={cat.id} value={cat.id}>
								{cat.name}
							</option>
						))}
					</select>
				</Field>
			)}

			{source === 'property' && (
				<>
					<Field label='Характеристика'>
						<select
							className={selectCls}
							value={selectedPropId}
							onChange={e =>
								onChange({
									...value,
									propertyId: e.target.value || undefined,
									_propertyId: e.target.value || undefined,
									propertyValueId: undefined,
								})
							}
						>
							<option value=''>
								{getRemoteSelectPlaceholder({
									isLoading: propertiesQuery.isLoading,
									hasError: Boolean(propertiesQuery.error),
									hasItems: properties.length > 0,
									emptyLabel: 'Нет свойств в каталоге',
								})}
							</option>
							{properties.map(p => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</Field>
					{selectedProperty && (
						<Field
							label='Значение'
							hint={`Товары с ${selectedProperty.name} = выбранное значение`}
						>
							<select
								className={selectCls}
								value={(value.propertyValueId as string | undefined) ?? ''}
								onChange={e =>
									set('propertyValueId', e.target.value || undefined)
								}
							>
								<option value=''>
									{selectedProperty?.values.length
										? 'Выберите значение…'
										: 'У свойства пока нет значений'}
								</option>
								{selectedProperty.values.map(
									(v: { id: string; value: string }) => (
										<option key={v.id} value={v.id}>
											{v.value}
										</option>
									),
								)}
							</select>
						</Field>
					)}
					{!propertiesQuery.isLoading &&
						!propertiesQuery.error &&
						properties.length === 0 && (
							<p className='text-[10px] text-amber-600'>
								Фильтрация по свойствам станет доступной, когда в каталоге
								появятся реальные свойства и их значения.
							</p>
						)}
				</>
			)}

			<div className='grid grid-cols-2 gap-3'>
				<Field label='Сортировка'>
					<select
						className={selectCls}
						value={(value.sortBy as string | undefined) ?? 'newest'}
						onChange={e => set('sortBy', e.target.value)}
					>
						<option value='newest'>Новые сначала</option>
						<option value='popular'>По популярности</option>
						<option value='price_asc'>Цена ↑</option>
						<option value='price_desc'>Цена ↓</option>
					</select>
				</Field>
				<Field label='Количество товаров (1–24)'>
					<input
						type='number'
						min={1}
						max={24}
						className={inputCls}
						value={(value.limit as number | undefined) ?? 8}
						onChange={e => set('limit', Number(e.target.value))}
					/>
				</Field>
				<Field label='Колонок в сетке'>
					<select
						className={selectCls}
						value={String((value.cols as number | undefined) ?? 4)}
						onChange={e => set('cols', Number(e.target.value))}
					>
						<option value='2'>2</option>
						<option value='3'>3</option>
						<option value='4'>4 (по умолчанию)</option>
						<option value='6'>6 (мини)</option>
					</select>
				</Field>
			</div>

			<div className='border-t border-border pt-3'>
				<Field label='Ссылка «Смотреть все»' hint='Пусто — ссылка скрыта'>
					<input
						className={inputCls}
						value={(value.viewAllHref as string | undefined) ?? ''}
						onChange={e => set('viewAllHref', e.target.value || undefined)}
						placeholder={autoViewAllHref}
					/>
				</Field>
				<Field label='Текст ссылки'>
					<input
						className={inputCls}
						value={(value.viewAllLabel as string | undefined) ?? ''}
						onChange={e => set('viewAllLabel', e.target.value || undefined)}
						placeholder='Смотреть все'
					/>
				</Field>
				<Field label='Автогенерация ссылки'>
					<div className='flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2'>
						<p className='min-w-0 flex-1 truncate text-xs text-muted-foreground'>
							{autoViewAllHref}
						</p>
						<button
							type='button'
							onClick={() => set('viewAllHref', autoViewAllHref)}
							className='rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						>
							Подставить
						</button>
					</div>
				</Field>
			</div>
		</div>
	)
}

// ─── BrandCarousel ────────────────────────────────────────────────────────────

function BrandCarouselConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const utils = trpc.useUtils()
	const propertiesQuery = trpc.properties.getAll.useQuery()
	const properties = propertiesQuery.data ?? []
	const propSlug = (value.propertySlug as string | undefined) ?? 'brand'
	const matchedProperty = properties.find(p => p.slug === propSlug)
	const propertyDetailsQuery = trpc.properties.getBySlug.useQuery(propSlug, {
		enabled: Boolean(propSlug),
	})
	const propertyDetails = propertyDetailsQuery.data
	const [newValue, setNewValue] = useState({
		value: '',
		slug: '',
		photo: null as string | null,
	})
	const createValueMut = trpc.properties.createValue.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.properties.getBySlug.invalidate(propSlug),
				utils.properties.getById.invalidate(matchedProperty?.id),
				utils.properties.getAll.invalidate(),
			])
			setNewValue({ value: '', slug: '', photo: null })
		},
	})
	const values = useMemo(() => propertyDetails?.values ?? [], [propertyDetails])

	function set(key: string, val: unknown) {
		onChange({ ...value, [key]: val })
	}

	return (
		<div className='space-y-3'>
			<Field
				label='Характеристика (группа значений)'
				hint='Каждое значение становится одним элементом карусели'
			>
				<select
					className={selectCls}
					value={propSlug}
					onChange={e => {
						set('propertySlug', e.target.value)
						set('filterParam', e.target.value)
					}}
				>
					<option value=''>
						{getRemoteSelectPlaceholder({
							isLoading: propertiesQuery.isLoading,
							hasError: Boolean(propertiesQuery.error),
							hasItems: properties.length > 0,
							emptyLabel: 'Нет свойств в каталоге',
						})}
					</option>
					{properties.map(p => (
						<option key={p.slug} value={p.slug}>
							{p.name} ({p.slug})
						</option>
					))}
				</select>
			</Field>
			{!propertiesQuery.isLoading &&
				!propertiesQuery.error &&
				properties.length === 0 && (
					<p className='text-[10px] text-amber-600'>
						Эта секция строится только на реальных свойствах каталога. Добавьте,
						например, `brand`, и список заработает автоматически.
					</p>
				)}
			<Field
				label='Параметр URL для фильтра каталога'
				hint='Формат карточек: /catalog?prop.{параметр}=значение'
			>
				<input
					className={inputCls}
					value={(value.filterParam as string | undefined) ?? propSlug}
					onChange={e => set('filterParam', e.target.value)}
					placeholder={propSlug}
				/>
			</Field>
			<div className='grid grid-cols-2 gap-3 border-t border-border pt-3'>
				<Field label='Текст ссылки'>
					<input
						className={inputCls}
						value={(value.viewAllLabel as string | undefined) ?? ''}
						onChange={e => set('viewAllLabel', e.target.value || undefined)}
						placeholder='Все бренды'
					/>
				</Field>
			</div>

			<CatalogFilterLinkControls
				href={(value.viewAllHref as string | undefined) ?? ''}
				onHrefChange={href => set('viewAllHref', href)}
				categoryId={value.linkCategoryId as string | undefined}
				onCategoryIdChange={id => set('linkCategoryId', id)}
				propertyId={
					(value.linkPropertyId as string | undefined) ?? matchedProperty?.id
				}
				onPropertyIdChange={id => set('linkPropertyId', id)}
				propertyValueId={value.linkPropertyValueId as string | undefined}
				onPropertyValueIdChange={id => set('linkPropertyValueId', id)}
				hrefLabel='Ссылка «Смотреть все»'
				hrefPlaceholder='/catalog'
			/>

			<div className='space-y-3 rounded-xl border border-border bg-muted/10 p-4'>
				<div className='flex items-start justify-between gap-3'>
					<div>
						<p className='text-xs font-medium text-foreground'>
							Значения бренда и фото
						</p>
						<p className='mt-1 text-[10px] text-muted-foreground'>
							Каждая карточка секции брендов берётся из значения выбранной
							характеристики. Здесь можно связать одно значение бренда с одной
							картинкой.
						</p>
					</div>
					{propertyDetails?.hasPhoto === false && (
						<span className='rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700'>
							У свойства выключен флаг «значения со фото»
						</span>
					)}
				</div>

				{!propSlug ? (
					<p className='text-xs text-muted-foreground'>
						Сначала выберите характеристику выше.
					</p>
				) : propertyDetailsQuery.isLoading ? (
					<p className='text-xs text-muted-foreground'>
						Загружаю значения характеристики…
					</p>
				) : propertyDetailsQuery.error ? (
					<p className='text-xs text-destructive'>
						Не удалось загрузить значения характеристики.
					</p>
				) : !propertyDetails ? (
					<p className='text-xs text-muted-foreground'>
						Характеристика `{propSlug}` пока не найдена.
					</p>
				) : (
					<>
						<div className='space-y-3'>
							{values.map((brand, index) => (
								<BrandValueEditorCard
									key={brand.id}
									propertySlug={propSlug}
									propertyId={propertyDetails.id}
									brand={brand}
									index={index}
								/>
							))}
						</div>

						<div className='rounded-xl border border-dashed border-border bg-background/70 p-3'>
							<p className='mb-3 text-xs font-medium text-foreground'>
								Добавить бренд в секцию
							</p>
							<div className='grid gap-3 md:grid-cols-[1fr_180px]'>
								<Field label='Название бренда'>
									<input
										className={inputCls}
										value={newValue.value}
										onChange={e => {
											const nextValue = e.target.value
											setNewValue(prev => ({
												...prev,
												value: nextValue,
												slug:
													prev.slug ||
													nextValue
														.toLowerCase()
														.replace(/\s+/g, '-')
														.replace(/[^a-zа-яё0-9-]/gi, ''),
											}))
										}}
										placeholder='Maytoni'
									/>
								</Field>
								<Field label='Slug'>
									<input
										className={`${inputCls} font-mono`}
										value={newValue.slug}
										onChange={e =>
											setNewValue(prev => ({ ...prev, slug: e.target.value }))
										}
										placeholder='maytoni'
									/>
								</Field>
							</div>
							<div className='mt-3'>
								<FileUploader
									currentImage={newValue.photo}
									onUploaded={key =>
										setNewValue(prev => ({ ...prev, photo: key }))
									}
									onRemove={() =>
										setNewValue(prev => ({ ...prev, photo: null }))
									}
									label='Фото бренда'
								/>
							</div>
							<div className='mt-3 flex justify-end'>
								<button
									type='button'
									onClick={() => {
										if (!propertyDetails.id || !newValue.value.trim()) return
										createValueMut.mutate({
											propertyId: propertyDetails.id,
											value: newValue.value.trim(),
											slug: newValue.slug.trim() || undefined,
											photo: newValue.photo,
											order: values.length,
										})
									}}
									disabled={createValueMut.isPending || !newValue.value.trim()}
									className='rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
								>
									{createValueMut.isPending ? 'Добавляю…' : 'Добавить бренд'}
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

function BrandValueEditorCard({
	propertySlug,
	propertyId,
	brand,
	index,
}: {
	propertySlug: string
	propertyId: string
	brand: {
		id: string
		value: string
		slug: string
		photo?: string | null
		order?: number
	}
	index: number
}) {
	const utils = trpc.useUtils()
	const [draft, setDraft] = useState({
		value: brand.value,
		slug: brand.slug,
		photo: brand.photo ?? null,
	})
	const updateValueMut = trpc.properties.updateValue.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.properties.getBySlug.invalidate(propertySlug),
				utils.properties.getById.invalidate(propertyId),
				utils.properties.getAll.invalidate(),
			])
		},
	})
	const deleteValueMut = trpc.properties.deleteValue.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.properties.getBySlug.invalidate(propertySlug),
				utils.properties.getById.invalidate(propertyId),
				utils.properties.getAll.invalidate(),
			])
		},
	})

	useEffect(() => {
		setDraft({
			value: brand.value,
			slug: brand.slug,
			photo: brand.photo ?? null,
		})
	}, [brand.id, brand.value, brand.slug, brand.photo])

	const isDirty =
		draft.value !== brand.value ||
		draft.slug !== brand.slug ||
		(draft.photo ?? null) !== (brand.photo ?? null)

	return (
		<div className='rounded-xl border border-border bg-background/80 p-3'>
			<div className='mb-3 flex items-center justify-between gap-3'>
				<div>
					<p className='text-xs font-medium text-foreground'>
						Бренд {index + 1}
					</p>
					<p className='text-[10px] text-muted-foreground'>
						Карточка секции будет вести на `/catalog?prop.{propertySlug}=
						{draft.slug || brand.slug}`
					</p>
				</div>
				<button
					type='button'
					onClick={() => {
						if (
							confirm(`Удалить значение "${brand.value}" из характеристики?`)
						) {
							deleteValueMut.mutate(brand.id)
						}
					}}
					className='rounded-md border border-border px-2.5 py-1 text-[10px] text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50'
					disabled={deleteValueMut.isPending}
				>
					Удалить
				</button>
			</div>
			<div className='grid gap-3 md:grid-cols-[220px_1fr]'>
				<FileUploader
					currentImage={draft.photo}
					onUploaded={key => setDraft(prev => ({ ...prev, photo: key }))}
					onRemove={() => setDraft(prev => ({ ...prev, photo: null }))}
					label='Фото бренда'
				/>
				<div className='space-y-3'>
					<div className='grid gap-3 md:grid-cols-2'>
						<Field label='Название'>
							<input
								className={inputCls}
								value={draft.value}
								onChange={e =>
									setDraft(prev => ({ ...prev, value: e.target.value }))
								}
								placeholder='Maytoni'
							/>
						</Field>
						<Field label='Slug значения'>
							<input
								className={`${inputCls} font-mono`}
								value={draft.slug}
								onChange={e =>
									setDraft(prev => ({ ...prev, slug: e.target.value }))
								}
								placeholder='maytoni'
							/>
						</Field>
					</div>
					<div className='flex justify-end gap-2'>
						<button
							type='button'
							onClick={() =>
								setDraft({
									value: brand.value,
									slug: brand.slug,
									photo: brand.photo ?? null,
								})
							}
							className='rounded-md border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50'
							disabled={!isDirty || updateValueMut.isPending}
						>
							Сбросить
						</button>
						<button
							type='button'
							onClick={() =>
								updateValueMut.mutate({
									id: brand.id,
									value: draft.value.trim(),
									slug: draft.slug.trim(),
									photo: draft.photo,
								})
							}
							className='rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'
							disabled={
								!isDirty ||
								updateValueMut.isPending ||
								!draft.value.trim() ||
								!draft.slug.trim()
							}
						>
							{updateValueMut.isPending ? 'Сохраняю…' : 'Сохранить связь'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── CategoryCarousel ─────────────────────────────────────────────────────────

function CategoryCarouselConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const categoriesQuery = trpc.categories.getAll.useQuery()
	const categories = categoriesQuery.data ?? []
	const rootCategories = categories.filter(c => !c.parentId)

	function set(key: string, val: unknown) {
		onChange({ ...value, [key]: val })
	}

	return (
		<div className='space-y-3'>
			<Field
				label='Родительская категория'
				hint='«Корень» — показывает главные категории сайта'
			>
				<select
					className={selectCls}
					value={(value.parentId as string | undefined) ?? ''}
					onChange={e => set('parentId', e.target.value || undefined)}
				>
					<option value=''>Корень (главные категории)</option>
					{rootCategories.map(cat => (
						<option key={cat.id} value={cat.id}>
							{cat.name}
						</option>
					))}
				</select>
			</Field>
			{!categoriesQuery.isLoading &&
				!categoriesQuery.error &&
				rootCategories.length === 0 && (
					<p className='text-[10px] text-amber-600'>
						Пока нет корневых категорий — карусель категорий возьмёт данные, как
						только они появятся в каталоге.
					</p>
				)}
			<div className='grid grid-cols-2 gap-3'>
				<Field label='Максимум категорий'>
					<input
						type='number'
						min={1}
						max={48}
						className={inputCls}
						value={(value.limit as number | undefined) ?? 12}
						onChange={e => set('limit', Number(e.target.value))}
					/>
				</Field>
				<Field label='Сортировка'>
					<select
						className={selectCls}
						value={(value.orderBy as string | undefined) ?? 'name'}
						onChange={e => set('orderBy', e.target.value)}
					>
						<option value='name'>По названию A→Z</option>
						<option value='createdAt'>По дате добавления</option>
					</select>
				</Field>
			</div>
		</div>
	)
}

// ─── Advantages ───────────────────────────────────────────────────────────────

interface AdvItem {
	icon: string
	title: string
	subtitle?: string
}

const ICON_PRESETS = [
	{ label: 'Машина / доставка', value: '/car.svg' },
	{ label: 'Магазин', value: '/store.svg' },
	{ label: 'Инструмент / монтаж', value: '/spanner.svg' },
	{ label: 'Коробка / склад', value: '/box.svg' },
	{ label: 'Вопрос / консультация', value: '/question.svg' },
	{ label: 'Скидка / акция', value: '/sale.svg' },
]

function AdvantagesConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const sensors = useSensors(useSensor(PointerSensor))
	const items: AdvItem[] = Array.isArray(value.items)
		? (value.items as AdvItem[])
		: []
	const itemIds = items.map((_, idx) => `adv-${idx}`)

	function setItems(next: AdvItem[]) {
		onChange({ ...value, items: next })
	}
	function update(idx: number, patch: Partial<AdvItem>) {
		setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
	}
	function move(idx: number, dir: -1 | 1) {
		const next = [...items]
		const t = idx + dir
		if (t < 0 || t >= next.length) return
		;[next[idx], next[t]] = [next[t], next[idx]]
		setItems(next)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return
		const oldIndex = itemIds.indexOf(String(active.id))
		const newIndex = itemIds.indexOf(String(over.id))
		if (oldIndex === -1 || newIndex === -1) return
		setItems(arrayMove(items, oldIndex, newIndex))
	}

	return (
		<div className='space-y-3'>
			<Field label='Заголовок секции'>
				<input
					className={inputCls}
					value={(value.heading as string | undefined) ?? ''}
					onChange={e => onChange({ ...value, heading: e.target.value })}
					placeholder='Наши преимущества'
				/>
			</Field>
			<div className='flex items-center justify-between'>
				<p className='text-xs text-muted-foreground'>
					{items.length === 0
						? 'Используются 6 стандартных пунктов'
						: `Пунктов: ${items.length}`}
				</p>
				<button
					type='button'
					onClick={() =>
						setItems([...items, { icon: '/question.svg', title: '' }])
					}
					className='flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
				>
					<Plus className='h-3.5 w-3.5' /> Добавить
				</button>
			</div>
			{items.length === 0 && (
				<p className='rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground'>
					Нажмите «Добавить» чтобы создать свой список пунктов вместо
					стандартного.
				</p>
			)}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
					<div className='space-y-2'>
						{items.map((item, idx) => (
							<SortableBlock key={itemIds[idx]} id={itemIds[idx]}>
								<div className='rounded-xl border border-border bg-muted/10 p-3 space-y-2'>
									<div className='flex items-center justify-between'>
										<span className='text-xs font-medium text-foreground'>
											Пункт {idx + 1}
										</span>
										<div className='flex items-center gap-1'>
											<button
												type='button'
												onClick={() => move(idx, -1)}
												disabled={idx === 0}
												className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
											>
												<ChevronUp className='h-3 w-3' />
											</button>
											<button
												type='button'
												onClick={() => move(idx, 1)}
												disabled={idx === items.length - 1}
												className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
											>
												<ChevronDown className='h-3 w-3' />
											</button>
											<button
												type='button'
												onClick={() =>
													setItems(items.filter((_, i) => i !== idx))
												}
												className='rounded p-0.5 text-destructive/60 hover:text-destructive'
											>
												<Trash2 className='h-3 w-3' />
											</button>
										</div>
									</div>
									<div className='grid grid-cols-3 gap-2'>
										<Field label='Иконка'>
											<select
												className={selectCls}
												value={item.icon}
												onChange={e => update(idx, { icon: e.target.value })}
											>
												{ICON_PRESETS.map(p => (
													<option key={p.value} value={p.value}>
														{p.label}
													</option>
												))}
											</select>
										</Field>
										<Field label='Название'>
											<input
												className={inputCls}
												value={item.title}
												onChange={e => update(idx, { title: e.target.value })}
												placeholder='Бесплатная'
											/>
										</Field>
										<Field label='Подпись (строка 2)'>
											<input
												className={inputCls}
												value={item.subtitle ?? ''}
												onChange={e =>
													update(idx, {
														subtitle: e.target.value || undefined,
													})
												}
												placeholder='доставка'
											/>
										</Field>
									</div>
								</div>
							</SortableBlock>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	)
}

// ─── AboutText ────────────────────────────────────────────────────────────────

function AboutTextConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const paragraphs: string[] = Array.isArray(value.paragraphs)
		? (value.paragraphs as string[])
		: []

	function setParagraphs(next: string[]) {
		onChange({ ...value, paragraphs: next })
	}

	return (
		<div className='space-y-3'>
			<Field label='Заголовок'>
				<input
					className={inputCls}
					value={(value.heading as string | undefined) ?? ''}
					onChange={e => onChange({ ...value, heading: e.target.value })}
					placeholder='Интернет магазин освещения Аура Света'
				/>
			</Field>
			<div className='flex items-center justify-between'>
				<p className='text-xs text-muted-foreground'>
					{paragraphs.length === 0
						? 'Используется стандартный текст'
						: `Абзацев: ${paragraphs.length}`}
				</p>
				<button
					type='button'
					onClick={() => setParagraphs([...paragraphs, ''])}
					className='flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
				>
					<Plus className='h-3.5 w-3.5' /> Абзац
				</button>
			</div>
			{paragraphs.length === 0 && (
				<p className='rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground'>
					Нажмите «Абзац» чтобы написать свой текст вместо стандартного.
				</p>
			)}
			<div className='space-y-2'>
				{paragraphs.map((p, idx) => (
					<div key={idx} className='flex gap-2'>
						<textarea
							rows={3}
							className={textareaCls + ' flex-1'}
							value={p}
							onChange={e => {
								const next = [...paragraphs]
								next[idx] = e.target.value
								setParagraphs(next)
							}}
							placeholder={`Абзац ${idx + 1}…`}
						/>
						<button
							type='button'
							onClick={() =>
								setParagraphs(paragraphs.filter((_, i) => i !== idx))
							}
							className='self-start rounded p-1 text-destructive/60 hover:text-destructive'
						>
							<Trash2 className='h-3.5 w-3.5' />
						</button>
					</div>
				))}
			</div>
			<Field label=''>
				<label className='flex items-center gap-2 text-sm text-foreground'>
					<input
						type='checkbox'
						checked={
							value.expandable === undefined ? true : Boolean(value.expandable)
						}
						onChange={e => onChange({ ...value, expandable: e.target.checked })}
						className='h-4 w-4 rounded accent-primary'
					/>
					Показывать кнопку «Развернуть / свернуть»
				</label>
			</Field>
		</div>
	)
}

// ─── PopularQueries ───────────────────────────────────────────────────────────

function PopularQueriesConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	return (
		<div className='space-y-3'>
			<Field label='Заголовок'>
				<input
					className={inputCls}
					value={(value.heading as string | undefined) ?? ''}
					onChange={e => onChange({ ...value, heading: e.target.value })}
					placeholder='Популярные запросы'
				/>
			</Field>
			<Field
				label='Количество запросов (1–30)'
				hint='Берутся самые популярные поисковые запросы за последние 7 дней'
			>
				<input
					type='number'
					min={1}
					max={30}
					className={inputCls}
					value={(value.limit as number | undefined) ?? 10}
					onChange={e => onChange({ ...value, limit: Number(e.target.value) })}
				/>
			</Field>
		</div>
	)
}

// ─── RoomCategories ───────────────────────────────────────────────────────────

interface RoomItem {
	label: string
	href: string
	image: string
	linkCategoryId?: string
	linkPropertyId?: string
	linkPropertyValueId?: string
}

const DEFAULT_ROOMS: RoomItem[] = [
	{
		label: 'В СПАЛЬНЮ',
		href: '/catalog?prop.room=bedroom',
		image: '/sleepbed.svg',
	},
	{
		label: 'В ГОСТИНУЮ',
		href: '/catalog?prop.room=living',
		image: '/sofa.svg',
	},
	{ label: 'В ОФИС', href: '/catalog?prop.room=office', image: '/office.svg' },
	{
		label: 'В ВАННУЮ',
		href: '/catalog?prop.room=bathroom',
		image: '/bath.svg',
	},
	{
		label: 'НА КУХНЮ',
		href: '/catalog?prop.room=kitchen',
		image: '/gasstove.svg',
	},
	{
		label: 'В ДЕТСКУЮ',
		href: '/catalog?prop.room=kids',
		image: '/babybed.svg',
	},
	{
		label: 'В ПРИХОЖУЮ',
		href: '/catalog?prop.room=hallway',
		image: '/hanger.svg',
	},
]

function RoomImagePicker({
	imageKey,
	onChange,
}: {
	imageKey?: string
	onChange: (key: string) => void
}) {
	return (
		<FileUploader
			currentImage={imageKey ?? null}
			onUploaded={key => onChange(key)}
			onRemove={() => onChange('')}
			label='Фото комнаты'
		/>
	)
}

function RoomCategoriesConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const sensors = useSensors(useSensor(PointerSensor))
	const rooms: RoomItem[] =
		Array.isArray(value.rooms) && (value.rooms as RoomItem[]).length > 0
			? (value.rooms as RoomItem[])
			: DEFAULT_ROOMS.map(r => ({ ...r }))
	const roomIds = rooms.map((_, idx) => `room-${idx}`)

	function setRooms(next: RoomItem[]) {
		onChange({ ...value, rooms: next })
	}
	function update(idx: number, patch: Partial<RoomItem>) {
		setRooms(rooms.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
	}
	function move(idx: number, dir: -1 | 1) {
		const next = [...rooms]
		const t = idx + dir
		if (t < 0 || t >= next.length) return
		;[next[idx], next[t]] = [next[t], next[idx]]
		setRooms(next)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return
		const oldIndex = roomIds.indexOf(String(active.id))
		const newIndex = roomIds.indexOf(String(over.id))
		if (oldIndex === -1 || newIndex === -1) return
		setRooms(arrayMove(rooms, oldIndex, newIndex))
	}

	return (
		<div className='space-y-3'>
			<Field label='Заголовок секции'>
				<input
					className={inputCls}
					value={(value.heading as string | undefined) ?? ''}
					onChange={e => onChange({ ...value, heading: e.target.value })}
					placeholder='Товары по расположению'
				/>
			</Field>

			<div className='flex items-center justify-between'>
				<p className='text-xs text-muted-foreground'>Комнаты: {rooms.length}</p>
				<button
					type='button'
					onClick={() =>
						setRooms([...rooms, { label: '', href: '', image: '' }])
					}
					className='flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
				>
					<Plus className='h-3.5 w-3.5' /> Добавить
				</button>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext items={roomIds} strategy={verticalListSortingStrategy}>
					<div className='space-y-2'>
						{rooms.map((room, idx) => (
							<SortableBlock key={roomIds[idx]} id={roomIds[idx]}>
								<div className='rounded-xl border border-border bg-muted/10 p-3'>
									<div className='flex items-start gap-3'>
										<div className='shrink-0'>
											<p className='mb-1 text-[10px] text-muted-foreground'>
												Фото
											</p>
											<RoomImagePicker
												imageKey={room.image}
												onChange={key => update(idx, { image: key })}
											/>
										</div>
										<div className='min-w-0 flex-1 space-y-2'>
											<div className='flex items-center justify-between'>
												<span className='text-xs font-medium text-foreground'>
													Комната {idx + 1}
												</span>
												<div className='flex items-center gap-1'>
													<button
														type='button'
														onClick={() => move(idx, -1)}
														disabled={idx === 0}
														className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
													>
														<ChevronUp className='h-3 w-3' />
													</button>
													<button
														type='button'
														onClick={() => move(idx, 1)}
														disabled={idx === rooms.length - 1}
														className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
													>
														<ChevronDown className='h-3 w-3' />
													</button>
													<button
														type='button'
														onClick={() =>
															setRooms(rooms.filter((_, i) => i !== idx))
														}
														className='rounded p-0.5 text-destructive/60 hover:text-destructive'
													>
														<Trash2 className='h-3 w-3' />
													</button>
												</div>
											</div>
											<div className='grid grid-cols-2 gap-2'>
												<Field label='Название'>
													<input
														className={inputCls}
														value={room.label}
														onChange={e =>
															update(idx, { label: e.target.value })
														}
														placeholder='В СПАЛЬНЮ'
													/>
												</Field>
												<div className='col-span-2'>
													<CatalogFilterLinkControls
														href={room.href}
														onHrefChange={href =>
															update(idx, { href: href ?? '' })
														}
														categoryId={room.linkCategoryId}
														onCategoryIdChange={id =>
															update(idx, { linkCategoryId: id })
														}
														propertyId={room.linkPropertyId}
														onPropertyIdChange={id =>
															update(idx, {
																linkPropertyId: id,
																linkPropertyValueId: undefined,
															})
														}
														propertyValueId={room.linkPropertyValueId}
														onPropertyValueIdChange={id =>
															update(idx, { linkPropertyValueId: id })
														}
														hrefLabel='Ссылка комнаты'
														hrefPlaceholder='/catalog?prop.room=bedroom'
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</SortableBlock>
						))}
					</div>
				</SortableContext>
			</DndContext>
			<p className='text-[10px] text-muted-foreground'>
				Если список пуст — будут использованы 7 стандартных комнат. Загружайте
				PNG, JPG, WebP или GIF.
			</p>
		</div>
	)
}

// ─── MinimalHeadingEditor ────────────────────────────────────────────────────

function MinimalHeadingEditor({
	value,
	onChange,
	placeholder,
	hint,
	showLimit,
	defaultLimit,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
	placeholder: string
	hint?: string
	showLimit?: boolean
	defaultLimit?: number
}) {
	return (
		<div className='space-y-3'>
			<Field label='Заголовок секции' hint={hint}>
				<input
					className={inputCls}
					value={(value.heading as string | undefined) ?? ''}
					onChange={e => onChange({ ...value, heading: e.target.value })}
					placeholder={placeholder}
				/>
			</Field>
			{showLimit && (
				<Field label='Лимит элементов'>
					<input
						type='number'
						min={1}
						max={48}
						className={inputCls}
						value={(value.limit as number | undefined) ?? defaultLimit ?? 8}
						onChange={e =>
							onChange({ ...value, limit: Number(e.target.value) })
						}
					/>
				</Field>
			)}
		</div>
	)
}

// ─── SimpleProductSectionEditor ───────────────────────────────────────────────

function SimpleProductSectionEditor({
	value,
	onChange,
	defaults,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
	defaults: {
		heading: string
		limit: number
		viewAllHref: string
		viewAllLabel: string
	}
}) {
	function set(key: string, val: unknown) {
		onChange({ ...value, [key]: val })
	}
	return (
		<div className='space-y-3'>
			<Field label='Заголовок секции'>
				<input
					className={inputCls}
					value={(value.heading as string | undefined) ?? ''}
					onChange={e => set('heading', e.target.value)}
					placeholder={defaults.heading}
				/>
			</Field>
			<div className='grid grid-cols-2 gap-3'>
				<Field label='Количество товаров'>
					<input
						type='number'
						min={1}
						max={48}
						className={inputCls}
						value={(value.limit as number | undefined) ?? defaults.limit}
						onChange={e => set('limit', Number(e.target.value))}
					/>
				</Field>
				<Field label='Текст ссылки'>
					<input
						className={inputCls}
						value={(value.viewAllLabel as string | undefined) ?? ''}
						onChange={e => set('viewAllLabel', e.target.value || undefined)}
						placeholder={defaults.viewAllLabel}
					/>
				</Field>
			</div>

			<CatalogFilterLinkControls
				href={(value.viewAllHref as string | undefined) ?? ''}
				onHrefChange={href => set('viewAllHref', href)}
				categoryId={value.linkCategoryId as string | undefined}
				onCategoryIdChange={id => set('linkCategoryId', id)}
				propertyId={value.linkPropertyId as string | undefined}
				onPropertyIdChange={id => set('linkPropertyId', id)}
				propertyValueId={value.linkPropertyValueId as string | undefined}
				onPropertyValueIdChange={id => set('linkPropertyValueId', id)}
				hrefLabel='Ссылка «Смотреть все»'
				hrefPlaceholder={defaults.viewAllHref}
			/>
		</div>
	)
}

// ─── PopularCategoriesConfigEditor ────────────────────────────────────────────

function PopularCategoriesConfigEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	function set(key: string, val: unknown) {
		onChange({ ...value, [key]: val })
	}
	return (
		<div className='space-y-3'>
			<Field label='Заголовок секции'>
				<input
					className={inputCls}
					value={(value.heading as string | undefined) ?? ''}
					onChange={e => set('heading', e.target.value)}
					placeholder='Популярные категории'
				/>
			</Field>
			<Field
				label='Максимум категорий (1–48)'
				hint='Берутся корневые категории сайта'
			>
				<input
					type='number'
					min={1}
					max={48}
					className={inputCls}
					value={(value.limit as number | undefined) ?? 7}
					onChange={e => set('limit', Number(e.target.value))}
				/>
			</Field>
		</div>
	)
}

// ─── Raw JSON ─────────────────────────────────────────────────────────────────

function RawJsonEditor({
	value,
	onChange,
}: {
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const [text, setText] = useState(() => JSON.stringify(value, null, 2))
	const [err, setErr] = useState<string | null>(null)

	function handleChange(next: string) {
		setText(next)
		try {
			onChange(JSON.parse(next))
			setErr(null)
		} catch {
			setErr('Некорректный JSON')
		}
	}

	return (
		<div>
			<textarea
				rows={10}
				className={textareaCls + ' font-mono text-xs'}
				value={text}
				onChange={e => handleChange(e.target.value)}
			/>
			{err && <p className='mt-1 text-[10px] text-destructive'>{err}</p>}
		</div>
	)
}

// ─── Public ───────────────────────────────────────────────────────────────────

const VISUAL_COMPONENTS = new Set([
	'Banner',
	'HeroBanner',
	'ProductGrid',
	'ProductGridSection',
	'BrandCarousel',
	'BrandsCarousel',
	'CategoryCarousel',
	'Advantages',
	'AboutText',
	'AboutSection',
	'PopularQueries',
	'RoomCategories',
	'NewProducts',
	'SaleProducts',
	'PopularProducts',
	'PopularCategories',
	'RecentlyViewed',
	'SeenProducts',
])

const NO_CONFIG_COMPONENTS = new Set<string>([])

export function SectionConfigEditor({
	componentName,
	value,
	onChange,
}: {
	componentName: string
	value: Record<string, unknown>
	onChange: (v: Record<string, unknown>) => void
}) {
	const [showRaw, setShowRaw] = useState(false)
	const hasVisual = VISUAL_COMPONENTS.has(componentName)
	const hasNoConfig = NO_CONFIG_COMPONENTS.has(componentName)
	const hasAnyEditor = hasVisual || hasNoConfig

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between'>
				<label className='block text-xs font-medium text-muted-foreground'>
					Настройки секции
				</label>
				<button
					type='button'
					onClick={() => setShowRaw(v => !v)}
					className='flex items-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
				>
					<Code2 className='h-3 w-3' />
					{showRaw
						? hasVisual
							? '← Визуальный редактор'
							: hasNoConfig
								? '← Описание секции'
								: '← Назад'
						: hasAnyEditor
							? 'Показать JSON'
							: 'Расширенный JSON'}
				</button>
			</div>

			{showRaw ? (
				<RawJsonEditor value={value} onChange={onChange} />
			) : hasNoConfig ? (
				<div className='rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3'>
					<p className='text-xs font-medium text-foreground'>
						Для этой секции нет обязательных настроек
					</p>
					<p className='mt-1 text-xs text-muted-foreground'>
						Секция работает из данных сайта автоматически. При необходимости
						можно открыть JSON в режиме разработчика.
					</p>
				</div>
			) : !hasAnyEditor ? (
				<div className='rounded-xl border border-dashed border-amber-300/50 bg-amber-500/5 px-4 py-3'>
					<p className='text-xs font-medium text-foreground'>
						Визуальный редактор для{' '}
						<span className='font-mono'>{componentName}</span> пока не добавлен
					</p>
					<p className='mt-1 text-xs text-muted-foreground'>
						Можно временно использовать «Расширенный JSON», а я добавлю
						отдельную форму под этот тип секции.
					</p>
				</div>
			) : (
				<>
					{(componentName === 'Banner' || componentName === 'HeroBanner') && (
						<BannerConfigEditor value={value} onChange={onChange} />
					)}
					{(componentName === 'ProductGrid' ||
						componentName === 'ProductGridSection') && (
						<ProductGridConfigEditor value={value} onChange={onChange} />
					)}
					{componentName === 'BrandCarousel' && (
						<BrandCarouselConfigEditor value={value} onChange={onChange} />
					)}
					{componentName === 'BrandsCarousel' && (
						<BrandCarouselConfigEditor value={value} onChange={onChange} />
					)}
					{componentName === 'CategoryCarousel' && (
						<CategoryCarouselConfigEditor value={value} onChange={onChange} />
					)}
					{componentName === 'Advantages' && (
						<AdvantagesConfigEditor value={value} onChange={onChange} />
					)}
					{(componentName === 'AboutText' ||
						componentName === 'AboutSection') && (
						<AboutTextConfigEditor value={value} onChange={onChange} />
					)}
					{componentName === 'PopularQueries' && (
						<PopularQueriesConfigEditor value={value} onChange={onChange} />
					)}
					{componentName === 'RoomCategories' && (
						<RoomCategoriesConfigEditor value={value} onChange={onChange} />
					)}
					{componentName === 'NewProducts' && (
						<SimpleProductSectionEditor
							value={value}
							onChange={onChange}
							defaults={{
								heading: 'Новинки',
								limit: 8,
								viewAllHref: '/new',
								viewAllLabel: 'Все новинки',
							}}
						/>
					)}
					{componentName === 'SaleProducts' && (
						<SimpleProductSectionEditor
							value={value}
							onChange={onChange}
							defaults={{
								heading: 'Акции и скидки',
								limit: 8,
								viewAllHref: '/clearance',
								viewAllLabel: 'Все акции',
							}}
						/>
					)}
					{componentName === 'PopularProducts' && (
						<SimpleProductSectionEditor
							value={value}
							onChange={onChange}
							defaults={{
								heading: 'Популярные товары',
								limit: 10,
								viewAllHref: '',
								viewAllLabel: 'Смотреть все',
							}}
						/>
					)}
					{componentName === 'PopularCategories' && (
						<PopularCategoriesConfigEditor value={value} onChange={onChange} />
					)}
					{(componentName === 'RecentlyViewed' ||
						componentName === 'SeenProducts') && (
						<MinimalHeadingEditor
							value={value}
							onChange={onChange}
							placeholder='Вы смотрели'
							hint='Данные берутся из истории просмотра пользователя автоматически'
							showLimit
							defaultLimit={4}
						/>
					)}
				</>
			)}
		</div>
	)
}

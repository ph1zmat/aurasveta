'use client'

import { useMemo, useState } from 'react'
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
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import {
	Plus,
	Pencil,
	Trash2,
	Eye,
	EyeOff,
	GripVertical,
	X,
	ChevronUp,
	ChevronDown,
	LayoutGrid,
} from 'lucide-react'
import { SectionConfigEditor } from './SectionConfigEditor'

type SectionItem = RouterOutputs['homeSection']['getAll'][number]
type SectionTypeItem = RouterOutputs['sectionType']['getAll'][number]
type SectionTypePreset = {
	name: string
	component: string
	description: string
	defaultTitle?: string
	defaultConfig: Record<string, unknown>
}

const inputCls =
	'flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

const SECTION_TYPE_PRESETS: SectionTypePreset[] = [
	{
		name: 'Баннер',
		component: 'Banner',
		description: 'Слайды с картинками, CTA и ссылками.',
		defaultTitle: 'Добро пожаловать',
		defaultConfig: {},
	},
	{
		name: 'Сетка товаров',
		component: 'ProductGrid',
		description: 'Подборка товаров по акции, новинкам, категории или свойству.',
		defaultTitle: 'Акции и скидки',
		defaultConfig: { source: 'promotion', limit: 8, cols: 4, sortBy: 'newest' },
	},
	{
		name: 'Карусель брендов по свойству',
		component: 'BrandCarousel',
		description: 'Показывает значения выбранного свойства как карточки-бренды.',
		defaultTitle: 'Бренды',
		defaultConfig: { propertySlug: 'brand', filterParam: 'brand' },
	},
	{
		name: 'Карусель категорий',
		component: 'CategoryCarousel',
		description: 'Показывает реальные категории из каталога.',
		defaultTitle: 'Категории',
		defaultConfig: { limit: 12, orderBy: 'name' },
	},
	{
		name: 'Преимущества',
		component: 'Advantages',
		description: 'Карточки преимуществ магазина.',
		defaultTitle: 'Наши преимущества',
		defaultConfig: {},
	},
	{
		name: 'О нас',
		component: 'AboutText',
		description: 'Текстовый блок с абзацами и раскрытием.',
		defaultTitle: 'О нас',
		defaultConfig: {},
	},
	{
		name: 'Популярные запросы',
		component: 'PopularQueries',
		description: 'Автоматически выводит популярные поисковые запросы.',
		defaultTitle: 'Популярные запросы',
		defaultConfig: { limit: 10 },
	},
	{
		name: 'Комнаты',
		component: 'RoomCategories',
		description: 'Карточки помещений с ссылками на реальные фильтры каталога.',
		defaultTitle: 'Товары по расположению',
		defaultConfig: {},
	},
	{
		name: 'Новинки',
		component: 'NewProducts',
		description: 'Автоматическая секция новых товаров.',
		defaultTitle: 'Новинки',
		defaultConfig: {
			heading: 'Новинки',
			limit: 8,
			viewAllLabel: 'Все новинки',
			viewAllHref: '/new',
		},
	},
	{
		name: 'Акции',
		component: 'SaleProducts',
		description: 'Автоматическая секция товаров со скидкой.',
		defaultTitle: 'Акции и скидки',
		defaultConfig: {
			heading: 'Акции и скидки',
			limit: 8,
			viewAllLabel: 'Все акции',
			viewAllHref: '/clearance',
		},
	},
	{
		name: 'Популярные товары',
		component: 'PopularProducts',
		description: 'Автоматическая секция популярных товаров.',
		defaultTitle: 'Популярные товары',
		defaultConfig: {
			heading: 'Популярные товары',
			limit: 10,
			viewAllLabel: 'Смотреть все',
		},
	},
	{
		name: 'Популярные категории',
		component: 'PopularCategories',
		description: 'Корневые категории каталога с лимитом.',
		defaultTitle: 'Популярные категории',
		defaultConfig: { heading: 'Популярные категории', limit: 7 },
	},
	{
		name: 'Вы смотрели',
		component: 'RecentlyViewed',
		description: 'Персональная секция истории просмотра пользователя.',
		defaultTitle: 'Вы смотрели',
		defaultConfig: { heading: 'Вы смотрели', limit: 4 },
	},
	{
		name: 'Карусель брендов из товаров',
		component: 'BrandsCarousel',
		description:
			'Показывает бренды как значения свойства brand с фото, а при отсутствии свойства использует fallback из товаров.',
		defaultTitle: 'Бренды',
		defaultConfig: {
			heading: 'Бренды',
			propertySlug: 'brand',
			filterParam: 'brand',
		},
	},
]

function getPresetByComponent(component?: string | null) {
	return SECTION_TYPE_PRESETS.find(preset => preset.component === component)
}

function clonePresetConfig(component?: string | null) {
	const preset = getPresetByComponent(component)
	return preset ? JSON.parse(JSON.stringify(preset.defaultConfig)) : {}
}

function SortableSectionRow({
	item,
	index,
	total,
	onMove,
	onToggleActive,
	onEdit,
	onDelete,
}: {
	item: SectionItem
	index: number
	total: number
	onMove: (index: number, dir: -1 | 1) => void
	onToggleActive: (id: string, next: boolean) => void
	onEdit: (item: SectionItem) => void
	onDelete: (item: SectionItem) => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
				isDragging
					? 'opacity-90'
					: item.isActive
						? 'border-border bg-card'
						: 'border-border/50 bg-muted/10 opacity-60'
			}`}
		>
			<button
				type='button'
				{...attributes}
				{...listeners}
				className='cursor-grab rounded p-1 text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing'
				title='Перетащить'
			>
				<GripVertical className='h-4 w-4 shrink-0' />
			</button>

			<div className='flex items-center gap-2'>
				<button
					type='button'
					onClick={() => onMove(index, -1)}
					disabled={index === 0}
					className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
				>
					<ChevronUp className='h-3.5 w-3.5' />
				</button>
				<button
					type='button'
					onClick={() => onMove(index, 1)}
					disabled={index === total - 1}
					className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
				>
					<ChevronDown className='h-3.5 w-3.5' />
				</button>
			</div>

			<span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-mono text-muted-foreground'>
				{index + 1}
			</span>

			<div className='min-w-0 flex-1'>
				<div className='flex items-center gap-2'>
					<span className='truncate text-sm font-medium text-foreground'>
						{item.title ?? item.sectionType.name}
					</span>
					<span className='shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground'>
						{item.sectionType.component}
					</span>
				</div>
			</div>

			<div className='flex shrink-0 items-center gap-1'>
				<button
					type='button'
					onClick={() => onToggleActive(item.id, !item.isActive)}
					className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
					title={item.isActive ? 'Скрыть' : 'Показать'}
				>
					{item.isActive ? (
						<Eye className='h-3.5 w-3.5' />
					) : (
						<EyeOff className='h-3.5 w-3.5' />
					)}
				</button>
				<button
					type='button'
					onClick={() => onEdit(item)}
					className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
				>
					<Pencil className='h-3.5 w-3.5' />
				</button>
				<button
					type='button'
					onClick={() => onDelete(item)}
					className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive'
				>
					<Trash2 className='h-3.5 w-3.5' />
				</button>
			</div>
		</div>
	)
}

export default function HomeSectionsClient() {
	const { data: sections, refetch } = trpc.homeSection.getAll.useQuery()
	const { data: sectionTypes, refetch: refetchSectionTypes } =
		trpc.sectionType.getAll.useQuery()

	const [showForm, setShowForm] = useState(false)
	const [showTypeForm, setShowTypeForm] = useState(false)
	const [editItem, setEditItem] = useState<SectionItem | null>(null)
	const [typeForm, setTypeForm] = useState({
		name: SECTION_TYPE_PRESETS[0]?.name ?? '',
		component: SECTION_TYPE_PRESETS[0]?.component ?? '',
	})
	const [form, setForm] = useState<{
		sectionTypeId: string
		title: string
		isActive: boolean
		config: Record<string, unknown>
	}>({
		sectionTypeId: '',
		title: '',
		isActive: true,
		config: {},
	})

	const sensors = useSensors(useSensor(PointerSensor))
	const existingPresetComponents = useMemo(
		() => new Set(sectionTypes?.map(type => type.component) ?? []),
		[sectionTypes],
	)
	const missingPresets = useMemo(
		() =>
			SECTION_TYPE_PRESETS.filter(
				preset => !existingPresetComponents.has(preset.component),
			),
		[existingPresetComponents],
	)
	const selectedTypePreset = useMemo(
		() => getPresetByComponent(typeForm.component),
		[typeForm.component],
	)

	const orderedSections = useMemo(() => sections ?? [], [sections])

	function closeForm() {
		setShowForm(false)
		setEditItem(null)
	}

	const createMut = trpc.homeSection.create.useMutation({
		onSuccess: () => {
			refetch()
			closeForm()
		},
	})
	const createTypeMut = trpc.sectionType.create.useMutation({
		onSuccess: created => {
			const preset = getPresetByComponent(created.component)
			refetchSectionTypes()
			setTypeForm({
				name: SECTION_TYPE_PRESETS[0]?.name ?? '',
				component: SECTION_TYPE_PRESETS[0]?.component ?? '',
			})
			setShowTypeForm(false)
			setForm(prev => ({
				...prev,
				sectionTypeId: created.id,
				title: prev.title || preset?.defaultTitle || created.name,
				config:
					Object.keys(prev.config).length > 0
						? prev.config
						: clonePresetConfig(created.component),
			}))
		},
	})
	const updateMut = trpc.homeSection.update.useMutation({
		onSuccess: () => {
			refetch()
			closeForm()
		},
	})
	const deleteMut = trpc.homeSection.delete.useMutation({
		onSuccess: () => refetch(),
	})
	const reorderMut = trpc.homeSection.reorder.useMutation({
		onSuccess: () => refetch(),
	})

	function persistOrder(items: SectionItem[]) {
		reorderMut.mutate(
			items.map((section, index) => ({ id: section.id, order: index })),
		)
	}

	function openCreate() {
		const firstType = sectionTypes?.[0]
		const preset = getPresetByComponent(firstType?.component)
		setEditItem(null)
		setForm({
			sectionTypeId: firstType?.id ?? '',
			title: preset?.defaultTitle ?? firstType?.name ?? '',
			isActive: true,
			config: clonePresetConfig(firstType?.component),
		})
		setShowForm(true)
	}

	function openCreateType(component?: string) {
		const preset = getPresetByComponent(component) ?? SECTION_TYPE_PRESETS[0]
		setTypeForm({
			name: preset?.name ?? '',
			component: preset?.component ?? '',
		})
		setShowTypeForm(true)
	}

	function createTypeFromPreset(preset: SectionTypePreset) {
		createTypeMut.mutate({
			name: preset.name,
			component: preset.component,
		})
	}

	function handleCreateType(e: React.FormEvent) {
		e.preventDefault()
		createTypeMut.mutate({
			name: typeForm.name.trim(),
			component: typeForm.component.trim(),
		})
	}

	function openEdit(section: SectionItem) {
		setEditItem(section)
		setForm({
			sectionTypeId: section.sectionTypeId,
			title: section.title ?? '',
			isActive: section.isActive,
			config: (section.config as Record<string, unknown>) ?? {},
		})
		setShowForm(true)
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (editItem) {
			updateMut.mutate({
				id: editItem.id,
				sectionTypeId:
					form.sectionTypeId !== editItem.sectionTypeId
						? form.sectionTypeId
						: undefined,
				title: form.title || undefined,
				isActive: form.isActive,
				config: form.config,
			})
			return
		}

		createMut.mutate({
			sectionTypeId: form.sectionTypeId,
			title: form.title || undefined,
			isActive: form.isActive,
			order: orderedSections.length,
			config: form.config,
		})
	}

	function moveSection(index: number, dir: -1 | 1) {
		const targetIndex = index + dir
		if (targetIndex < 0 || targetIndex >= orderedSections.length) return
		const next = arrayMove(orderedSections, index, targetIndex)
		persistOrder(next)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return

		const oldIndex = orderedSections.findIndex(s => s.id === String(active.id))
		const newIndex = orderedSections.findIndex(s => s.id === String(over.id))
		if (oldIndex === -1 || newIndex === -1) return

		const next = arrayMove(orderedSections, oldIndex, newIndex)
		persistOrder(next)
	}

	const currentComponentName =
		sectionTypes?.find(t => t.id === form.sectionTypeId)?.component ??
		editItem?.sectionType?.component ??
		''
	const currentTypePreset = getPresetByComponent(currentComponentName)

	const sortableIds = useMemo(
		() => orderedSections.map(section => section.id),
		[orderedSections],
	)

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Секции
				</h1>
				<Button variant='primary' size='sm' onClick={openCreate}>
					<Plus className='mr-1 h-4 w-4' /> Добавить секцию
				</Button>
			</div>

			{showTypeForm && (
				<div
					className='fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16'
					onClick={e => {
						if (e.target === e.currentTarget) setShowTypeForm(false)
					}}
				>
					<div className='flex w-full max-w-xl flex-col rounded-2xl border border-border bg-card shadow-2xl'>
						<div className='flex shrink-0 items-center justify-between border-b border-border px-6 py-4'>
							<h2 className='text-base font-semibold text-foreground'>
								Новый тип секции
							</h2>
							<button
								type='button'
								onClick={() => setShowTypeForm(false)}
								className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
							>
								<X className='h-4 w-4' />
							</button>
						</div>

						<form
							id='section-type-form'
							onSubmit={handleCreateType}
							className='space-y-4 px-6 py-5'
						>
							<div>
								<label className='mb-1 block text-xs font-medium text-muted-foreground'>
									Поддерживаемый компонент
								</label>
								<select
									required
									value={typeForm.component}
									onChange={e => {
										const preset = getPresetByComponent(e.target.value)
										setTypeForm({
											name: preset?.name ?? '',
											component: preset?.component ?? e.target.value,
										})
									}}
									className={inputCls}
								>
									{SECTION_TYPE_PRESETS.map(preset => (
										<option key={preset.component} value={preset.component}>
											{preset.name} ({preset.component})
										</option>
									))}
								</select>
								{selectedTypePreset && (
									<p className='mt-1 text-[10px] text-muted-foreground'>
										{selectedTypePreset.description}
									</p>
								)}
							</div>

							<div>
								<label className='mb-1 block text-xs font-medium text-muted-foreground'>
									Название
								</label>
								<input
									required
									value={typeForm.name}
									onChange={e =>
										setTypeForm(prev => ({ ...prev, name: e.target.value }))
									}
									placeholder='Баннер'
									className={inputCls}
								/>
							</div>

							<div>
								<label className='mb-1 block text-xs font-medium text-muted-foreground'>
									Ключ компонента
								</label>
								<input
									required
									value={typeForm.component}
									onChange={e =>
										setTypeForm(prev => ({
											...prev,
											component: e.target.value,
										}))
									}
									placeholder='Banner'
									className={`${inputCls} font-mono`}
								/>
								<p className='mt-1 text-[10px] text-muted-foreground'>
									Тип создаётся только для реально поддерживаемого компонента,
									поэтому обычно менять это поле не нужно.
								</p>
								{existingPresetComponents.has(typeForm.component) && (
									<p className='mt-1 text-[10px] text-amber-600'>
										Этот тип уже создан в базе. Дубликат по компоненту не нужен.
									</p>
								)}
							</div>

							<div className='rounded-xl border border-dashed border-border bg-muted/10 px-4 py-3'>
								<p className='text-xs font-medium text-foreground'>
									Источник правды — реальные компоненты сайта
								</p>
								<p className='mt-1 text-xs text-muted-foreground'>
									Сейчас в проекте поддерживается {SECTION_TYPE_PRESETS.length}{' '}
									готовых типа секций, из них уже создано{' '}
									{existingPresetComponents.size}.
								</p>
							</div>
						</form>

						<div className='flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4'>
							<Button
								variant='ghost'
								type='button'
								size='sm'
								onClick={() => setShowTypeForm(false)}
							>
								Отмена
							</Button>
							<Button
								variant='primary'
								type='submit'
								form='section-type-form'
								size='sm'
								disabled={
									createTypeMut.isPending ||
									existingPresetComponents.has(typeForm.component)
								}
							>
								Создать тип
							</Button>
						</div>
					</div>
				</div>
			)}

			{showForm && (
				<div
					className='fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 h-full overflow-y-auto'
					onClick={e => {
						if (e.target === e.currentTarget) closeForm()
					}}
				>
					<div className='flex w-full max-w-2xl max-h-[80vh] flex-col rounded-2xl border border-border bg-card shadow-2xl'>
						<div className='flex shrink-0 items-center justify-between border-b border-border px-6 py-4'>
							<h2 className='text-base font-semibold text-foreground'>
								{editItem ? 'Редактировать секцию' : 'Новая секция'}
							</h2>
							<button
								type='button'
								onClick={closeForm}
								className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
							>
								<X className='h-4 w-4' />
							</button>
						</div>

						<div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
							<form
								id='section-form'
								onSubmit={handleSubmit}
								className='space-y-4'
							>
								<div>
									<div className='mb-1 flex items-center justify-between'>
										<label className='block text-xs font-medium text-muted-foreground'>
											Тип секции
										</label>
										<button
											type='button'
											onClick={() => openCreateType(currentComponentName)}
											className='text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
										>
											+ Новый тип
										</button>
									</div>
									<select
										required
										value={form.sectionTypeId}
										onChange={e => {
											const nextType = sectionTypes?.find(
												type => type.id === e.target.value,
											)
											const preset = getPresetByComponent(nextType?.component)
											setForm(f => ({
												...f,
												sectionTypeId: e.target.value,
												title:
													!editItem || !f.title
														? (preset?.defaultTitle ?? nextType?.name ?? '')
														: f.title,
												config: clonePresetConfig(nextType?.component),
											}))
										}}
										className={inputCls}
									>
										<option value=''>Выберите тип...</option>
										{sectionTypes?.map((type: SectionTypeItem) => (
											<option key={type.id} value={type.id}>
												{type.name} ({type.component})
											</option>
										))}
									</select>
									{editItem && (
										<p className='mt-1 text-[10px] text-muted-foreground'>
											Теперь тип можно менять и при редактировании. При смене
											типа настройки секции переключаются на конфиг нового
											компонента.
										</p>
									)}
									{(!sectionTypes || sectionTypes.length === 0) && (
										<div className='mt-2 rounded-xl border border-dashed border-border bg-muted/10 p-3'>
											<p className='text-xs font-medium text-foreground'>
												Нет доступных типов секций в базе
											</p>
											<p className='mt-1 text-[10px] text-muted-foreground'>
												Ниже — реальные поддерживаемые компоненты сайта.
												Создайте тип из них в один клик.
											</p>
											<div className='mt-3 flex flex-wrap gap-2'>
												{missingPresets.slice(0, 8).map(preset => (
													<button
														key={preset.component}
														type='button'
														onClick={() => createTypeFromPreset(preset)}
														className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
													>
														+ {preset.name}
													</button>
												))}
											</div>
										</div>
									)}
								</div>

								<div>
									<label className='mb-1 block text-xs font-medium text-muted-foreground'>
										Заголовок (опционально)
									</label>
									<input
										value={form.title}
										onChange={e =>
											setForm(f => ({ ...f, title: e.target.value }))
										}
										placeholder='Переопределить заголовок секции'
										className={inputCls}
									/>
									{currentTypePreset && !form.title && (
										<p className='mt-1 text-[10px] text-muted-foreground'>
											По умолчанию будет использован заголовок типа:{' '}
											{currentTypePreset.defaultTitle ?? currentTypePreset.name}
											.
										</p>
									)}
								</div>

								{currentComponentName && (
									<SectionConfigEditor
										componentName={currentComponentName}
										value={form.config}
										onChange={config => setForm(f => ({ ...f, config }))}
									/>
								)}

								<div className='flex items-center gap-2 pt-1'>
									<input
										type='checkbox'
										id='isActive'
										checked={form.isActive}
										onChange={e =>
											setForm(f => ({ ...f, isActive: e.target.checked }))
										}
										className='h-4 w-4 rounded border-border accent-primary'
									/>
									<label htmlFor='isActive' className='text-sm text-foreground'>
										Активна
									</label>
								</div>
							</form>
						</div>

						<div className='flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4'>
							<Button
								variant='ghost'
								type='button'
								size='sm'
								onClick={closeForm}
							>
								Отмена
							</Button>
							<Button
								variant='primary'
								type='submit'
								form='section-form'
								size='sm'
								disabled={createMut.isPending || updateMut.isPending}
							>
								{editItem ? 'Сохранить' : 'Создать'}
							</Button>
						</div>
					</div>
				</div>
			)}

			{orderedSections.length > 0 ? (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={sortableIds}
						strategy={verticalListSortingStrategy}
					>
						<div className='flex flex-col gap-2'>
							{orderedSections.map((section, index) => (
								<SortableSectionRow
									key={section.id}
									item={section}
									index={index}
									total={orderedSections.length}
									onMove={moveSection}
									onToggleActive={(id, next) =>
										updateMut.mutate({ id, isActive: next })
									}
									onEdit={openEdit}
									onDelete={item => {
										if (
											confirm(
												`Удалить секцию "${item.title ?? item.sectionType.name}"?`,
											)
										) {
											deleteMut.mutate(item.id)
										}
									}}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			) : (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
					<LayoutGrid className='mb-3 h-10 w-10 text-muted-foreground/30' />
					<p className='mb-4 text-sm text-muted-foreground'>Нет секций</p>
					{sectionTypes && sectionTypes.length === 0 && (
						<div className='space-y-3 text-center'>
							<p className='text-xs text-muted-foreground/60'>
								Сначала создайте тип секции из реально поддерживаемых
								компонентов сайта.
							</p>
							<div className='flex max-w-2xl flex-wrap justify-center gap-2 px-6'>
								{missingPresets.slice(0, 6).map(preset => (
									<button
										key={preset.component}
										type='button'
										onClick={() => createTypeFromPreset(preset)}
										className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
									>
										+ {preset.name}
									</button>
								))}
							</div>
						</div>
					)}
					<Button
						variant='primary'
						size='sm'
						onClick={() => {
							if (sectionTypes?.length) {
								openCreate()
								return
							}
							openCreateType()
						}}
					>
						<Plus className='mr-1 h-4 w-4' /> Создать первую секцию
					</Button>
				</div>
			)}
		</div>
	)
}

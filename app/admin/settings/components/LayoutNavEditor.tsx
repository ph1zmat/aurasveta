'use client'

import { useState, useCallback, useEffect } from 'react'
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core'
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
	arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SiteNavZone } from '@prisma/client'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
	GripVertical,
	Plus,
	Trash2,
	Save,
	Loader2,
	Eye,
	EyeOff,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

// ─── Типы ────────────────────────────────────────────────────────────────────

interface NavPage {
	id: string
	title: string
	slug: string
	status: string
	kind: string
}

interface NavItemState {
	tempId: string // локальный id для dnd
	pageId: string
	labelOverride: string
	isVisible: boolean
}

interface ZoneEditorProps {
	zone: SiteNavZone
	label: string
	items: NavItemState[]
	pages: NavPage[]
	onChange: (zone: SiteNavZone, items: NavItemState[]) => void
}

const ZONE_LABELS: Record<SiteNavZone, string> = {
	HEADER_TOP_LEFT: 'Хедер — слева (сервисные ссылки)',
	HEADER_TOP_RIGHT: 'Хедер — справа',
	FOOTER_ABOUT: 'Футер — О магазине',
	FOOTER_SERVICE: 'Футер — Сервис',
	FOOTER_BRANDS: 'Футер — Бренды',
}

// ─── Отдельный элемент (sortable) ────────────────────────────────────────────

function SortableNavItem({
	item,
	pages,
	onUpdate,
	onRemove,
}: {
	item: NavItemState
	pages: NavPage[]
	onUpdate: (tempId: string, patch: Partial<NavItemState>) => void
	onRemove: (tempId: string) => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: item.tempId,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	const selectedPage = pages.find(p => p.id === item.pageId)

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				'flex items-center gap-2 rounded-md border border-border bg-background p-2',
				!item.isVisible && 'opacity-50',
			)}
		>
			<button
				type='button'
				className='cursor-grab touch-none text-muted-foreground hover:text-foreground'
				{...attributes}
				{...listeners}
			>
				<GripVertical className='h-4 w-4' />
			</button>

			{/* Выбор страницы */}
			<Select
				value={item.pageId}
				onValueChange={v => onUpdate(item.tempId, { pageId: v })}
			>
				<SelectTrigger className='h-8 flex-1 min-w-0'>
					<SelectValue placeholder='Выберите страницу...' />
				</SelectTrigger>
				<SelectContent>
					{pages.map(p => (
						<SelectItem key={p.id} value={p.id}>
							<span className='truncate'>{p.title}</span>
							{p.status === 'DRAFT' && (
								<Badge variant='secondary' className='ml-1 text-[10px]'>
									Черновик
								</Badge>
							)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* Кастомный ярлык */}
			<Input
				className='h-8 w-32 shrink-0'
				placeholder={selectedPage?.title ?? 'Ярлык'}
				value={item.labelOverride}
				onChange={e => onUpdate(item.tempId, { labelOverride: e.target.value })}
				title='Переопределить подпись ссылки'
			/>

			{/* Видимость */}
			<button
				type='button'
				title={item.isVisible ? 'Скрыть' : 'Показать'}
				className='shrink-0 text-muted-foreground hover:text-foreground transition-colors'
				onClick={() => onUpdate(item.tempId, { isVisible: !item.isVisible })}
			>
				{item.isVisible ? (
					<Eye className='h-4 w-4' />
				) : (
					<EyeOff className='h-4 w-4' />
				)}
			</button>

			{/* Удалить */}
			<button
				type='button'
				className='shrink-0 text-destructive hover:text-destructive/80 transition-colors'
				onClick={() => onRemove(item.tempId)}
			>
				<Trash2 className='h-4 w-4' />
			</button>
		</div>
	)
}

// ─── Редактор одной зоны ─────────────────────────────────────────────────────

function ZoneEditor({ zone, label, items, pages, onChange }: ZoneEditorProps) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		if (!over || active.id === over.id) return
		const oldIndex = items.findIndex(i => i.tempId === active.id)
		const newIndex = items.findIndex(i => i.tempId === over.id)
		onChange(zone, arrayMove(items, oldIndex, newIndex))
	}

	const handleUpdate = (tempId: string, patch: Partial<NavItemState>) => {
		onChange(
			zone,
			items.map(i => (i.tempId === tempId ? { ...i, ...patch } : i)),
		)
	}

	const handleRemove = (tempId: string) => {
		onChange(
			zone,
			items.filter(i => i.tempId !== tempId),
		)
	}

	const handleAdd = () => {
		onChange(zone, [
			...items,
			{
				tempId: `new-${Date.now()}`,
				pageId: '',
				labelOverride: '',
				isVisible: true,
			},
		])
	}

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium'>{label}</span>
				<Button variant='ghost' size='sm' onClick={handleAdd}>
					<Plus className='h-3.5 w-3.5 mr-1' />
					Добавить
				</Button>
			</div>

			{items.length === 0 && (
				<p className='text-xs text-muted-foreground py-2 pl-1'>
					Нет пунктов — нажмите «Добавить»
				</p>
			)}

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={items.map(i => i.tempId)}
					strategy={verticalListSortingStrategy}
				>
					<div className='space-y-1.5'>
						{items.map(item => (
							<SortableNavItem
								key={item.tempId}
								item={item}
								pages={pages}
								onUpdate={handleUpdate}
								onRemove={handleRemove}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	)
}

// ─── Главный компонент ────────────────────────────────────────────────────────

type ZoneMap = Record<SiteNavZone, NavItemState[]>

interface InfoVisibility {
	showPhone: boolean
	showAdditionalPhone: boolean
	showEmail: boolean
	showAddress: boolean
	showWorkingHours: boolean
	showSocialLinks: boolean
}

const DEFAULT_HEADER_VIS: InfoVisibility = {
	showPhone: true,
	showAdditionalPhone: true,
	showEmail: false,
	showAddress: false,
	showWorkingHours: true,
	showSocialLinks: false,
}

const DEFAULT_FOOTER_VIS: InfoVisibility = {
	showPhone: true,
	showAdditionalPhone: true,
	showEmail: true,
	showAddress: true,
	showWorkingHours: true,
	showSocialLinks: true,
}

function zoneMapFromItems(
	items: {
		id: string
		zone: SiteNavZone
		pageId: string
		labelOverride: string | null
		isVisible: boolean
	}[],
): ZoneMap {
	const map = Object.fromEntries(
		Object.values(SiteNavZone).map(z => [z, []]),
	) as unknown as ZoneMap
	for (const item of items) {
		map[item.zone].push({
			tempId: item.id,
			pageId: item.pageId,
			labelOverride: item.labelOverride ?? '',
			isVisible: item.isVisible,
		})
	}
	return map
}

const HEADER_ZONES: SiteNavZone[] = ['HEADER_TOP_LEFT', 'HEADER_TOP_RIGHT']
const FOOTER_ZONES: SiteNavZone[] = [
	'FOOTER_ABOUT',
	'FOOTER_SERVICE',
	'FOOTER_BRANDS',
]

const VIS_ITEMS: { key: keyof InfoVisibility; label: string }[] = [
	{ key: 'showPhone', label: 'Основной телефон' },
	{ key: 'showAdditionalPhone', label: 'Дополнительный телефон' },
	{ key: 'showEmail', label: 'Email' },
	{ key: 'showAddress', label: 'Адрес' },
	{ key: 'showWorkingHours', label: 'Часы работы' },
	{ key: 'showSocialLinks', label: 'Социальные сети' },
]

export default function LayoutNavEditor({
	scope,
}: {
	scope: 'header' | 'footer'
}) {
	const activeZones = scope === 'header' ? HEADER_ZONES : FOOTER_ZONES

	const {
		data: config,
		refetch,
		isLoading,
	} = trpc.siteNavigation.getLayoutConfig.useQuery()
	const { data: pages = [] } = trpc.siteNavigation.listPagesForNav.useQuery()

	const { mutate: saveZone, isPending: isSavingZone } =
		trpc.siteNavigation.saveZoneItems.useMutation({
			onSuccess: () => {
				toast.success('Зона сохранена')
				refetch()
			},
			onError: e => toast.error(e.message),
		})

	const { mutate: saveVisibility, isPending: isSavingVis } =
		trpc.siteNavigation.saveVisibilityConfig.useMutation({
			onSuccess: () => {
				toast.success('Видимость сохранена')
				refetch()
			},
			onError: e => toast.error(e.message),
		})

	const [zones, setZones] = useState<ZoneMap>(
		() =>
			Object.fromEntries(
				Object.values(SiteNavZone).map(z => [z, []]),
			) as unknown as ZoneMap,
	)
	const [headerVis, setHeaderVis] = useState<InfoVisibility>(DEFAULT_HEADER_VIS)
	const [footerVis, setFooterVis] = useState<InfoVisibility>(DEFAULT_FOOTER_VIS)
	const [dirtyZones, setDirtyZones] = useState<Set<SiteNavZone>>(new Set())
	const [dirtyVis, setDirtyVis] = useState(false)

	useEffect(() => {
		if (!config) return
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setZones(zoneMapFromItems(config.navItems))
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setHeaderVis({
			...DEFAULT_HEADER_VIS,
			...(config.headerConfig as Partial<InfoVisibility>),
		})
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setFooterVis({
			...DEFAULT_FOOTER_VIS,
			...(config.footerConfig as Partial<InfoVisibility>),
		})
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setDirtyZones(new Set())
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setDirtyVis(false)
	}, [config])

	const handleZoneChange = useCallback(
		(zone: SiteNavZone, items: NavItemState[]) => {
			setZones(prev => ({ ...prev, [zone]: items }))
			setDirtyZones(prev => new Set([...prev, zone]))
		},
		[],
	)

	const handleSaveZone = (zone: SiteNavZone) => {
		const items = zones[zone]
		const valid = items.filter(i => i.pageId)
		if (valid.length !== items.length) {
			toast.error('Заполните страницу для каждого пункта')
			return
		}
		saveZone({
			zone,
			items: valid.map(item => ({
				pageId: item.pageId,
				zone,
				labelOverride: item.labelOverride || null,
				isVisible: item.isVisible,
				order: 0,
			})),
		})
		setDirtyZones(prev => {
			const s = new Set(prev)
			s.delete(zone)
			return s
		})
	}

	const handleSaveVisibility = () => {
		saveVisibility({ header: headerVis, footer: footerVis })
		setDirtyVis(false)
	}

	const setHeaderVisField = (key: keyof InfoVisibility, value: boolean) => {
		setHeaderVis(prev => ({ ...prev, [key]: value }))
		setDirtyVis(true)
	}

	const setFooterVisField = (key: keyof InfoVisibility, value: boolean) => {
		setFooterVis(prev => ({ ...prev, [key]: value }))
		setDirtyVis(true)
	}

	if (isLoading) {
		return (
			<div className='flex items-center gap-2 py-8 text-muted-foreground'>
				<Loader2 className='h-5 w-5 animate-spin' />
				Загрузка конфигурации...
			</div>
		)
	}

	const isSaving = isSavingZone || isSavingVis

	return (
		<div className='space-y-4'>
			{/* ─── Ссылки по зонам ─── */}
			{activeZones.map(zone => (
				<Card key={zone} className='border-border'>
					<CardHeader className='flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-bold'>
							{ZONE_LABELS[zone]}
						</CardTitle>
						<Button
							size='sm'
							variant={dirtyZones.has(zone) ? 'default' : 'outline'}
							onClick={() => handleSaveZone(zone)}
							disabled={isSaving || !dirtyZones.has(zone)}
						>
							{isSavingZone ? (
								<Loader2 className='h-3.5 w-3.5 mr-1 animate-spin' />
							) : (
								<Save className='h-3.5 w-3.5 mr-1' />
							)}
							Сохранить зону
						</Button>
					</CardHeader>
					<CardContent>
						<ZoneEditor
							zone={zone}
							label=''
							items={zones[zone]}
							pages={pages}
							onChange={handleZoneChange}
						/>
					</CardContent>
				</Card>
			))}

			{/* ─── Видимость инфо-элементов ─── */}
			<Card className='border-border'>
				<CardHeader className='flex-row items-center justify-between pb-2'>
					<CardTitle className='text-sm font-bold'>
						Контакты и инфо-блоки
					</CardTitle>
					<Button
						size='sm'
						variant={dirtyVis ? 'default' : 'outline'}
						onClick={handleSaveVisibility}
						disabled={isSaving || !dirtyVis}
					>
						{isSavingVis ? (
							<Loader2 className='h-3.5 w-3.5 mr-1 animate-spin' />
						) : (
							<Save className='h-3.5 w-3.5 mr-1' />
						)}
						Сохранить видимость
					</Button>
				</CardHeader>
				<CardContent>
					<div className='text-xs text-muted-foreground mb-3'>
						{scope === 'header'
							? 'Управляйте отображением контактных блоков в хедере.'
							: 'Управляйте отображением контактных блоков в футере.'}
					</div>
					{VIS_ITEMS.map(({ key, label }) => {
						const vis = scope === 'header' ? headerVis : footerVis
						const setField =
							scope === 'header' ? setHeaderVisField : setFooterVisField
						return (
							<div
								key={key}
								className='flex items-center justify-between py-2 border-b border-border last:border-0'
							>
								<span className='text-sm'>{label}</span>
								<Switch
									checked={vis[key]}
									onCheckedChange={v => setField(key, v)}
								/>
							</div>
						)
					})}
				</CardContent>
			</Card>
		</div>
	)
}

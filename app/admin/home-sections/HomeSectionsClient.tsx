'use client'

import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
} from '@dnd-kit/core'
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	useSortable,
	arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
	GripVertical,
	Pencil,
	Trash2,
	Plus,
	Monitor,
	Smartphone,
	Save,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const SectionFormModal = dynamic(() => import('./SectionFormModal'))

type Section = {
	id: string
	title: string | null
	order: number
	isActive: boolean
	config: unknown
	sectionTypeId: string
	sectionType?: { id: string; name: string; component: string } | null
}

function SortableCard({
	section,
	onEdit,
	onDelete,
	onToggle,
}: {
	section: Section
	onEdit: (s: Section) => void
	onDelete: (id: string) => void
	onToggle: (id: string, val: boolean) => void
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: section.id })

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	}

	return (
		<div ref={setNodeRef} style={style}>
			<Card className='border-border mb-2'>
				<CardHeader className='flex flex-row items-center gap-2 py-3 px-4'>
					<button
						{...attributes}
						{...listeners}
						className='cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none'
						tabIndex={-1}
					>
						<GripVertical className='h-4 w-4' />
					</button>
					<div className='flex-1 flex items-center gap-2 min-w-0'>
						<Badge variant='secondary' className='text-[10px] shrink-0'>
							{section.sectionType?.name ?? section.sectionTypeId}
						</Badge>
						<span className='text-sm font-medium truncate'>
							{section.title ?? '—'}
						</span>
					</div>
					<div className='flex items-center gap-1 shrink-0'>
						<Switch
							checked={section.isActive}
							onCheckedChange={(v) => onToggle(section.id, v)}
						/>
						<Button
							variant='ghost'
							size='icon'
							className='h-7 w-7'
							onClick={() => onEdit(section)}
						>
							<Pencil className='h-3.5 w-3.5' />
						</Button>
						<Button
							variant='ghost'
							size='icon'
							className='h-7 w-7 text-destructive hover:text-destructive'
							onClick={() => onDelete(section.id)}
						>
							<Trash2 className='h-3.5 w-3.5' />
						</Button>
					</div>
				</CardHeader>
			</Card>
		</div>
	)
}

export default function HomeSectionsClient() {
	const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
	const [editingSection, setEditingSection] = useState<Section | null>(null)
	const [localOrder, setLocalOrder] = useState<string[] | null>(null)
	const [activeId, setActiveId] = useState<string | null>(null)
	const [dirty, setDirty] = useState(false)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const { data: sections, refetch } = trpc.homeSection.getAll.useQuery()
	const { data: sectionTypes } = trpc.sectionType.getAll.useQuery()

	const { mutate: createSection } = trpc.homeSection.create.useMutation({
		onSuccess: () => {
			toast.success('Секция добавлена')
			refetch()
			setLocalOrder(null)
		},
	})
	const { mutate: updateSection } = trpc.homeSection.update.useMutation({
		onSuccess: () => {
			toast.success('Секция обновлена')
			refetch()
			setEditingSection(null)
		},
	})
	const { mutate: deleteSection } = trpc.homeSection.delete.useMutation({
		onSuccess: () => {
			toast.success('Секция удалена')
			refetch()
			setLocalOrder(null)
		},
	})
	const { mutate: reorder, isPending: reordering } = trpc.homeSection.reorder.useMutation({
		onSuccess: () => {
			toast.success('Порядок сохранён')
			refetch()
			setLocalOrder(null)
			setDirty(false)
		},
	})

	const sorted = [...(sections ?? [])].sort((a, b) => a.order - b.order)
	const displayIds = localOrder ?? sorted.map((s) => s.id)
	const displaySections = displayIds
		.map((id) => sorted.find((s) => s.id === id))
		.filter(Boolean) as Section[]

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(String(event.active.id))
	}, [])

	/* eslint-disable react-hooks/preserve-manual-memoization */
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event
			setActiveId(null)
			if (!over || active.id === over.id) return
			const oldIndex = displayIds.indexOf(String(active.id))
			const newIndex = displayIds.indexOf(String(over.id))
			if (oldIndex === -1 || newIndex === -1) return
			const newOrder = arrayMove(displayIds, oldIndex, newIndex)
			setLocalOrder(newOrder)
			setDirty(true)
		},
		[displayIds],
	)
	/* eslint-enable react-hooks/preserve-manual-memoization */

	const handlePublish = () => {
		const ids = localOrder ?? sorted.map((s) => s.id)
		reorder(ids.map((id, i) => ({ id, order: i })))
	}

	const handleAdd = (typeId: string) => {
		createSection({
			sectionTypeId: typeId,
			title: 'Новая секция',
			order: sorted.length,
		})
	}

	const activeSection = activeId ? sorted.find((s) => s.id === activeId) : null

	return (
		<div className='space-y-4'>
			{/* Header */}
			<div className='flex items-center justify-between flex-wrap gap-2'>
				<div>
					<h1 className='text-xl font-bold'>Главная страница</h1>
					<p className='text-sm text-muted-foreground'>
						{sorted.length} секций · перетащите для изменения порядка
					</p>
				</div>
				<div className='flex items-center gap-2'>
					{dirty && (
						<span className='text-xs text-warning font-medium'>Несохранённые изменения</span>
					)}
					{dirty && (
						<Button size='sm' onClick={handlePublish} disabled={reordering}>
							<Save className='h-4 w-4 mr-1' />
							{reordering ? 'Сохранение...' : 'Сохранить порядок'}
						</Button>
					)}
					{/* Device toggle */}
					<div className='flex rounded-md border border-border overflow-hidden'>
						<button
							className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
								device === 'desktop'
									? 'bg-accent text-accent-foreground'
									: 'hover:bg-secondary text-muted-foreground'
							}`}
							onClick={() => setDevice('desktop')}
						>
							<Monitor className='h-4 w-4' />
							<span className='hidden sm:inline'>Desktop</span>
						</button>
						<button
							className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
								device === 'mobile'
									? 'bg-accent text-accent-foreground'
									: 'hover:bg-secondary text-muted-foreground'
							}`}
							onClick={() => setDevice('mobile')}
						>
							<Smartphone className='h-4 w-4' />
							<span className='hidden sm:inline'>Mobile</span>
						</button>
					</div>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4'>
				{/* Library */}
				<Card className='border-border h-fit'>
					<CardHeader className='pb-2'>
						<CardTitle className='text-base font-bold'>Типы секций</CardTitle>
					</CardHeader>
					<CardContent className='space-y-2 p-3'>
						{(sectionTypes ?? []).map((st) => (
							<div
								key={st.id}
								className='flex items-center gap-2 p-2.5 rounded-md border border-border bg-card hover:border-accent hover:bg-accent/5 transition-colors'
							>
								<div className='flex-1 min-w-0'>
									<div className='text-sm font-medium'>{st.name}</div>
									<div className='text-xs text-muted-foreground'>{st.component}</div>
								</div>
								<Button
									size='icon'
									variant='ghost'
									className='h-7 w-7 shrink-0'
									onClick={() => handleAdd(st.id)}
								>
									<Plus className='h-3.5 w-3.5' />
								</Button>
							</div>
						))}
						{(sectionTypes ?? []).length === 0 && (
							<div className='text-xs text-muted-foreground text-center py-4'>Нет типов секций</div>
						)}
					</CardContent>
				</Card>

				{/* Canvas */}
				<div
					className={`transition-all duration-300 ${device === 'mobile' ? 'max-w-[390px] mx-auto w-full' : ''}`}
				>
					<div className='flex items-center justify-between mb-3 px-1'>
						<span className='text-xs text-muted-foreground font-medium uppercase tracking-wider'>
							{device === 'mobile' ? 'Мобильный вид · 390px' : 'Полный вид'}
						</span>
						<span className='text-xs text-muted-foreground'>{sorted.length} секций</span>
					</div>

					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
					>
						<SortableContext items={displayIds} strategy={verticalListSortingStrategy}>
							{displaySections.map((section) => (
								<SortableCard
									key={section.id}
									section={section}
									onEdit={(s) => setEditingSection(s)}
									onDelete={(id) => deleteSection(id)}
									onToggle={(id, val) => updateSection({ id, isActive: val })}
								/>
							))}
						</SortableContext>

						<DragOverlay>
							{activeSection && (
								<Card className='border-accent shadow-xl bg-card opacity-95'>
									<CardHeader className='flex flex-row items-center gap-2 py-3 px-4'>
										<GripVertical className='h-4 w-4 text-muted-foreground' />
										<Badge variant='secondary' className='text-[10px]'>
											{activeSection.sectionType?.name ?? activeSection.sectionTypeId}
										</Badge>
										<span className='text-sm font-medium'>{activeSection.title ?? '—'}</span>
									</CardHeader>
								</Card>
							)}
						</DragOverlay>
					</DndContext>

					{sorted.length === 0 && (
						<div className='border-2 border-dashed border-border rounded-xl py-16 text-center text-muted-foreground text-sm'>
							<Plus className='h-8 w-8 mx-auto mb-2 opacity-30' />
							Добавьте секции из библиотеки слева
						</div>
					)}
				</div>
			</div>

			{/* Type-specific edit modal */}
			{editingSection && (
				<SectionFormModal
					section={editingSection}
					onSave={({ title, config }) =>
						updateSection({ id: editingSection.id, title, config })
					}
					onClose={() => setEditingSection(null)}
				/>
			)}
		</div>
	)
}

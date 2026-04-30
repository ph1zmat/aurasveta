'use client'

import type { ReactNode } from 'react'
import {
	DndContext,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core'
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableListProps<T> {
	items: T[]
	getId: (item: T) => string
	onReorder: (items: T[]) => void
	renderItem: (item: T, index: number) => ReactNode
	emptyState?: ReactNode
	disabled?: boolean
}

interface SortableRowProps {
	id: string
	children: ReactNode
	disabled?: boolean
}

function SortableRow({ id, children, disabled }: SortableRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ id, disabled })

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			className='flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 p-3'
		>
			<button
				type='button'
				className='mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-40'
				aria-label='Перетащить элемент'
				disabled={disabled}
				{...attributes}
				{...listeners}
			>
				<GripVertical className='h-4 w-4' />
			</button>
			<div className='min-w-0 flex-1'>{children}</div>
		</div>
	)
}

export function SortableList<T>({
	items,
	getId,
	onReorder,
	renderItem,
	emptyState,
	disabled,
}: SortableListProps<T>) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 },
		}),
	)
	const ids = items.map(getId)

	function handleDragEnd(event: DragEndEvent) {
		if (disabled) return
		const { active, over } = event
		if (!over || active.id === over.id) return

		const oldIndex = ids.indexOf(String(active.id))
		const newIndex = ids.indexOf(String(over.id))
		if (oldIndex < 0 || newIndex < 0) return

		onReorder(arrayMove(items, oldIndex, newIndex))
	}

	if (items.length === 0) {
		return emptyState ? <>{emptyState}</> : null
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext items={ids} strategy={verticalListSortingStrategy}>
				<div className='space-y-3'>
					{items.map((item, index) => (
						<SortableRow
							key={getId(item)}
							id={getId(item)}
							disabled={disabled}
						>
							{renderItem(item, index)}
						</SortableRow>
					))}
				</div>
			</SortableContext>
		</DndContext>
	)
}
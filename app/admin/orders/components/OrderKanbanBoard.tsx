'use client'

import { useState } from 'react'
import {
	DndContext,
	DragEndEvent,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
	closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { GripVertical } from 'lucide-react'

const COLUMNS: Array<{ key: string; label: string; color: string; badgeClass: string }> = [
	{ key: 'PENDING', label: 'Новый', color: 'border-t-warning', badgeClass: 'bg-warning/15 text-warning border-warning/20' },
	{ key: 'PAID', label: 'Оплачен', color: 'border-t-success', badgeClass: 'bg-success/15 text-success border-success/20' },
	{ key: 'SHIPPED', label: 'Отправлен', color: 'border-t-info', badgeClass: 'bg-info/15 text-info border-info/20' },
	{ key: 'DELIVERED', label: 'Доставлен', color: 'border-t-accent', badgeClass: 'bg-accent/15 text-accent border-accent/20' },
	{ key: 'CANCELLED', label: 'Отменён', color: 'border-t-destructive', badgeClass: 'bg-destructive/15 text-destructive border-destructive/20' },
]

interface Order {
	id: string
	status: string
	total: number
	createdAt: Date | string
	user?: { name?: string | null; email?: string | null } | null
	items?: Array<unknown>
}

interface KanbanCardProps {
	order: Order
	onClick: () => void
	isDragging?: boolean
}

function KanbanCard({ order, onClick, isDragging }: KanbanCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: order.id,
	})
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	}
	const initials = order.user?.name
		? order.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
		: '??'

	return (
		<div
			ref={setNodeRef}
			style={style}
			className='rounded-lg border border-border bg-card p-3 cursor-pointer hover:shadow-sm hover:border-accent/30 transition-all group'
			onClick={onClick}
		>
			<div className='flex items-start justify-between gap-2'>
				<div className='flex items-center gap-2'>
					<div className='h-7 w-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold shrink-0'>
						{initials}
					</div>
					<div>
						<div className='text-xs font-semibold'>{order.user?.name ?? 'Гость'}</div>
						<div className='font-mono text-[10px] text-muted-foreground'>
							#{order.id.slice(-6).toUpperCase()}
						</div>
					</div>
				</div>
				<button
					{...attributes}
					{...listeners}
					className='opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground'
					onClick={(e) => e.stopPropagation()}
					aria-label='Переместить'
				>
					<GripVertical className='h-4 w-4' />
				</button>
			</div>
			<div className='mt-2 flex items-center justify-between'>
				<span className='text-sm font-bold text-accent'>
					₽{order.total.toLocaleString('ru-RU')}
				</span>
				<span className='text-[10px] text-muted-foreground'>
					{(order.items as unknown[])?.length ?? 0} тов.
				</span>
			</div>
		</div>
	)
}

interface OrderKanbanBoardProps {
	ordersByStatus: Record<string, Order[]>
	onOrderClick: (orderId: string) => void
	onStatusChange: (orderId: string, newStatus: string) => void
}

export function OrderKanbanBoard({
	ordersByStatus,
	onOrderClick,
	onStatusChange,
}: OrderKanbanBoardProps) {
	const [activeId, setActiveId] = useState<string | null>(null)
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

	const findColumn = (id: string): string | null => {
		for (const col of COLUMNS) {
			if ((ordersByStatus[col.key] ?? []).some((o) => o.id === id)) return col.key
		}
		return null
	}

	const handleDragStart = ({ active }: DragStartEvent) => {
		setActiveId(active.id as string)
	}

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		setActiveId(null)
		if (!over) return
		const fromCol = findColumn(active.id as string)
		// If dropped onto a column header droppable or a card in a different column
		const toCol = COLUMNS.find((c) => c.key === over.id)?.key ?? findColumn(over.id as string)
		if (fromCol && toCol && fromCol !== toCol) {
			onStatusChange(active.id as string, toCol)
		}
	}

	const activeOrder = activeId ? Object.values(ordersByStatus).flat().find((o) => o.id === activeId) : null

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCorners}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className='flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]'>
				{COLUMNS.map((col) => {
					const orders = ordersByStatus[col.key] ?? []
					return (
						<div
							key={col.key}
							id={col.key}
							className={`flex w-64 shrink-0 flex-col rounded-lg border border-border border-t-2 bg-secondary/30 ${col.color}`}
							aria-live='polite'
							aria-label={`Колонка ${col.label}`}
						>
							{/* Column header */}
							<div className='flex items-center justify-between px-3 py-2.5 border-b border-border'>
								<span className='text-xs font-bold'>{col.label}</span>
								<Badge
									variant='outline'
									className={`text-[10px] border ${col.badgeClass}`}
								>
									{orders.length}
								</Badge>
							</div>
							{/* Cards */}
							<div className='flex-1 overflow-y-auto p-2 space-y-2'>
								<SortableContext
									items={orders.map((o) => o.id)}
									strategy={verticalListSortingStrategy}
								>
									{orders.map((order) => (
										<KanbanCard
											key={order.id}
											order={order}
											onClick={() => onOrderClick(order.id)}
											isDragging={order.id === activeId}
										/>
									))}
								</SortableContext>
								{orders.length === 0 && (
									<div className='py-8 text-center text-xs text-muted-foreground'>
										Нет заказов
									</div>
								)}
							</div>
						</div>
					)
				})}
			</div>
			<DragOverlay>
				{activeOrder ? (
					<div className='rounded-lg border border-accent/40 bg-card p-3 shadow-lg opacity-90 w-64'>
						<div className='text-xs font-semibold'>{activeOrder.user?.name ?? 'Гость'}</div>
						<div className='font-mono text-[10px] text-muted-foreground mt-0.5'>
							#{activeOrder.id.slice(-6).toUpperCase()}
						</div>
						<div className='text-sm font-bold text-accent mt-2'>
							₽{activeOrder.total.toLocaleString('ru-RU')}
						</div>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}

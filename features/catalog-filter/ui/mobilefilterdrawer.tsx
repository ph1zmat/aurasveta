'use client'

import { useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import CatalogSidebar from '@/features/catalog-filter/ui/catalogsidebar'
import type { CategoryTreeItem } from '@/entities/category/ui/categorytree'
import type {
	SidebarPropertyFilterItem,
	SidebarStaticFilterItem,
} from '@/features/catalog-filter/ui/catalogsidebar'

interface MobileFilterDrawerProps {
	open: boolean
	onClose: () => void
	categoryTree: CategoryTreeItem[]
	activeCategoryPath?: string
	staticFilters: SidebarStaticFilterItem[]
	propertyFilters: SidebarPropertyFilterItem[]
	selectedStaticFilters: Partial<
		Record<SidebarStaticFilterItem['key'], boolean>
	>
	selectedPropertyFilters: Record<string, string[]>
	onStaticFilterChange: (
		key: SidebarStaticFilterItem['key'],
		checked: boolean,
	) => void
	onPropertyFilterChange: (
		propertyKey: string,
		value: string,
		checked: boolean,
	) => void
	onResetFilters: () => void
	filterCount: number
}

export default function MobileFilterDrawer({
	open,
	onClose,
	categoryTree,
	activeCategoryPath,
	staticFilters,
	propertyFilters,
	selectedStaticFilters,
	selectedPropertyFilters,
	onStaticFilterChange,
	onPropertyFilterChange,
	onResetFilters,
	filterCount,
}: MobileFilterDrawerProps) {
	const titleId = useId()
	const descriptionId = useId()

	/* Lock body scroll when open */
	useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [open])

	/* Close on Escape */
	useEffect(() => {
		if (!open) return
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [open, onClose])

	if (!open) return null

	return (
		<div className='fixed inset-0 z-50 lg:hidden'>
			{/* Backdrop */}
			<div
				className='absolute inset-0 bg-foreground/45 backdrop-blur-[2px]'
				onClick={onClose}
			/>

			{/* Drawer */}
			<div
				role='dialog'
				aria-modal='true'
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				className='absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col border-r border-border bg-background shadow-2xl'
			>
				{/* Header */}
				<div className='border-b border-border px-4 py-4'>
					<div className='mb-3 flex items-start justify-between gap-3'>
					<div className='min-w-0'>
						<p className='mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
							Каталог
						</p>
						<h2 id={titleId} className='text-base font-semibold uppercase tracking-widest text-foreground'>
							Фильтры
						</h2>
						<p id={descriptionId} className='mt-1 text-xs leading-5 text-muted-foreground'>
							Уточните категорию, цену и свойства, чтобы быстрее найти нужные товары.
						</p>
					</div>
					<Button
						variant='icon'
						size='icon'
						onClick={onClose}
						aria-label='Закрыть фильтры'
					>
						<X className='h-5 w-5' strokeWidth={1.5} />
					</Button>
					</div>
					{filterCount > 0 ? (
						<div className='inline-flex rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
							Активно фильтров: {filterCount}
						</div>
					) : (
						<div className='inline-flex rounded-full border border-border bg-card/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
							Фильтры пока не выбраны
						</div>
					)}
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto px-4 py-4'>
					<CatalogSidebar
						categoryTree={categoryTree}
						activeCategoryPath={activeCategoryPath}
						staticFilters={staticFilters}
						propertyFilters={propertyFilters}
						selectedStaticFilters={selectedStaticFilters}
						selectedPropertyFilters={selectedPropertyFilters}
						onStaticFilterChange={onStaticFilterChange}
						onPropertyFilterChange={onPropertyFilterChange}
					/>
				</div>

				{/* Footer */}
				<div className='border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80'>
					<div className='flex items-center gap-3'>
						<Button
							variant='outline'
							size='default'
							fullWidth
							disabled={filterCount === 0}
							onClick={onResetFilters}
						>
							Сбросить
						</Button>
						<Button variant='primary' size='default' fullWidth onClick={onClose}>
							{filterCount > 0
								? `Показать результаты (${filterCount})`
								: 'Показать результаты'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

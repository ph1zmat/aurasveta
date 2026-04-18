'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import MobileFilterDrawer from '@/features/catalog-filter/ui/MobileFilterDrawer'
import type { CategoryTreeItem } from '@/entities/category/ui/CategoryTree'
import type {
	SidebarPropertyFilterItem,
	SidebarStaticFilterItem,
} from '@/features/catalog-filter/ui/CatalogSidebar'

const FilterDrawerContext = createContext<(() => void) | null>(null)

export function useFilterDrawer() {
	return useContext(FilterDrawerContext)
}

interface MobileFilterWrapperProps {
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
	children: React.ReactNode
}

export default function MobileFilterWrapper({
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
	children,
}: MobileFilterWrapperProps) {
	const [open, setOpen] = useState(false)
	const onOpen = useCallback(() => setOpen(true), [])
	const onClose = useCallback(() => setOpen(false), [])

	return (
		<FilterDrawerContext.Provider value={onOpen}>
			{children}
			<MobileFilterDrawer
				open={open}
				onClose={onClose}
				categoryTree={categoryTree}
				activeCategoryPath={activeCategoryPath}
				staticFilters={staticFilters}
				propertyFilters={propertyFilters}
				selectedStaticFilters={selectedStaticFilters}
				selectedPropertyFilters={selectedPropertyFilters}
				onStaticFilterChange={onStaticFilterChange}
				onPropertyFilterChange={onPropertyFilterChange}
				onResetFilters={onResetFilters}
				filterCount={filterCount}
			/>
		</FilterDrawerContext.Provider>
	)
}

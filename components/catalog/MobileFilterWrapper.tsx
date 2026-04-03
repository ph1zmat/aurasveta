'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import MobileFilterDrawer from '@/components/catalog/MobileFilterDrawer'
import type { CategoryTreeItem } from '@/components/catalog/CategoryTree'

const FilterDrawerContext = createContext<(() => void) | null>(null)

export function useFilterDrawer() {
	return useContext(FilterDrawerContext)
}

interface MobileFilterWrapperProps {
	categoryTree: CategoryTreeItem[]
	activeCategoryPath?: string
	children: React.ReactNode
}

export default function MobileFilterWrapper({
	categoryTree,
	activeCategoryPath,
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
			/>
		</FilterDrawerContext.Provider>
	)
}

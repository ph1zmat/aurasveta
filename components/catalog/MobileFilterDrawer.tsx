'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import CatalogSidebar from '@/components/catalog/CatalogSidebar'
import type { CategoryTreeItem } from '@/components/catalog/CategoryTree'

interface MobileFilterDrawerProps {
	open: boolean
	onClose: () => void
	categoryTree: CategoryTreeItem[]
	activeCategoryPath?: string
}

export default function MobileFilterDrawer({
	open,
	onClose,
	categoryTree,
	activeCategoryPath,
}: MobileFilterDrawerProps) {
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
				className='absolute inset-0 bg-foreground/30'
				onClick={onClose}
			/>

			{/* Drawer */}
			<div className='absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-background shadow-lg'>
				{/* Header */}
				<div className='flex items-center justify-between border-b border-border px-4 py-3'>
					<h2 className='text-base font-bold uppercase tracking-wider text-foreground'>
						Фильтры
					</h2>
					<Button
						variant='icon'
						size='icon'
						onClick={onClose}
						aria-label='Закрыть фильтры'
					>
						<X className='h-5 w-5' strokeWidth={1.5} />
					</Button>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto px-4 py-4'>
					<CatalogSidebar
						categoryTree={categoryTree}
						activeCategoryPath={activeCategoryPath}
					/>
				</div>

				{/* Footer */}
				<div className='border-t border-border px-4 py-3'>
					<Button variant='primary' size='default' fullWidth onClick={onClose}>
						Показать результаты
					</Button>
				</div>
			</div>
		</div>
	)
}

/**
 * CatalogDropdown — мега-меню каталога.
 *
 * Всплывает при нажатии на кнопку «Каталог» в Header.
 * Слева — вертикальный список корневых категорий (hover → подсветка).
 * Справа — до 4 колонок подкатегорий выбранной категории.
 * Кнопка закрытия (X) в правом верхнем углу.
 *
 * Использует: Button (variant='icon'), cn() из дизайн-системы.
 */
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
	catalogMenuItems,
	type CatalogMenuItem,
} from '@/mocks/catalogMenu'

interface CatalogDropdownProps {
	open: boolean
	onClose: () => void
}

export default function CatalogDropdown({ open, onClose }: CatalogDropdownProps) {
	const [activeId, setActiveId] = useState<string>(catalogMenuItems[0]?.id ?? '')
	const panelRef = useRef<HTMLDivElement>(null)

	const activeItem: CatalogMenuItem | undefined = catalogMenuItems.find(
		c => c.id === activeId,
	)

	/* Закрытие по Escape */
	useEffect(() => {
		if (!open) return
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [open, onClose])

	/* Закрытие по клику вне панели */
	useEffect(() => {
		if (!open) return
		const handler = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				onClose()
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [open, onClose])

	const handleHover = useCallback((id: string) => {
		setActiveId(id)
	}, [])

	if (!open) return null

	return (
		<div className='fixed inset-0 z-50 bg-foreground/20'>
			<div
				ref={panelRef}
				className='mx-auto mt-0 max-w-7xl bg-card shadow-lg'
			>
				<div className='relative flex'>
					{/* ─── Левая колонка: категории ─── */}
					<nav className='w-52 shrink-0 border-r border-border py-4'>
						<ul className='space-y-0'>
							{catalogMenuItems.map(item => (
								<li key={item.id}>
									<Link
										href={item.href}
										onMouseEnter={() => handleHover(item.id)}
										onClick={onClose}
										className={cn(
											'block px-5 py-2.5 text-sm transition-colors',
											item.id === activeId
												? 'bg-foreground font-medium text-card'
												: 'text-foreground hover:bg-accent',
										)}
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					{/* ─── Правая часть: колонки подкатегорий ─── */}
					<div className='flex-1 px-8 py-5'>
						{activeItem && (
							<div className='grid grid-cols-4 gap-x-8 gap-y-6'>
								{activeItem.groups.map(group => (
									<div key={group.title}>
										<h3 className='mb-3 text-xs font-bold uppercase tracking-wider text-foreground'>
											{group.title}
										</h3>
										<ul className='space-y-2'>
											{group.links.map(link => (
												<li key={link.href}>
													<Link
														href={link.href}
														onClick={onClose}
														className='text-sm text-foreground transition-colors hover:text-primary'
													>
														{link.name}
													</Link>
												</li>
											))}
										</ul>
									</div>
								))}
							</div>
						)}
					</div>

					{/* ─── Кнопка закрытия ─── */}
					<Button
						variant='icon'
						size='icon'
						onClick={onClose}
						className='absolute right-4 top-4'
						aria-label='Закрыть каталог'
					>
						<X className='h-5 w-5' strokeWidth={1.5} />
					</Button>
				</div>
			</div>
		</div>
	)
}

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

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'

interface CatalogDropdownProps {
	open: boolean
	onClose: () => void
}

type CategoryTreeNode = RouterOutputs['categories']['getTree'][number]

export default function CatalogDropdown({
	open,
	onClose,
}: CatalogDropdownProps) {
	const { data: categoriesTree, isLoading } =
		trpc.categories.getHeaderTree.useQuery(undefined, {
			staleTime: 5 * 60 * 1000,
		})
	const defaultActiveId = useMemo(
		() => categoriesTree?.[0]?.slug ?? '',
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[categoriesTree?.[0]?.slug],
	)
	const [activeId, setActiveId] = useState<string>('')
	const panelRef = useRef<HTMLDivElement>(null)

	// Sync activeId when categories load: keep current selection if still valid,
	// otherwise fall back to the first category.
	const resolvedActiveId =
		activeId && categoriesTree?.some(c => c.slug === activeId)
			? activeId
			: defaultActiveId

	const activeItem: CategoryTreeNode | undefined = categoriesTree?.find(
		c => c.slug === resolvedActiveId,
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
		<div className='fixed inset-0 z-50 bg-foreground/20 overflow-y-hidden'>
			<div
				ref={panelRef}
				className='mx-auto mt-23 max-w-7xl bg-card shadow-lg е'
			>
				<div className='relative flex'>
					{/* ─── Левая колонка: категории ─── */}
					<nav className='w-52 shrink-0 border-r border-border py-4'>
						<ul className='space-y-0'>
							{(categoriesTree ?? []).map(item => (
								<li key={item.id}>
									<Link
										href={`/catalog/${item.slug}`}
										onMouseEnter={() => handleHover(item.slug)}
										onClick={onClose}
										className={cn(
											'block px-5 py-2.5 text-sm transition-colors',
											item.slug === resolvedActiveId
												? 'bg-foreground font-medium text-card'
												: 'text-foreground hover:bg-accent',
										)}
									>
										{item.name}
									</Link>
								</li>
							))}
							{!isLoading && (categoriesTree?.length ?? 0) === 0 && (
								<li className='px-5 py-2.5 text-sm text-muted-foreground'>
									Категории загружаются
								</li>
							)}
						</ul>
					</nav>

					{/* ─── Правая часть: колонки подкатегорий ─── */}
					<div className='flex-1 px-8 py-5'>
						{isLoading ? (
							<div className='py-6 text-sm text-muted-foreground'>
								Загружаем категории…
							</div>
						) : activeItem ? (
							<div className='space-y-6'>
								<div className='flex items-center justify-between gap-4 border-b border-border pb-4'>
									<div>
										<p className='text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground'>
											Категория
										</p>
										<Link
											href={`/catalog/${activeItem.slug}`}
											className='mt-2 text-xl font-semibold text-foreground'
										>
											{activeItem.name}
										</Link>
									</div>
								</div>

								{(activeItem.children?.length ?? 0) > 0 ? (
									<div className='grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3'>
										{(activeItem.children ?? []).map(child => (
											<div key={child.id}>
												<Link
													href={`/catalog/${child.slug}`}
													onClick={onClose}
													className='mb-3 block text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:text-primary'
												>
													{child.name}
												</Link>
												<ul className='space-y-2'>
													<li>
														<Link
															href={`/catalog/${child.slug}`}
															onClick={onClose}
															className='text-sm text-muted-foreground transition-colors hover:text-primary'
														>
															Все товары
														</Link>
													</li>
													{(child.children ?? []).map(grandChild => (
														<li key={grandChild.id}>
															<Link
																href={`/catalog/${grandChild.slug}`}
																onClick={onClose}
																className='text-sm text-foreground transition-colors hover:text-primary'
															>
																{grandChild.name}
															</Link>
														</li>
													))}
												</ul>
											</div>
										))}
									</div>
								) : (
									<p className='text-sm text-muted-foreground'>
										Для этой категории пока нет подкатегорий.
									</p>
								)}
							</div>
						) : (
							<div className='py-6 text-sm text-muted-foreground'>
								Категории пока недоступны.
							</div>
						)}
					</div>

					{/* ─── Кнопка закрытия ─── */}
					<Button
						variant='icon'
						size='icon'
						onClick={onClose}
						className='absolute right-4 top-4 cursor-pointer'
						aria-label='Закрыть каталог'
					>
						<X className='h-5 w-5' strokeWidth={1.5} />
					</Button>
				</div>
			</div>
		</div>
	)
}

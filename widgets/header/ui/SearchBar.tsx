'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/shared/ui/Input'
import { useDebounce } from '@/shared/lib/useDebounce'
import { trpc } from '@/lib/trpc/client'

const RECENT_KEY = 'aura-recent-searches'

export default function SearchBar({ className }: { className?: string }) {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState('')
	const [isOpen, setIsOpen] = useState(false)
	const [activeIndex, setActiveIndex] = useState<number>(-1)
	const debouncedSearch = useDebounce(searchTerm, 400)
	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const { data: suggestions, isLoading } = trpc.search.suggestions.useQuery(
		{ query: debouncedSearch, limit: 5 },
		{
			enabled: debouncedSearch.length >= 2,
			staleTime: 1000 * 60,
			placeholderData: prev => prev,
		},
	)

	const { data: popularSearches } =
		trpc.recommendations.getPopularSearches.useQuery(
			{ limit: 8 },
			{
				enabled: isOpen && debouncedSearch.length < 2,
				staleTime: 10 * 60 * 1000,
			},
		)

	const popularQueries = useMemo(
		() => (popularSearches ?? []).map(s => s.query),
		[popularSearches],
	)

	const [recentQueries, setRecentQueries] = useState<string[]>(() => {
		if (typeof window === 'undefined') return []
		try {
			const raw = localStorage.getItem(RECENT_KEY)
			const parsed = raw ? (JSON.parse(raw) as unknown) : []
			if (!Array.isArray(parsed)) return []
			return parsed
				.map(v => String(v))
				.filter(Boolean)
				.slice(0, 6)
		} catch {
			return []
		}
	})

	const clearRecentQueries = useCallback(() => {
		try {
			localStorage.removeItem(RECENT_KEY)
		} catch {
			// ignore
		}
		setRecentQueries([])
	}, [])

	const pushRecentQuery = useCallback((q: string) => {
		const value = q.trim().toLowerCase()
		if (value.length < 2) return
		try {
			const raw = localStorage.getItem(RECENT_KEY)
			const parsed = raw ? (JSON.parse(raw) as unknown) : []
			const arr = Array.isArray(parsed) ? parsed.map(v => String(v)) : []
			const next = [value, ...arr.filter(x => x !== value)].slice(0, 10)
			localStorage.setItem(RECENT_KEY, JSON.stringify(next))
			setRecentQueries(next.slice(0, 6))
		} catch {
			// ignore
		}
	}, [])

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			const q = searchTerm.trim()
			if (q.length >= 2) {
				setIsOpen(false)
				inputRef.current?.blur()
				pushRecentQuery(q)
				router.push(`/search?q=${encodeURIComponent(q)}`)
			}
		},
		[searchTerm, router, pushRecentQuery],
	)

	const handleClear = useCallback(() => {
		setSearchTerm('')
		setIsOpen(false)
		setActiveIndex(-1)
		inputRef.current?.focus()
	}, [])

	const handleFocus = useCallback(() => {
		setIsOpen(true)
		setActiveIndex(-1)
	}, [])
	// Close dropdown on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false)
				setActiveIndex(-1)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
		setIsOpen(true)
		setActiveIndex(-1)
	}, [])

	const showDropdown = isOpen
	const showSuggestions = debouncedSearch.length >= 2

	type Option = { id: string; href: string; label: string }

	const options: Option[] = useMemo(() => {
		if (!showDropdown) return []

		if (showSuggestions) {
			const suggestionOptions =
				suggestions?.map(s => ({
					id: `suggestion-${s.id}`,
					href: `/product/${s.slug}`,
					label: s.name,
				})) ?? []
			const showAll: Option = {
				id: 'show-all',
				href: `/search?q=${encodeURIComponent(debouncedSearch)}`,
				label: `Показать все результаты по «${debouncedSearch}»`,
			}
			return [...suggestionOptions, showAll]
		}

		const recent: Option[] = recentQueries.map((q, i) => ({
			id: `recent-${i}`,
			href: `/search?q=${encodeURIComponent(q)}`,
			label: q,
		}))
		const popular: Option[] = popularQueries.map((q, i) => ({
			id: `popular-${i}`,
			href: `/search?q=${encodeURIComponent(q)}`,
			label: q,
		}))

		return [...recent, ...popular]
	}, [
		debouncedSearch,
		popularQueries,
		recentQueries,
		showDropdown,
		showSuggestions,
		suggestions,
	])

	const activeOptionId = options[activeIndex]?.id

	const goToOption = useCallback(
		(opt: Option) => {
			setIsOpen(false)
			setActiveIndex(-1)
			pushRecentQuery(
				showSuggestions ? debouncedSearch : (opt.label ?? '').toString(),
			)
			router.push(opt.href)
			inputRef.current?.blur()
		},
		[debouncedSearch, pushRecentQuery, router, showSuggestions],
	)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				if (!showDropdown) setIsOpen(true)
				if (options.length === 0) return
				e.preventDefault()
				setActiveIndex(prev => {
					if (e.key === 'ArrowDown') {
						const next = prev + 1
						return next >= options.length ? 0 : next
					}
					const next = prev - 1
					return next < 0 ? options.length - 1 : next
				})
				return
			}

			if (e.key === 'Enter') {
				if (!showDropdown) return
				if (activeIndex < 0 || activeIndex >= options.length) return
				e.preventDefault()
				goToOption(options[activeIndex]!)
				return
			}

			if (e.key === 'Escape') {
				setIsOpen(false)
				setActiveIndex(-1)
				inputRef.current?.blur()
			}
		},
		[activeIndex, goToOption, options, showDropdown],
	)

	return (
		<div
			ref={containerRef}
			className={`relative flex-1 ${className ?? 'max-w-xl'}`}
		>
			<form onSubmit={handleSubmit} role='search'>
				<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
				<Input
					ref={inputRef}
					variant='search'
					placeholder='Найти товар...'
					value={searchTerm}
					onChange={handleChange}
					onFocus={handleFocus}
					onKeyDown={handleKeyDown}
					aria-label='Поиск товаров'
					role='combobox'
					aria-autocomplete='list'
					aria-expanded={isOpen}
					aria-controls='search-suggestions'
					aria-activedescendant={activeOptionId}
					autoComplete='off'
				/>
				{searchTerm && (
					<button
						type='button'
						onClick={handleClear}
						className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
						aria-label='Очистить поиск'
					>
						<X className='h-4 w-4' />
					</button>
				)}
			</form>

			{/* Suggestions dropdown */}
			{showDropdown && (
				<div
					id='search-suggestions'
					role='listbox'
					className='absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden'
				>
					{showSuggestions && isLoading && (
						<div className='flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground'>
							<Loader2 className='h-4 w-4 animate-spin' />
							Поиск...
						</div>
					)}

					{showSuggestions &&
						!isLoading &&
						suggestions &&
						suggestions.length === 0 && (
							<div className='p-4 text-center text-sm text-muted-foreground'>
								Ничего не найдено по запросу &laquo;{debouncedSearch}&raquo;
							</div>
						)}

					{showSuggestions &&
						!isLoading &&
						suggestions &&
						suggestions.length > 0 && (
							<>
								<ul className='py-1'>
									{suggestions.map((item, idx) => (
										<li
											key={item.id}
											id={`suggestion-${item.id}`}
											role='option'
											aria-selected={activeIndex === idx}
										>
											<Link
												href={`/product/${item.slug}`}
												className={
													activeIndex === idx
														? 'flex items-center gap-3 px-4 py-2 bg-muted transition-colors'
														: 'flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors'
												}
												onClick={() => {
													setIsOpen(false)
													setActiveIndex(-1)
													pushRecentQuery(debouncedSearch)
												}}
											>
												<div className='relative h-10 w-10 shrink-0 rounded overflow-hidden bg-muted'>
													{item.imagePath ? (
														<Image
															src={item.imagePath}
															alt={item.name}
															fill
															className='object-contain'
															sizes='40px'
														/>
													) : (
														<div className='h-full w-full bg-muted' />
													)}
												</div>
												<div className='min-w-0 flex-1'>
													<p className='truncate text-sm font-medium text-foreground'>
														{item.name}
													</p>
													{item.category && (
														<p className='truncate text-xs text-muted-foreground'>
															{item.category.name}
														</p>
													)}
												</div>
												{item.price !== null && (
													<span className='shrink-0 text-sm font-medium text-foreground'>
														{item.price.toLocaleString('ru-RU')} ₽
													</span>
												)}
											</Link>
										</li>
									))}
								</ul>
								<Link
									href={`/search?q=${encodeURIComponent(debouncedSearch)}`}
									className='block border-t border-border px-4 py-2.5 text-center text-sm text-primary hover:bg-muted transition-colors'
									id='show-all'
									onClick={() => {
										setIsOpen(false)
										setActiveIndex(-1)
										pushRecentQuery(debouncedSearch)
									}}
								>
									Показать все результаты
								</Link>
							</>
						)}

					{!showSuggestions && (
						<div className='p-3'>
							{recentQueries.length > 0 && (
								<div className='mb-3'>
									<div className='flex items-center justify-between px-1 pb-2'>
										<p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
											Недавние
										</p>
										<button
											type='button'
											className='text-xs text-muted-foreground hover:text-foreground transition-colors'
											onClick={clearRecentQueries}
										>
											Очистить
										</button>
									</div>
									<div className='flex flex-wrap gap-2'>
										{recentQueries.map((q, i) => {
											const idx = i
											return (
												<Link
													key={`${q}-${i}`}
													id={`recent-${i}`}
													href={`/search?q=${encodeURIComponent(q)}`}
													className={
														activeIndex === idx
															? 'rounded-full border border-border px-3 py-1 text-xs text-foreground bg-muted transition-colors'
															: 'rounded-full border border-border px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors'
													}
													onClick={() => {
														setIsOpen(false)
														setActiveIndex(-1)
													}}
												>
													{q}
												</Link>
											)
										})}
									</div>
								</div>
							)}

							{popularQueries.length > 0 ? (
								<div>
									<p className='px-1 pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
										Часто ищут
									</p>
									<div className='flex flex-wrap gap-2'>
										{popularQueries.map((q, i) => {
											const idx = recentQueries.length + i
											return (
												<Link
													key={q}
													id={`popular-${i}`}
													href={`/search?q=${encodeURIComponent(q)}`}
													className={
														activeIndex === idx
															? 'rounded-full border border-border px-3 py-1 text-xs text-foreground bg-muted transition-colors'
															: 'rounded-full border border-border px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors'
													}
													onClick={() => {
														setIsOpen(false)
														setActiveIndex(-1)
													}}
												>
													{q}
												</Link>
											)
										})}
									</div>
								</div>
							) : (
								<p className='px-1 text-xs text-muted-foreground'>
									Введите минимум 2 символа для поиска
								</p>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

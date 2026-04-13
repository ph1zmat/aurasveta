'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/shared/ui/Input'
import { useDebounce } from '@/shared/lib/useDebounce'
import { trpc } from '@/lib/trpc/client'

export default function SearchBar() {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState('')
	const [isOpen, setIsOpen] = useState(false)
	const debouncedSearch = useDebounce(searchTerm, 400)
	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const { data: suggestions, isLoading } = trpc.search.suggestions.useQuery(
		{ query: debouncedSearch, limit: 5 },
		{
			enabled: debouncedSearch.length >= 2,
			staleTime: 1000 * 60,
			placeholderData: (prev) => prev,
		},
	)

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			if (searchTerm.trim().length >= 2) {
				setIsOpen(false)
				inputRef.current?.blur()
				router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
			}
		},
		[searchTerm, router],
	)

	const handleClear = useCallback(() => {
		setSearchTerm('')
		setIsOpen(false)
		inputRef.current?.focus()
	}, [])

	const handleFocus = useCallback(() => {
		if (debouncedSearch.length >= 2) setIsOpen(true)
	}, [debouncedSearch])
	// Close dropdown on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
		if (e.target.value.length >= 2) setIsOpen(true)
	}, [])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsOpen(false)
				inputRef.current?.blur()
			}
		},
		[],
	)

	const showDropdown = isOpen && debouncedSearch.length >= 2

	return (
		<div ref={containerRef} className='relative flex-1 max-w-xl'>
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
					aria-expanded={isOpen}
					aria-controls='search-suggestions'
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
					{isLoading && (
						<div className='flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground'>
							<Loader2 className='h-4 w-4 animate-spin' />
							Поиск...
						</div>
					)}

					{!isLoading && suggestions && suggestions.length === 0 && (
						<div className='p-4 text-center text-sm text-muted-foreground'>
							Ничего не найдено по запросу &laquo;{debouncedSearch}&raquo;
						</div>
					)}

					{!isLoading && suggestions && suggestions.length > 0 && (
						<>
							<ul className='py-1'>
								{suggestions.map((item) => (
									<li key={item.id} role='option' aria-selected={false}>
										<Link
											href={`/product/${item.slug}`}
											className='flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors'
											onClick={() => setIsOpen(false)}
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
								onClick={() => setIsOpen(false)}
							>
								Показать все результаты
							</Link>
						</>
					)}
				</div>
			)}
		</div>
	)
}

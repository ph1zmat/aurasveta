'use client'

import { useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal, X, ChevronDown, ArrowUpDown } from 'lucide-react'

export interface ProductFiltersState {
	search: string
	categorySlug: string
	brand: string
	sortBy: string
	inStock?: boolean
}

interface ProductFiltersProps {
	initialFilters: ProductFiltersState
	categories: Array<{ value: string; label: string }>
	brands: Array<{ value: string; label: string }>
	onFilterChange: (filters: ProductFiltersState) => void
	searchPlaceholder?: string
	defaultExpanded?: boolean
}

function FilterSelect({
	label,
	value,
	onChange,
	options,
	placeholder,
	icon,
}: {
	label: string
	value: string
	onChange: (value: string) => void
	options: Array<{ value: string; label: string }>
	placeholder: string
	icon?: React.ReactNode
}) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='text-xs font-medium text-muted-foreground'>{label}</span>
			<div className='relative'>
				{icon ? (
					<span className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground'>
						{icon}
					</span>
				) : null}
				<select
					value={value}
					onChange={event => onChange(event.target.value)}
					className={`h-9 appearance-none rounded-lg border border-border bg-background pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
						icon ? 'pl-8' : 'pl-3'
					}`}
				>
					<option value=''>{placeholder}</option>
					{options.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<ChevronDown className='pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
			</div>
		</div>
	)
}

/**
 * Унифицированная панель фильтров товаров для web-admin и desktop-admin.
 */
export default function ProductFilters({
	initialFilters,
	categories,
	brands,
	onFilterChange,
	searchPlaceholder = 'Поиск по названию...',
	defaultExpanded = false,
}: ProductFiltersProps) {
	const [filters, setFilters] = useState<ProductFiltersState>(initialFilters)
	const [showFilters, setShowFilters] = useState(defaultExpanded)

	useEffect(() => {
		setFilters(initialFilters)
	}, [initialFilters])

	useEffect(() => {
		onFilterChange(filters)
	}, [filters, onFilterChange])

	const activeFilterCount = useMemo(
		() =>
			[
				filters.categorySlug,
				filters.brand,
				filters.sortBy,
				filters.inStock !== undefined ? 'x' : '',
			].filter(Boolean).length,
		[filters],
	)

	const updateFilters = (partial: Partial<ProductFiltersState>) => {
		setFilters(previous => ({ ...previous, ...partial }))
	}

	const resetFilters = () => {
		setFilters({
			search: filters.search,
			categorySlug: '',
			brand: '',
			sortBy: '',
			inStock: undefined,
		})
	}

	return (
		<div className='space-y-3'>
			<div className='flex items-center gap-2'>
				<input
					type='search'
					placeholder={searchPlaceholder}
					value={filters.search}
					onChange={event => updateFilters({ search: event.target.value })}
					className='flex h-9 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
				/>
				<button
					type='button'
					onClick={() => setShowFilters(previous => !previous)}
					className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
						showFilters || activeFilterCount > 0
							? 'border-primary/50 bg-primary/10 text-primary'
							: 'border-border bg-background text-muted-foreground hover:text-foreground'
					}`}
				>
					<SlidersHorizontal className='h-3.5 w-3.5' />
					Фильтры
					{activeFilterCount > 0 ? (
						<span className='ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'>
							{activeFilterCount}
						</span>
					) : null}
				</button>
			</div>

			{showFilters ? (
				<div className='rounded-xl border border-border bg-muted/30 p-4'>
					<div className='flex flex-wrap items-end gap-3'>
						<FilterSelect
							label='Категория'
							value={filters.categorySlug}
							onChange={value => updateFilters({ categorySlug: value })}
							options={categories}
							placeholder='Все категории'
						/>
						<FilterSelect
							label='Бренд'
							value={filters.brand}
							onChange={value => updateFilters({ brand: value })}
							options={brands}
							placeholder='Все бренды'
						/>
						<FilterSelect
							label='Сортировка'
							value={filters.sortBy}
							onChange={value => updateFilters({ sortBy: value })}
							options={[
								{ value: 'newest', label: 'Сначала новые' },
								{ value: 'price-asc', label: 'Цена ↑' },
								{ value: 'price-desc', label: 'Цена ↓' },
								{ value: 'name', label: 'По названию' },
							]}
							placeholder='По умолчанию'
							icon={<ArrowUpDown className='h-3.5 w-3.5' />}
						/>
						<div className='flex flex-col gap-1'>
							<span className='text-xs font-medium text-muted-foreground'>Наличие</span>
							<div className='flex h-9 items-center gap-3 rounded-lg border border-border bg-background px-3'>
								{[
									{ label: 'Все', value: undefined },
									{ label: 'В наличии', value: true },
									{ label: 'Нет', value: false },
								].map(option => (
									<button
										key={String(option.value)}
										type='button'
										onClick={() => updateFilters({ inStock: option.value })}
										className={`text-xs transition-colors ${
											filters.inStock === option.value
												? 'font-semibold text-foreground'
												: 'text-muted-foreground hover:text-foreground'
										}`}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>
						{activeFilterCount > 0 ? (
							<button
								type='button'
								onClick={resetFilters}
								className='flex h-9 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:text-foreground'
							>
								<X className='h-3.5 w-3.5' />
								Сбросить
							</button>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	)
}
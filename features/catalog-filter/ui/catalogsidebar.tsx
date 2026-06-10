'use client'

import CategoryTree from '@/entities/category/ui/categorytree'
import type { CategoryTreeItem } from '@/entities/category/ui/categorytree'
import { Input } from '@/shared/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select'
import FilterSection, {
	CheckboxFilterItem,
} from '@/features/catalog-filter/ui/filtersection'

export type SortOption =
	| 'newest'
	| 'price-asc'
	| 'price-desc'
	| 'name'
	| 'rating'

export interface SidebarStaticFilterItem {
	key: 'isNew' | 'onSale' | 'freeShipping'
	label: string
	count: number
}

export interface SidebarPropertyFilterItem {
	key: string
	label: string
	type?: string
	options: Array<{
		value: string
		label: string
		count: number
	}>
}

interface CatalogSidebarProps {
	categoryTree: CategoryTreeItem[]
	activeCategoryPath?: string
	staticFilters?: SidebarStaticFilterItem[]
	propertyFilters?: SidebarPropertyFilterItem[]
	selectedStaticFilters?: Partial<
		Record<SidebarStaticFilterItem['key'], boolean>
	>
	selectedPropertyFilters?: Record<string, string[]>
	onStaticFilterChange?: (
		key: SidebarStaticFilterItem['key'],
		checked: boolean,
	) => void
	onPropertyFilterChange?: (
		propertyKey: string,
		value: string,
		checked: boolean,
	) => void
	// Price
	minPrice?: number
	maxPrice?: number
	onPriceChange?: (min: number | undefined, max: number | undefined) => void
	// Sort
	sortBy?: SortOption
	onSortChange?: (sort: SortOption) => void
}

export default function CatalogSidebar({
	categoryTree,
	activeCategoryPath,
	staticFilters = [],
	propertyFilters = [],
	selectedStaticFilters,
	selectedPropertyFilters,
	onStaticFilterChange,
	onPropertyFilterChange,
	minPrice,
	maxPrice,
	onPriceChange,
	sortBy = 'newest',
	onSortChange,
}: CatalogSidebarProps) {
	const hasAnyFilters = staticFilters.length > 0 || propertyFilters.length > 0

	const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
		{ value: 'newest', label: 'Новинки' },
		{ value: 'price-asc', label: 'Цена ↑' },
		{ value: 'price-desc', label: 'Цена ↓' },
		{ value: 'name', label: 'По названию' },
		{ value: 'rating', label: 'По рейтингу' },
	]

	return (
		<aside className='w-full rounded-xl border border-border/70 bg-background/80 p-3'>
			{/* Category tree */}
			<CategoryTree
				title='Категории'
				items={categoryTree}
				activePath={activeCategoryPath}
			/>

			{/* Price */}
			<FilterSection title='Цена' defaultOpen>
				<div className='flex gap-2 p-1'>
					<Input
						type='number'
						placeholder='От'
						defaultValue={minPrice}
						onBlur={e => {
							const val = e.target.value ? Number(e.target.value) : undefined
							onPriceChange?.(val, maxPrice)
						}}
						className='h-8 px-2 py-1.5'
					/>
					<Input
						type='number'
						placeholder='До'
						defaultValue={maxPrice}
						onBlur={e => {
							const val = e.target.value ? Number(e.target.value) : undefined
							onPriceChange?.(minPrice, val)
						}}
						className='h-8 px-2 py-1.5'
					/>
				</div>
			</FilterSection>

			{/* Sort */}
			<FilterSection title='Сортировка' defaultOpen>
				<Select
					value={sortBy}
					onValueChange={value => onSortChange?.(value as SortOption)}
				>
					<SelectTrigger className='w-full bg-background'>
						<SelectValue placeholder='Выберите сортировку' />
					</SelectTrigger>
					<SelectContent>
						{SORT_OPTIONS.map(opt => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FilterSection>

			{hasAnyFilters && (
				<>
					<div className='border-b border-border/80 py-3.5'>
						<h3 className='text-sm font-semibold uppercase tracking-widest text-foreground'>
							Фильтры
						</h3>
					</div>

					{staticFilters.length > 0 && (
						<FilterSection title='Быстрые фильтры' defaultOpen>
							<div className='space-y-0.5'>
								{staticFilters.map(item => (
									<CheckboxFilterItem
										key={item.key}
										label={item.label}
										count={item.count}
										checked={Boolean(selectedStaticFilters?.[item.key])}
										onChange={checked =>
											onStaticFilterChange?.(item.key, checked)
										}
									/>
								))}
							</div>
						</FilterSection>
					)}

					{propertyFilters.map(property => (
						<FilterSection key={property.key} title={property.label}>
							<div className='space-y-0.5'>
								{property.options.map(option => (
									<CheckboxFilterItem
										key={`${property.key}:${option.value}`}
										label={option.label}
										count={option.count}
										checked={Boolean(
											selectedPropertyFilters?.[property.key]?.includes(
												option.value,
											),
										)}
										onChange={checked =>
											onPropertyFilterChange?.(
												property.key,
												option.value,
												checked,
											)
										}
									/>
								))}
							</div>
						</FilterSection>
					))}
				</>
			)}
		</aside>
	)
}

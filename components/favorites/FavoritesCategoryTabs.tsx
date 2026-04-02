'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface FavoritesTab {
	label: string
	count: number
	value: string
}

interface FavoritesCategoryTabsProps {
	tabs: FavoritesTab[]
	defaultValue?: string
	onChange?: (value: string) => void
}

export default function FavoritesCategoryTabs({
	tabs,
	defaultValue,
	onChange,
}: FavoritesCategoryTabsProps) {
	const [active, setActive] = useState(defaultValue ?? tabs[0]?.value ?? 'all')

	const handleClick = (value: string) => {
		setActive(value)
		onChange?.(value)
	}

	return (
		<div className='flex gap-4 border-b border-border'>
			{tabs.map(tab => (
				<button
					key={tab.value}
					onClick={() => handleClick(tab.value)}
					className={cn(
						'pb-2 text-sm transition-colors',
						active === tab.value
							? 'border-b-2 border-foreground font-medium text-foreground'
							: 'text-muted-foreground hover:text-foreground',
					)}
				>
					{tab.label} <span className='text-muted-foreground'>{tab.count}</span>
				</button>
			))}
		</div>
	)
}

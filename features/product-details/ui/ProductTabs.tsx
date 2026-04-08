'use client'

import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Info } from 'lucide-react'
import Link from 'next/link'
import type { SpecRow, SpecGroup } from '@/entities/spec/model/types'

export type { SpecRow, SpecGroup }

interface ProductTabsProps {
	specGroups: SpecGroup[]
}

/* ── Spec row ── */

function SpecRowCell({ row }: { row: SpecRow }) {
	return (
		<div className='flex items-center justify-between border-b border-border py-2 last:border-b-0'>
			<span className='text-sm text-muted-foreground'>{row.label}</span>
			<span className='flex items-center gap-1 text-sm text-foreground'>
				{row.href ? (
					<Link
						href={row.href}
						className='underline underline-offset-2 hover:text-primary transition-colors'
					>
						{row.value}
					</Link>
				) : (
					row.value
				)}
				{row.tooltip && (
					<Info
						className='h-3.5 w-3.5 text-muted-foreground'
						strokeWidth={1.5}
					/>
				)}
			</span>
		</div>
	)
}

/* ── Specs table ── */

function SpecsTable({ groups }: { groups: SpecGroup[] }) {
	/* Split groups into 2 columns */
	const mid = Math.ceil(groups.length / 2)
	const leftGroups = groups.slice(0, mid)
	const rightGroups = groups.slice(mid)

	return (
		<div className='grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2'>
			<div className='space-y-8'>
				{leftGroups.map(group => (
					<div key={group.title}>
						<h4 className='mb-3 text-base font-semibold tracking-widest text-foreground'>
							{group.title}
						</h4>
						<div>
							{group.rows.map(row => (
								<SpecRowCell key={row.label} row={row} />
							))}
						</div>
					</div>
				))}
			</div>
			<div className='space-y-8'>
				{rightGroups.map(group => (
					<div key={group.title}>
						<h4 className='mb-3 text-base font-semibold tracking-widest text-foreground'>
							{group.title}
						</h4>
						<div>
							{group.rows.map(row => (
								<SpecRowCell key={row.label} row={row} />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

/* ── Tabs component ── */

const tabs = ['Характеристики', 'Доставка', 'Отзывы'] as const

export default function ProductTabs({ specGroups }: ProductTabsProps) {
	const [active, setActive] = useState<(typeof tabs)[number]>('Характеристики')

	return (
		<div>
			{/* Tab headers */}
			<div className='flex gap-4 overflow-x-auto border-b border-border scrollbar-hide md:gap-6'>
				{tabs.map(tab => (
					<button
						key={tab}
						onClick={() => setActive(tab)}
						className={cn(
							'pb-3 text-sm font-medium transition-colors',
							active === tab
								? 'border-b-2 border-foreground text-foreground'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{tab}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div className='py-6'>
				{active === 'Характеристики' && <SpecsTable groups={specGroups} />}
				{active === 'Доставка' && (
					<p className='text-sm tracking-wider text-muted-foreground'>
						Информация о доставке будет доступна позже.
					</p>
				)}
				{active === 'Отзывы' && (
					<p className='text-sm tracking-wider text-muted-foreground'>
						Отзывов пока нет. Будьте первым!
					</p>
				)}
			</div>
		</div>
	)
}

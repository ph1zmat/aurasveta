'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { CategoryTreeItem } from '@/entities/category/model/types'

export type { CategoryTreeItem }

interface CategoryTreeProps {
	title: string
	items: CategoryTreeItem[]
	activePath?: string
	defaultOpen?: boolean
}

function TreeNode({
	item,
	activePath,
	depth = 0,
}: {
	item: CategoryTreeItem
	activePath?: string
	depth?: number
}) {
	const [open, setOpen] = useState(true)
	const isActive = activePath === item.href
	const hasChildren = item.children && item.children.length > 0

	return (
		<li>
			<div
				className={cn(
					'flex items-center rounded-sm py-1 -mx-1 px-1 transition-colors hover:bg-muted/50',
					isActive && 'bg-muted',
				)}
			>
				{hasChildren && (
					<button
						onClick={() => setOpen(!open)}
						className='mr-1 p-0.5 text-muted-foreground hover:text-foreground transition-colors'
						aria-label={open ? 'Свернуть' : 'Развернуть'}
					>
						<ChevronDown
							className={cn(
								'h-3 w-3 transition-transform duration-200',
								!open && '-rotate-90',
							)}
							strokeWidth={1.5}
						/>
					</button>
				)}
				<Link
					href={item.href}
					className={cn(
						'text-sm transition-colors hover:text-foreground',
						isActive ? 'font-medium text-foreground' : 'text-foreground',
						!hasChildren && 'ml-4',
					)}
				>
					{item.name}
				</Link>
			</div>
			{hasChildren && open && (
				<ul className='ml-3 mt-1 space-y-1 border-l border-border pl-2'>
					{item.children!.map(child => (
						<TreeNode
							key={child.href}
							item={child}
							activePath={activePath}
							depth={depth + 1}
						/>
					))}
				</ul>
			)}
		</li>
	)
}

export default function CategoryTree({
	title,
	items,
	activePath,
	defaultOpen = false,
}: CategoryTreeProps) {
	const [open, setOpen] = useState(defaultOpen)

	return (
		<div className='border-b border-border/80 py-3.5'>
			<button
				onClick={() => setOpen(!open)}
				className='group/toggle flex w-full items-center justify-between gap-3 text-left'
			>
				<h3 className='text-sm font-semibold uppercase tracking-widest text-foreground'>
					{title}
				</h3>
				<ChevronDown
					className={cn(
						'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/toggle:text-foreground',
						!open && '-rotate-90',
					)}
					strokeWidth={1.5}
				/>
			</button>
			<div
				className={cn(
					'grid transition-[grid-template-rows] duration-200 ease-out',
					open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
				)}
			>
				<div className='overflow-hidden'>
					<ul className='mt-2.5 space-y-1'>
						{items.map(item => (
							<TreeNode key={item.href} item={item} activePath={activePath} />
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}

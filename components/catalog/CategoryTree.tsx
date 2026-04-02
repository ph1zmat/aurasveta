'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryTreeItem } from '@/types/catalog'

export type { CategoryTreeItem }

interface CategoryTreeProps {
	title: string
	items: CategoryTreeItem[]
	activePath?: string
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
			<div className='flex items-center'>
				{hasChildren && (
					<button
						onClick={() => setOpen(!open)}
						className='mr-1 p-0.5 text-muted-foreground hover:text-foreground transition-colors'
						aria-label={open ? 'Свернуть' : 'Развернуть'}
					>
						<ChevronDown
							className={cn(
								'h-3 w-3 transition-transform',
								!open && '-rotate-90',
							)}
							strokeWidth={1.5}
						/>
					</button>
				)}
				<Link
					href={item.href}
					className={cn(
						'text-sm transition-colors hover:text-primary',
						isActive ? 'font-medium text-foreground' : 'text-primary',
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
}: CategoryTreeProps) {
	return (
		<div className='border-b border-border pb-4'>
			<h3 className='mb-3 text-sm font-bold uppercase tracking-wider text-foreground'>
				{title}
			</h3>
			<ul className='space-y-1'>
				{items.map(item => (
					<TreeNode key={item.href} item={item} activePath={activePath} />
				))}
			</ul>
		</div>
	)
}

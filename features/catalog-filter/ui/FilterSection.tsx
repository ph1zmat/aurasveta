'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Checkbox } from '@/shared/ui/Checkbox'

interface FilterSectionProps {
	title: string
	defaultOpen?: boolean
	children?: React.ReactNode
}

export default function FilterSection({
	title,
	defaultOpen = false,
	children,
}: FilterSectionProps) {
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
					<div className='mt-2.5'>{children}</div>
				</div>
			</div>
		</div>
	)
}

/* Sub-filter item (expandable child like "Высота, мм" under РАЗМЕРЫ) */
export function FilterSubItem({ label }: { label: string }) {
	return (
		<button className='-mx-1 flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground'>
			<Plus className='h-3 w-3' strokeWidth={1.5} />
			{label}
		</button>
	)
}

/* Checkbox filter item */
export function CheckboxFilterItem({
	label,
	checked = false,
	count,
	disabled = false,
	onChange,
}: {
	label: string
	checked?: boolean
	count?: number
	disabled?: boolean
	onChange?: (checked: boolean) => void
}) {
	return (
		<label
			className={cn(
				'-mx-1 flex items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors',
				disabled
					? 'cursor-not-allowed opacity-60'
					: 'cursor-pointer hover:bg-muted/50',
			)}
		>
			<Checkbox
				checked={checked}
				disabled={disabled}
				onChange={e => onChange?.(e.target.checked)}
			/>
			<span className='min-w-0 flex-1 text-sm text-foreground'>{label}</span>
			{typeof count === 'number' && (
				<span className='text-xs tabular-nums text-muted-foreground'>
					{count}
				</span>
			)}
		</label>
	)
}

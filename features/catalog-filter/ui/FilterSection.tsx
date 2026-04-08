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
		<div className='border-b border-border py-4'>
			<button
				onClick={() => setOpen(!open)}
				className='flex w-full items-center justify-between text-left group/toggle'
			>
				<h3 className='text-sm font-semibold uppercase tracking-widest text-foreground'>
					{title}
				</h3>
				<ChevronDown
					className={cn(
						'h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover/toggle:text-foreground',
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
					<div className='mt-3'>{children}</div>
				</div>
			</div>
		</div>
	)
}

/* Sub-filter item (expandable child like "Высота, мм" under РАЗМЕРЫ) */
export function FilterSubItem({ label }: { label: string }) {
	return (
		<button className='flex w-full items-center gap-2 rounded-sm py-1.5 -mx-1 px-1 text-sm text-muted-foreground transition-colors hover:text-primary hover:bg-muted/50'>
			<Plus className='h-3 w-3' strokeWidth={1.5} />
			{label}
		</button>
	)
}

/* Checkbox filter item */
export function CheckboxFilterItem({
	label,
	checked = false,
	onChange,
}: {
	label: string
	checked?: boolean
	onChange?: (checked: boolean) => void
}) {
	return (
		<label className='flex cursor-pointer items-center gap-2 rounded-sm py-1.5 -mx-1 px-1 transition-colors hover:bg-muted/50'>
			<Checkbox
				checked={checked}
				onChange={e => onChange?.(e.target.checked)}
			/>
			<span className='text-sm text-foreground'>{label}</span>
		</label>
	)
}

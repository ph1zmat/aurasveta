'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/Checkbox'

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
				className='flex w-full items-center justify-between text-left'
			>
				<h3 className='text-sm font-bold uppercase tracking-wider text-foreground'>
					{title}
				</h3>
				{open ? (
					<ChevronDown
						className='h-4 w-4 text-muted-foreground'
						strokeWidth={1.5}
					/>
				) : (
					<Plus className='h-4 w-4 text-muted-foreground' strokeWidth={1.5} />
				)}
			</button>
			{open && <div className='mt-3'>{children}</div>}
		</div>
	)
}

/* Sub-filter item (expandable child like "Высота, мм" under РАЗМЕРЫ) */
export function FilterSubItem({ label }: { label: string }) {
	return (
		<button className='flex items-center gap-2 py-1 text-sm text-primary hover:text-foreground transition-colors'>
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
		<label className='flex cursor-pointer items-center gap-2 py-1'>
			<Checkbox
				checked={checked}
				onChange={e => onChange?.(e.target.checked)}
			/>
			<span className='text-sm text-foreground'>{label}</span>
		</label>
	)
}

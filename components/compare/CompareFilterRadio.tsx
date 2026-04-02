'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type FilterValue = 'all' | 'diff'

interface CompareFilterRadioProps {
	defaultValue?: FilterValue
	onChange?: (value: FilterValue) => void
}

const options: { label: string; value: FilterValue }[] = [
	{ label: 'Все характеристики', value: 'all' },
	{ label: 'Только различающиеся', value: 'diff' },
]

export default function CompareFilterRadio({
	defaultValue = 'all',
	onChange,
}: CompareFilterRadioProps) {
	const [value, setValue] = useState<FilterValue>(defaultValue)

	const handleChange = (next: FilterValue) => {
		setValue(next)
		onChange?.(next)
	}

	return (
		<div className='flex flex-col gap-3'>
			{options.map(opt => (
				<label
					key={opt.value}
					className='flex cursor-pointer items-center gap-2 text-sm text-foreground'
				>
					<span
						className={cn(
							'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
							value === opt.value
								? 'border-foreground'
								: 'border-muted-foreground',
						)}
					>
						{value === opt.value && (
							<span className='h-2.5 w-2.5 rounded-full bg-foreground' />
						)}
					</span>
					{opt.label}
				</label>
			))}
		</div>
	)
}

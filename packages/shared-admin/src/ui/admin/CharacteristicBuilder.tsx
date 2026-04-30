'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { FormFieldShell } from '../form'

export interface CharacteristicFilterValue {
	propertyId: string
	valueIds: string[]
}

export interface CharacteristicFilterBuilderProps {
	value: CharacteristicFilterValue[]
	onChange: (value: CharacteristicFilterValue[]) => void
	disabled?: boolean
}

export function CharacteristicFilterBuilder({
	value,
	onChange,
	disabled,
}: CharacteristicFilterBuilderProps) {
	const [addPropertyId, setAddPropertyId] = useState('')
	const { data: properties = [] } = trpc.properties.getAll.useQuery()

	function addFilter() {
		if (!addPropertyId) return
		if (value.some(f => f.propertyId === addPropertyId)) return
		onChange([...value, { propertyId: addPropertyId, valueIds: [] }])
		setAddPropertyId('')
	}

	function removeFilter(propertyId: string) {
		onChange(value.filter(f => f.propertyId !== propertyId))
	}

	function toggleValueId(propertyId: string, valueId: string) {
		onChange(
			value.map(f =>
				f.propertyId === propertyId
					? {
							...f,
							valueIds: f.valueIds.includes(valueId)
								? f.valueIds.filter(id => id !== valueId)
								: [...f.valueIds, valueId],
						}
					: f,
			),
		)
	}

	return (
		<div className='space-y-3'>
			{value.map(filter => {
				const prop = properties.find(p => p.id === filter.propertyId)
				const options = prop?.values ?? []
				return (
					<div key={filter.propertyId} className='rounded-xl border border-border/70 bg-muted/10 p-3'>
						<div className='mb-2 flex items-center justify-between'>
							<span className='text-sm font-medium text-foreground'>
								{prop?.name ?? filter.propertyId}
							</span>
							<button
								type='button'
								disabled={disabled}
								onClick={() => removeFilter(filter.propertyId)}
								className='rounded p-0.5 text-muted-foreground hover:text-destructive'
							>
								<Trash2 className='h-3.5 w-3.5' />
							</button>
						</div>
						<div className='flex flex-wrap gap-1.5'>
							{options.map(opt => (
								<button
									key={opt.id}
									type='button'
									disabled={disabled}
									onClick={() => toggleValueId(filter.propertyId, opt.id)}
									className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
										filter.valueIds.includes(opt.id)
											? 'border-primary bg-primary/10 text-primary'
											: 'border-border text-muted-foreground hover:border-primary/50'
									}`}
								>
									{opt.value}
								</button>
							))}
						</div>
					</div>
				)
			})}

			<FormFieldShell label='Добавить характеристику'>
				<div className='flex gap-2'>
					<select
						value={addPropertyId}
						onChange={e => setAddPropertyId(e.target.value)}
						disabled={disabled}
						className='flex h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
					>
						<option value=''>Выберите характеристику…</option>
						{properties
							.filter(p => !value.some(f => f.propertyId === p.id))
							.map(p => (
								<option key={p.id} value={p.id}>{p.name}</option>
							))}
					</select>
					<button
						type='button'
						disabled={disabled || !addPropertyId}
						onClick={addFilter}
						className='flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-40'
					>
						<Plus className='h-3.5 w-3.5' /> Добавить
					</button>
				</div>
			</FormFieldShell>
		</div>
	)
}

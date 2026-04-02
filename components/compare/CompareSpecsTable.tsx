import { cn } from '@/lib/utils'
import type { CompareSpecRow, CompareSpecSection } from '@/types/specs'

export type { CompareSpecRow, CompareSpecSection }

interface CompareSpecsTableProps {
	sections: CompareSpecSection[]
	className?: string
}

export default function CompareSpecsTable({
	sections,
	className,
}: CompareSpecsTableProps) {
	return (
		<div className={cn('divide-y divide-border', className)}>
			{sections.map(section => (
				<div key={section.title} className='py-6'>
					<h3 className='mb-4 text-base font-bold text-foreground'>
						{section.title}
					</h3>

					<div className='grid grid-cols-[280px_repeat(3,1fr)] gap-x-6'>
						{section.rows.map(row => (
							<div key={row.label} className='contents'>
								<div className='py-2 text-sm text-muted-foreground'>
									{row.label}
								</div>
								{row.values.map((value, i) => (
									<div key={i} className='py-2 text-sm text-foreground'>
										{value ?? ''}
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	)
}

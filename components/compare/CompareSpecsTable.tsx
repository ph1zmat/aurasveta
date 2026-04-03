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
				<div key={section.title} className='py-4 md:py-6'>
					<h3 className='mb-3 text-sm font-bold text-foreground md:mb-4 md:text-base'>
						{section.title}
					</h3>

					<div className='overflow-x-auto scrollbar-hide'>
						<div className='grid min-w-[700px] grid-cols-[160px_repeat(3,1fr)] gap-x-4 md:min-w-0 md:grid-cols-[280px_repeat(3,1fr)] md:gap-x-6'>
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
				</div>
			))}
		</div>
	)
}

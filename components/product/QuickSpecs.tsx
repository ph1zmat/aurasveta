import Link from 'next/link'
import { ChevronRight, Info } from 'lucide-react'
import type { SpecItem } from '@/types/specs'

export type { SpecItem }

interface QuickSpecsProps {
	specs: SpecItem[]
	allSpecsHref?: string
}

export default function QuickSpecs({
	specs,
	allSpecsHref = '#specs',
}: QuickSpecsProps) {
	return (
		<div className='mt-4'>
			<h3 className='mb-3 text-base font-bold text-foreground'>
				Характеристики
			</h3>
			<div className='rounded-sm border border-border bg-card p-4'>
				<div className='grid grid-cols-2 gap-x-6 gap-y-2'>
					{specs.map(spec => (
						<div
							key={spec.label}
							className='flex items-center justify-between text-sm'
						>
							<span className='text-muted-foreground'>{spec.label}</span>
							<span className='flex items-center gap-1 font-medium text-foreground'>
								{spec.value}
								{spec.tooltip && (
									<Info
										className='h-3.5 w-3.5 text-muted-foreground'
										strokeWidth={1.5}
									/>
								)}
							</span>
						</div>
					))}
				</div>
			</div>
			<Link
				href={allSpecsHref}
				className='mt-2 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary'
			>
				Все характеристики
				<ChevronRight className='h-3.5 w-3.5' strokeWidth={1.5} />
			</Link>
		</div>
	)
}

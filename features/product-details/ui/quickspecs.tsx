import Link from 'next/link'
import { ChevronRight, Info } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import type { SpecItem } from '@/entities/spec/model/types'

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
			<div className='mb-3'>
				<p className='mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
					Товар
				</p>
				<h2 className='text-base font-semibold tracking-[0.04em] text-foreground'>
					Характеристики
				</h2>
			</div>
			<Card
				padding='compact'
				className='rounded-[20px] border border-border bg-card/50'
			>
				<div className='grid grid-cols-1 gap-x-6 sm:grid-cols-2'>
					{specs.map(spec => (
						<div
							key={spec.label}
							className='flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0'
						>
							<span className='text-muted-foreground'>{spec.label}</span>
							<span className='flex items-center gap-1 font-medium text-foreground text-right'>
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
			</Card>
			<Link
				href={allSpecsHref}
				className='group/link mt-2 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary'
			>
				Все характеристики
				<ChevronRight
					className='h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5'
					strokeWidth={1.5}
				/>
			</Link>
		</div>
	)
}

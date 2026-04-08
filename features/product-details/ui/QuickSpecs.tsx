import Link from 'next/link'
import { ChevronRight, Info } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/Card'
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
			<h3 className='mb-3 text-base font-semibold tracking-widest text-foreground'>
				Характеристики
			</h3>
			<Card padding='compact' className='bg-muted border-0 rounded-[20px]'>
				<div className='grid grid-cols-1 gap-x-6 sm:grid-cols-2'>
					{specs.map((spec, i) => (
						<div
							key={spec.label}
							className={cn(
								'flex items-center justify-between rounded-sm px-2 py-2 text-sm',
								i % 2 === 0 && 'bg-muted/30',
							)}
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

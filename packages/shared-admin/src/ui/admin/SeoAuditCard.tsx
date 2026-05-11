'use client'

import type { SeoFormValues } from '@/shared/types/seo'
import { computeSeoAudit } from '@/lib/seo/domain/audit'
import { normalizeSeoFields } from '@/lib/seo/metadata-persistence'
import { Button } from '@/shared/ui/Button'

interface SeoAuditCardProps {
	value: SeoFormValues
	onAutoFill?: () => void
	autoFillLabel?: string
	note?: string
}

export function SeoAuditCard({
	value,
	onAutoFill,
	autoFillLabel = 'Заполнить автоматически',
	note,
}: SeoAuditCardProps) {
	const audit = computeSeoAudit(
		normalizeSeoFields({
			title: value.title,
			description: value.description,
			keywords: value.keywords,
			ogTitle: value.ogTitle,
			ogDescription: value.ogDescription,
			ogImage: value.ogImage,
			canonicalUrl: value.canonicalUrl,
			noIndex: value.noIndex,
		}),
	)

	return (
		<div className='rounded-md border border-border bg-secondary/30 p-3 space-y-3'>
			<div className='flex items-center justify-between gap-2'>
				<div className='text-sm font-medium'>Общий SEO-аудит</div>
				{onAutoFill ? (
					<Button type='button' variant='outline' size='sm' onClick={onAutoFill}>
						{autoFillLabel}
					</Button>
				) : null}
			</div>

			<div className='flex items-center justify-between text-xs text-muted-foreground'>
				<span>Оценка: {audit.score}/100</span>
				<span>{audit.flags.length} проблем</span>
			</div>

			<div className='h-2 w-full rounded-full bg-secondary overflow-hidden'>
				<div
					className={`h-full rounded-full transition-all duration-300 ${
						audit.score >= 80
							? 'bg-success'
							: audit.score >= 50
								? 'bg-warning'
								: 'bg-destructive'
					}`}
					style={{ width: `${audit.score}%` }}
				/>
			</div>

			{audit.flags.length > 0 ? (
				<div className='space-y-1.5'>
					{audit.flags.map(flag => (
						<div key={flag.code} className='text-xs text-muted-foreground flex items-start gap-2'>
							<span
								className={`mt-0.5 inline-block h-2 w-2 rounded-full ${
									flag.severity === 'error'
										? 'bg-destructive'
										: flag.severity === 'warning'
											? 'bg-warning'
											: 'bg-muted-foreground'
								}`}
							/>
							<span>{flag.message}</span>
						</div>
					))}
				</div>
			) : (
				<div className='text-xs text-success'>SEO-поля выглядят хорошо</div>
			)}

			{note ? <div className='text-xs text-muted-foreground'>{note}</div> : null}
		</div>
	)
}

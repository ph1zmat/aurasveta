'use client'

import type { SeoFormValues } from '@/shared/types/seo'
import { SeoAuditCard } from './SeoAuditCard'
import { SeoEditor } from './SeoEditor'

interface SeoFieldsBlockProps {
	value: SeoFormValues
	onChange: (value: SeoFormValues) => void
	onAutoFill?: () => void
	autoFillLabel?: string
	auditNote?: string
	title?: string
	description?: string
	disabled?: boolean
}

export function SeoFieldsBlock({
	value,
	onChange,
	onAutoFill,
	autoFillLabel,
	auditNote,
	title,
	description,
	disabled,
}: SeoFieldsBlockProps) {
	return (
		<div className='space-y-4'>
			<SeoAuditCard
				value={value}
				onAutoFill={onAutoFill}
				autoFillLabel={autoFillLabel}
				note={auditNote}
			/>
			<SeoEditor
				mode='controlled'
				value={value}
				onChange={onChange}
				title={title}
				description={description}
				disabled={disabled}
			/>
		</div>
	)
}

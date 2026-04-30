'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { trpc } from '@/lib/trpc/client'
import type { SeoTargetType, SeoFormValues } from '@/shared/types/seo'
import { Button } from '@/shared/ui/Button'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { SeoInlineEditor } from './SeoInlineEditor'

interface BaseSeoEditorProps {
	title?: string
	description?: string
	disabled?: boolean
}

interface ControlledSeoEditorProps extends BaseSeoEditorProps {
	mode?: 'controlled'
	value: SeoFormValues
	onChange: (value: SeoFormValues) => void
}

interface ManagedSeoEditorProps extends BaseSeoEditorProps {
	mode: 'managed'
	targetType: SeoTargetType
	targetId: string
	submitLabel?: string
	onSaved?: (value: SeoFormValues) => void | Promise<void>
}

export type SeoEditorProps = ControlledSeoEditorProps | ManagedSeoEditorProps

function getInitialValues(existing?: {
	title?: string | null
	description?: string | null
	keywords?: string | null
	ogTitle?: string | null
	ogDescription?: string | null
	ogImage?: string | null
	canonicalUrl?: string | null
	noIndex?: boolean | null
} | null): SeoFormValues {
	return {
		title: existing?.title ?? '',
		description: existing?.description ?? '',
		keywords: existing?.keywords ?? '',
		ogTitle: existing?.ogTitle ?? '',
		ogDescription: existing?.ogDescription ?? '',
		ogImage: existing?.ogImage ?? '',
		canonicalUrl: existing?.canonicalUrl ?? '',
		noIndex: existing?.noIndex ?? false,
	}
}

function getSubmitError(value: SeoFormValues) {
	if (value.canonicalUrl.trim()) {
		try {
			new URL(value.canonicalUrl)
		} catch {
			return 'Canonical URL должен быть абсолютной ссылкой.'
		}
	}

	if (value.ogImage.trim()) {
		try {
			new URL(value.ogImage)
		} catch {
			return 'OG Image URL должен быть абсолютной ссылкой.'
		}
	}

	return null
	}

function getMutationErrorMessage(error: unknown) {
	if (error instanceof Error && error.message.trim()) {
		return error.message
	}

	return 'Не удалось сохранить SEO. Проверьте поля формы и попробуйте снова.'
}

function ManagedSeoEditor({
	targetType,
	targetId,
	title,
	description,
	disabled,
	submitLabel = 'Сохранить SEO',
	onSaved,
}: ManagedSeoEditorProps) {
	const { data: existing, refetch } = trpc.seo.getByTarget.useQuery({
		targetType,
		targetId,
	})
	const updateMutation = trpc.seo.update.useMutation({
		onSuccess: () => {
			void refetch()
		},
	})
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const initialValues = useMemo(() => getInitialValues(existing), [existing])
	useUnsavedChangesGuard(hasUnsavedChanges)

	const form = useForm({
		defaultValues: initialValues,
		onSubmitInvalid: ({ value }) => {
			setSubmitError(
				getSubmitError(value) ??
					'Проверьте SEO-поля и исправьте подсвеченные ошибки.',
			)
		},
		onSubmit: async ({ value }) => {
			const validationError = getSubmitError(value)
			if (validationError) {
				setSubmitError(validationError)
				return
			}

			setSubmitError(null)

			try {
				await updateMutation.mutateAsync({
					targetType,
					targetId,
					title: value.title || null,
					description: value.description || null,
					keywords: value.keywords || null,
					ogTitle: value.ogTitle || null,
					ogDescription: value.ogDescription || null,
					ogImage: value.ogImage || null,
					canonicalUrl: value.canonicalUrl || null,
					noIndex: value.noIndex,
				})
				setHasUnsavedChanges(false)
				await onSaved?.(value)
			} catch (error) {
				setSubmitError(getMutationErrorMessage(error))
			}
		},
	})

	useEffect(() => {
		form.reset(initialValues)
	}, [form, initialValues])

	function markDirty() {
		setHasUnsavedChanges(true)
		setSubmitError(null)
	}

	const formId = `seo-editor-${targetType}-${targetId}`

	return (
		<form
			id={formId}
			onSubmit={event => {
				event.preventDefault()
				void form.handleSubmit()
			}}
			className='space-y-4 rounded-lg border border-border p-4'
		>
			{submitError ? (
				<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
					{submitError}
				</div>
			) : null}

			<SeoInlineEditor
				value={form.state.values}
				onChange={next => {
					markDirty()
					form.setFieldValue('title', next.title)
					form.setFieldValue('description', next.description)
					form.setFieldValue('keywords', next.keywords)
					form.setFieldValue('ogTitle', next.ogTitle)
					form.setFieldValue('ogDescription', next.ogDescription)
					form.setFieldValue('ogImage', next.ogImage)
					form.setFieldValue('canonicalUrl', next.canonicalUrl)
					form.setFieldValue('noIndex', next.noIndex)
				}}
				disabled={disabled || updateMutation.isPending}
				title={title}
				description={description}
			/>

			<div className='flex justify-end'>
				<form.Subscribe selector={state => state.isSubmitting}>
					{isSubmitting => (
						<Button
							type='submit'
							variant='primary'
							size='sm'
							disabled={disabled || isSubmitting || updateMutation.isPending}
						>
							{isSubmitting || updateMutation.isPending
								? 'Сохранение...'
								: submitLabel}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}

export function SeoEditor(props: SeoEditorProps) {
	if (props.mode === 'managed') {
		return <ManagedSeoEditor {...props} />
	}

	return (
		<SeoInlineEditor
			value={props.value}
			onChange={props.onChange}
			disabled={props.disabled}
			title={props.title}
			description={props.description}
		/>
	)
}
'use client'

import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import type { AnyFieldApi } from '@tanstack/form-core'
import {
	FormCheckbox,
	FormInput,
	useUnsavedChangesGuard,
} from '@aurasveta/shared-admin'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import AdminModal from '@/shared/ui/AdminModal'
import { generateSlug } from '@/shared/lib/generateSlug'

type PropertyDetails = RouterOutputs['properties']['getById']

type PropertyFormValue = {
	name: string
	slug: string
	hasPhoto: boolean
}

function getInitialValues(
	editProp?: PropertyDetails | null,
): PropertyFormValue {
	return {
		name: editProp?.name ?? '',
		slug: editProp?.slug ?? '',
		hasPhoto: editProp?.hasPhoto ?? false,
	}
}

function getFieldError(field: Pick<AnyFieldApi, 'state'>) {
	if (!field.state.meta.isTouched) return null
	const firstError = field.state.meta.errors[0]
	return typeof firstError === 'string' ? firstError : null
}

function getSubmitError(value: PropertyFormValue) {
	if (!value.name.trim()) return 'Введите название свойства.'
	if (value.slug.trim() && generateSlug(value.slug) !== value.slug.trim()) {
		return 'Slug должен содержать только латиницу, цифры и дефис.'
	}
	return null
}

function getMutationErrorMessage(error: unknown) {
	if (error instanceof Error && error.message.trim()) {
		return error.message
	}

	return 'Не удалось сохранить свойство. Проверьте поля формы и попробуйте снова.'
}

export default function PropertyFormModal({
	editId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void | Promise<void>
}) {
	const { data: editProp, isLoading } = trpc.properties.getById.useQuery(
		editId!,
		{
			enabled: !!editId,
		},
	)

	if (editId && isLoading) {
		return (
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
				<div className='rounded-2xl bg-background p-6 shadow-xl'>
					<p className='text-sm text-muted-foreground'>Загрузка...</p>
				</div>
			</div>
		)
	}

	return (
		<PropertyFormModalContent
			key={`${editId ?? 'new'}:${editProp?.id ?? 'blank'}`}
			editId={editId}
			onClose={onClose}
			onSuccess={onSuccess}
			initialForm={getInitialValues(editProp)}
		/>
	)
}

function PropertyFormModalContent({
	editId,
	onClose,
	onSuccess,
	initialForm,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void | Promise<void>
	initialForm: PropertyFormValue
}) {
	const createMut = trpc.properties.create.useMutation()
	const updateMut = trpc.properties.update.useMutation()
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [slugTouched, setSlugTouched] = useState(Boolean(initialForm.slug))
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	const initialValues = useMemo(() => initialForm, [initialForm])

	const form = useForm({
		defaultValues: initialValues,
		onSubmitInvalid: ({ value }) => {
			setSubmitError(
				getSubmitError(value) ??
					'Проверьте обязательные поля и исправьте подсвеченные ошибки.',
			)
		},
		onSubmit: async ({ value }) => {
			const validationError = getSubmitError(value)
			if (validationError) {
				setSubmitError(validationError)
				return
			}

			setSubmitError(null)

			const payload = {
				name: value.name.trim(),
				slug: (value.slug.trim() || generateSlug(value.name)).trim(),
				hasPhoto: value.hasPhoto,
			}

			try {
				if (editId) {
					await updateMut.mutateAsync({ id: editId, ...payload })
				} else {
					await createMut.mutateAsync(payload)
				}

				await onSuccess()
			} catch (error) {
				setSubmitError(getMutationErrorMessage(error))
			}
		},
	})
	const confirmDiscard = useUnsavedChangesGuard(hasUnsavedChanges)
	const safeClose = () => {
		if (confirmDiscard()) onClose()
	}
	const markDirty = () => {
		setHasUnsavedChanges(true)
		setSubmitError(null)
	}

	const formId = 'property-form-modal'

	return (
		<AdminModal
			isOpen
			onClose={safeClose}
			title={editId ? 'Редактировать свойство' : 'Новое свойство'}
			size='sm'
			footer={[
				<Button key='cancel' variant='ghost' type='button' onClick={safeClose}>
					Отмена
				</Button>,
				<form.Subscribe key='submit' selector={state => state.isSubmitting}>
					{isSubmitting => (
						<Button type='submit' form={formId} disabled={isSubmitting}>
							{isSubmitting
								? editId
									? 'Сохранение...'
									: 'Создание...'
								: editId
									? 'Сохранить'
									: 'Создать'}
						</Button>
					)}
				</form.Subscribe>,
			]}
		>
			<form
				id={formId}
				onSubmit={event => {
					event.preventDefault()
					void form.handleSubmit()
				}}
				className='space-y-4 px-6 py-5'
			>
				{submitError ? (
					<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
						{submitError}
					</div>
				) : null}

				<div className='grid grid-cols-2 gap-3'>
					<form.Field
						name='name'
						validators={{
							onBlur: ({ value }) =>
								value.trim() ? undefined : 'Введите название свойства.',
						}}
					>
						{field => {
							const error = getFieldError(field)
							return (
								<FormInput
									id='property-name'
									label='Название'
									required
									error={error}
									value={field.state.value}
									onChange={event => {
										markDirty()
										const nextName = event.target.value
										field.handleChange(nextName)
										if (!slugTouched) {
											form.setFieldValue('slug', generateSlug(nextName))
										}
									}}
									onBlur={field.handleBlur}
									placeholder='Цвет'
									size='sm'
								/>
							)
						}}
					</form.Field>

					<form.Field
						name='slug'
						validators={{
							onBlur: ({ value }) => {
								if (!value.trim()) return undefined
								return generateSlug(value) === value.trim()
									? undefined
									: 'Slug должен содержать только латиницу, цифры и дефис.'
							},
						}}
					>
						{field => {
							const error = getFieldError(field)
							return (
								<FormInput
									id='property-slug'
									label='Slug'
									error={error}
									hint={
										error
											? undefined
											: 'Если оставить поле пустым, slug сгенерируется автоматически.'
									}
									value={field.state.value}
									onChange={event => {
										markDirty()
										setSlugTouched(true)
										field.handleChange(event.target.value)
									}}
									onBlur={() => {
										if (!field.state.value) {
											field.handleBlur()
											return
										}
										setSlugTouched(true)
										field.handleChange(generateSlug(field.state.value))
										field.handleBlur()
									}}
									placeholder='color'
									inputClassName='font-mono'
									size='sm'
								/>
							)
						}}
					</form.Field>
				</div>

				<form.Field name='hasPhoto'>
					{field => (
						<FormCheckbox
							checked={field.state.value}
							onChange={checked => {
								markDirty()
								field.handleChange(checked)
							}}
							onBlur={field.handleBlur}
							label='Значения со фото'
						/>
					)}
				</form.Field>
			</form>
		</AdminModal>
	)
}

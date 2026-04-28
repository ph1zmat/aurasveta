'use client'

import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import type { AnyFieldApi } from '@tanstack/form-core'
import {
	FormCheckbox,
	FormInput,
	FormSelect,
	FormTextarea,
	useUnsavedChangesGuard,
} from '@aurasveta/shared-admin'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import FileUploader from '@/shared/ui/FileUploader'
import AdminModal from '@/shared/ui/AdminModal'
import { Button } from '@/shared/ui/Button'
import { generateSlug } from '@/shared/lib/generateSlug'
import { findNodeInTree } from '@/lib/utils/tree'

type CategoryNodeData = NonNullable<
	RouterOutputs['categories']['getTree']
>[number]

type CategoryMode = 'MANUAL' | 'FILTER'
type CategoryFilterKind = 'PROPERTY_VALUE' | 'SALE'

type CategoryFormValue = {
	name: string
	slug: string
	description: string
	categoryMode: CategoryMode
	filterKind: CategoryFilterKind
	filterPropertyId: string
	filterPropertyValueId: string
	showInHeader: boolean
	pendingImageKey: string
	pendingImageOriginalName: string
}

const SLUG_HINT = 'Если оставить поле пустым, slug сгенерируется автоматически.'

function getInitialValues(editCat: CategoryNodeData | null): CategoryFormValue {
	if (!editCat) {
		return {
			name: '',
			slug: '',
			description: '',
			categoryMode: 'MANUAL',
			filterKind: 'PROPERTY_VALUE',
			filterPropertyId: '',
			filterPropertyValueId: '',
			showInHeader: true,
			pendingImageKey: '',
			pendingImageOriginalName: '',
		}
	}

	return {
		name: editCat.name ?? '',
		slug: editCat.slug ?? '',
		description: editCat.description ?? '',
		categoryMode: editCat.categoryMode ?? 'MANUAL',
		filterKind: editCat.filterKind ?? 'PROPERTY_VALUE',
		filterPropertyId: editCat.filterPropertyId ?? '',
		filterPropertyValueId: editCat.filterPropertyValueId ?? '',
		showInHeader: editCat.showInHeader ?? true,
		pendingImageKey: '',
		pendingImageOriginalName: '',
	}
}

function getFieldError(field: Pick<AnyFieldApi, 'state'>) {
	if (!field.state.meta.isTouched) return null
	const firstError = field.state.meta.errors[0]
	return typeof firstError === 'string' ? firstError : null
}

function getSubmitError(value: CategoryFormValue) {
	if (!value.name.trim()) return 'Введите название категории.'
	if (value.slug.trim() && generateSlug(value.slug) !== value.slug.trim()) {
		return 'Slug должен содержать только латиницу, цифры и дефис.'
	}
	if (
		value.categoryMode === 'FILTER' &&
		value.filterKind === 'PROPERTY_VALUE'
	) {
		if (!value.filterPropertyId) {
			return 'Выберите свойство для фильтрующей категории.'
		}
		if (!value.filterPropertyValueId) {
			return 'Выберите значение свойства для фильтрующей категории.'
		}
	}
	return null
}

function getMutationErrorMessage(error: unknown) {
	if (error instanceof Error && error.message.trim()) {
		return error.message
	}

	return 'Не удалось сохранить категорию. Проверьте поля формы и попробуйте снова.'
}

export default function CategoryFormModal({
	editId,
	parentId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	parentId: string | null
	onClose: () => void
	onSuccess: () => void | Promise<void>
}) {
	const utils = trpc.useUtils()
	const { data: tree } = trpc.categories.getTree.useQuery()
	const { data: properties } = trpc.properties.getAll.useQuery()
	const createMut = trpc.categories.create.useMutation()
	const updateMut = trpc.categories.update.useMutation()
	const updateImageMut = trpc.categories.updateImagePath.useMutation()
	const removeImageMut = trpc.categories.removeImage.useMutation()

	const editCat = editId && tree ? findNodeInTree(tree, editId) : null

	const invalidateCategoryQueries = async () => {
		await Promise.all([
			utils.categories.getTree.invalidate(),
			utils.categories.getAll.invalidate(),
			utils.categories.getNav.invalidate(),
			utils.categories.getHeaderTree.invalidate(),
		])
	}

	return (
		<CategoryFormModalContent
			key={`${editId ?? 'new'}:${editCat?.id ?? 'blank'}`}
			editId={editId}
			parentId={parentId}
			onClose={onClose}
			onSuccess={onSuccess}
			invalidateCategoryQueries={invalidateCategoryQueries}
			createMut={createMut}
			updateMut={updateMut}
			updateImageMut={updateImageMut}
			removeImageMut={removeImageMut}
			editCat={editCat}
			properties={properties ?? []}
		/>
	)
}

function CategoryFormModalContent({
	editId,
	parentId,
	onClose,
	onSuccess,
	invalidateCategoryQueries,
	createMut,
	updateMut,
	updateImageMut,
	removeImageMut,
	editCat,
	properties,
}: {
	editId: string | null
	parentId: string | null
	onClose: () => void
	onSuccess: () => void | Promise<void>
	invalidateCategoryQueries: () => Promise<void>
	createMut: ReturnType<typeof trpc.categories.create.useMutation>
	updateMut: ReturnType<typeof trpc.categories.update.useMutation>
	updateImageMut: ReturnType<typeof trpc.categories.updateImagePath.useMutation>
	removeImageMut: ReturnType<typeof trpc.categories.removeImage.useMutation>
	editCat: CategoryNodeData | null
	properties: RouterOutputs['properties']['getAll']
}) {
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [slugTouched, setSlugTouched] = useState(Boolean(editCat?.slug))
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	const initialValues = useMemo(() => getInitialValues(editCat), [editCat])

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
				slug: value.slug.trim() || generateSlug(value.name),
				description: value.description.trim() || undefined,
				parentId: parentId || undefined,
				categoryMode: value.categoryMode,
				filterKind: value.categoryMode === 'FILTER' ? value.filterKind : null,
				filterPropertyId:
					value.categoryMode === 'FILTER' &&
					value.filterKind === 'PROPERTY_VALUE'
						? value.filterPropertyId || null
						: null,
				filterPropertyValueId:
					value.categoryMode === 'FILTER' &&
					value.filterKind === 'PROPERTY_VALUE'
						? value.filterPropertyValueId || null
						: null,
				showInHeader: value.showInHeader,
			}

			try {
				if (editId) {
					await updateMut.mutateAsync({ id: editId, ...payload })
				} else {
					const created = await createMut.mutateAsync(payload)
					if (value.pendingImageKey) {
						await updateImageMut.mutateAsync({
							categoryId: created.id,
							imagePath: value.pendingImageKey,
							imageOriginalName: value.pendingImageOriginalName || null,
						})
					}
				}

				await invalidateCategoryQueries()
				setHasUnsavedChanges(false)
				await onSuccess()
			} catch (error) {
				setSubmitError(getMutationErrorMessage(error))
			}
		},
	})

	const selectedFilterPropertyId =
		form.state.values.categoryMode === 'FILTER' &&
		form.state.values.filterKind === 'PROPERTY_VALUE'
			? form.state.values.filterPropertyId
			: ''

	const { data: selectedProperty } = trpc.properties.getById.useQuery(
		selectedFilterPropertyId,
		{ enabled: Boolean(selectedFilterPropertyId) },
	)

	const availableValues = useMemo(
		() => selectedProperty?.values ?? [],
		[selectedProperty],
	)

	const confirmDiscard = useUnsavedChangesGuard(hasUnsavedChanges)
	const safeClose = () => {
		if (confirmDiscard()) onClose()
	}

	const formId = 'category-form-modal'

	return (
		<AdminModal
			isOpen
			onClose={safeClose}
			title={editId ? 'Редактировать категорию' : 'Новая категория'}
			size='md'
			footer={[
				<Button
					key='cancel'
					variant='outline'
					type='button'
					onClick={safeClose}
				>
					Отмена
				</Button>,
				<form.Subscribe key='submit' selector={state => state.isSubmitting}>
					{isSubmitting => (
						<Button type='submit' form={formId} disabled={isSubmitting}>
							{isSubmitting ? 'Сохранение...' : 'Сохранить'}
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
				className='space-y-4 p-6'
			>
				{submitError ? (
					<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
						{submitError}
					</div>
				) : null}

				<div className='grid grid-cols-2 gap-4'>
					<FileUploader
						currentImage={
							editCat?.imagePath ?? form.state.values.pendingImageKey ?? null
						}
						onUploaded={(key, originalName) => {
							setHasUnsavedChanges(true)
							setSubmitError(null)
							if (editId) {
								void updateImageMut
									.mutateAsync({
										categoryId: editId,
										imagePath: key,
										imageOriginalName: originalName,
									})
									.then(() => {
										setHasUnsavedChanges(false)
										void invalidateCategoryQueries()
									})
									.catch(error => {
										setSubmitError(getMutationErrorMessage(error))
									})
							} else {
								form.setFieldValue('pendingImageKey', key)
								form.setFieldValue('pendingImageOriginalName', originalName)
							}
						}}
						onRemove={() => {
							setHasUnsavedChanges(true)
							setSubmitError(null)
							if (editId) {
								void removeImageMut
									.mutateAsync(editId)
									.then(() => {
										setHasUnsavedChanges(false)
										void invalidateCategoryQueries()
									})
									.catch(error => {
										setSubmitError(getMutationErrorMessage(error))
									})
							} else {
								form.setFieldValue('pendingImageKey', '')
								form.setFieldValue('pendingImageOriginalName', '')
							}
						}}
						isLoading={updateImageMut.isPending || removeImageMut.isPending}
						label='Изображение'
						aspectRatio='square'
					/>
					<div className='flex flex-col'>
						<form.Field
							name='name'
							validators={{
								onBlur: ({ value }) =>
									value.trim() ? undefined : 'Введите название категории.',
							}}
						>
							{field => {
								const error = getFieldError(field)
								return (
									<FormInput
										id='category-name'
										label='Название'
										required
										error={error}
										value={field.state.value}
										onChange={event => {
											setHasUnsavedChanges(true)
											setSubmitError(null)
											const value = event.target.value
											field.handleChange(value)
											if (!slugTouched) {
												form.setFieldValue('slug', generateSlug(value))
											}
										}}
										onBlur={field.handleBlur}
										placeholder='Название категории'
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
										id='category-slug'
										label='Slug'
										required
										error={error}
										hint={!error ? SLUG_HINT : undefined}
										value={field.state.value}
										onChange={event => {
											setHasUnsavedChanges(true)
											setSubmitError(null)
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
										placeholder='category-slug'
										inputClassName='font-mono'
									/>
								)
							}}
						</form.Field>
						<form.Field name='showInHeader'>
							{field => (
								<div className='col-span-full'>
									<FormCheckbox
										variant='card'
										checked={field.state.value}
										onChange={checked => {
											setHasUnsavedChanges(true)
											setSubmitError(null)
											field.handleChange(checked)
										}}
										onBlur={field.handleBlur}
										label='Показывать категорию в хедере'
									/>
								</div>
							)}
						</form.Field>
					</div>
				</div>
				<div className='grid grid-cols-2 gap-4'>
					<form.Field name='description'>
						{field => (
							<FormTextarea
								id='category-description'
								label='Описание'
								value={field.state.value}
								onChange={event => {
									setHasUnsavedChanges(true)
									setSubmitError(null)
									field.handleChange(event.target.value)
								}}
								onBlur={field.handleBlur}
								rows={3}
								placeholder='Описание категории'
							/>
						)}
					</form.Field>
					<div className='flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/10 p-4'>
						<form.Field name='categoryMode'>
							{field => (
								<FormSelect
									id='category-mode'
									label='Тип категории'
									value={field.state.value}
									onChange={event => {
										setHasUnsavedChanges(true)
										setSubmitError(null)
										const nextMode = event.target.value as CategoryMode
										field.handleChange(nextMode)
										form.setFieldValue(
											'filterKind',
											nextMode === 'MANUAL'
												? 'PROPERTY_VALUE'
												: form.state.values.filterKind,
										)
										form.setFieldValue(
											'filterPropertyId',
											nextMode === 'MANUAL'
												? ''
												: form.state.values.filterPropertyId,
										)
										form.setFieldValue(
											'filterPropertyValueId',
											nextMode === 'MANUAL'
												? ''
												: form.state.values.filterPropertyValueId,
										)
									}}
									onBlur={field.handleBlur}
								>
									<option value='MANUAL'>Обычная категория</option>
									<option value='FILTER'>Фильтрующая категория</option>
								</FormSelect>
							)}
						</form.Field>

						{form.state.values.categoryMode === 'FILTER' && (
							<>
								<form.Field name='filterKind'>
									{field => (
										<FormSelect
											id='category-filter-kind'
											label='Правило фильтрации'
											value={field.state.value}
											onChange={event => {
												setHasUnsavedChanges(true)
												setSubmitError(null)
												const nextKind = event.target
													.value as CategoryFilterKind
												field.handleChange(nextKind)
												if (nextKind !== 'PROPERTY_VALUE') {
													form.setFieldValue('filterPropertyId', '')
													form.setFieldValue('filterPropertyValueId', '')
												}
											}}
											onBlur={field.handleBlur}
										>
											<option value='PROPERTY_VALUE'>
												По значению свойства
											</option>
											<option value='SALE'>Товары со скидкой</option>
										</FormSelect>
									)}
								</form.Field>

								{form.state.values.filterKind === 'PROPERTY_VALUE' && (
									<>
										<form.Field
											name='filterPropertyId'
											validators={{
												onSubmit: ({ value }) =>
													form.state.values.categoryMode === 'FILTER' &&
													form.state.values.filterKind === 'PROPERTY_VALUE' &&
													!value
														? 'Выберите свойство.'
														: undefined,
											}}
										>
											{field => (
												<FormSelect
													id='category-filter-property'
													label='Свойство'
													error={getFieldError(field)}
													value={field.state.value}
													onChange={event => {
														setHasUnsavedChanges(true)
														setSubmitError(null)
														field.handleChange(event.target.value)
														form.setFieldValue('filterPropertyValueId', '')
													}}
													onBlur={field.handleBlur}
												>
													<option value=''>Выберите свойство</option>
													{properties.map(property => (
														<option key={property.id} value={property.id}>
															{property.name}
														</option>
													))}
												</FormSelect>
											)}
										</form.Field>

										<form.Field
											name='filterPropertyValueId'
											validators={{
												onSubmit: ({ value }) =>
													form.state.values.categoryMode === 'FILTER' &&
													form.state.values.filterKind === 'PROPERTY_VALUE' &&
													form.state.values.filterPropertyId &&
													!value
														? 'Выберите значение свойства.'
														: undefined,
											}}
										>
											{field => (
												<FormSelect
													id='category-filter-value'
													label='Значение'
													error={getFieldError(field)}
													value={field.state.value}
													onChange={event => {
														setHasUnsavedChanges(true)
														setSubmitError(null)
														field.handleChange(event.target.value)
													}}
													onBlur={field.handleBlur}
													disabled={!form.state.values.filterPropertyId}
												>
													<option value=''>
														{!form.state.values.filterPropertyId
															? 'Сначала выберите свойство'
															: availableValues.length > 0
																? 'Выберите значение'
																: 'У свойства пока нет значений'}
													</option>
													{availableValues.map(value => (
														<option key={value.id} value={value.id}>
															{value.value}
														</option>
													))}
												</FormSelect>
											)}
										</form.Field>
									</>
								)}
							</>
						)}
					</div>
				</div>
			</form>
		</AdminModal>
	)
}

'use client'

import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import type { AnyFieldApi } from '@tanstack/form-core'
import {
	FormFieldShell,
	FormSection,
	useUnsavedChangesGuard,
} from '@aurasveta/shared-admin'
import { Plus } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import type { RouterOutputs } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import AdminModal from '@/shared/ui/AdminModal'
import { generateSlug } from '@/shared/lib/generateSlug'
import ProductImagesField, {
	type EditableProductImage,
} from './ProductImagesField'

type CategoryOption = RouterOutputs['categories']['getAll'][number]
type PropertyOption = RouterOutputs['properties']['getAll'][number]
type ProductDetails = RouterOutputs['products']['getById']
type ProductImageItem = NonNullable<
	NonNullable<ProductDetails>['images']
>[number]

type ProductFormValue = {
	name: string
	slug: string
	description: string
	price: string
	compareAtPrice: string
	stock: string
	sku: string
	categoryId: string
	brand: string
	brandCountry: string
	isActive: boolean
	images: EditableProductImage[]
	properties: Array<{
		propertyId: string
		propertyValueId: string
	}>
}

const INPUT_CLS =
	'flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
const INPUT_ERROR_CLS = 'border-destructive focus:ring-destructive/30'
const SLUG_HINT =
	'Латиница, цифры и дефис. Если оставить пустым, slug сгенерируется автоматически.'

function getInitialValues(product: ProductDetails | null): ProductFormValue {
	return {
		name: product?.name ?? '',
		slug: product?.slug ?? '',
		description: product?.description ?? '',
		price: product?.price != null ? String(product.price) : '',
		compareAtPrice:
			product?.compareAtPrice != null ? String(product.compareAtPrice) : '',
		stock: product?.stock != null ? String(product.stock) : '0',
		sku: product?.sku ?? '',
		categoryId: product?.categoryId ?? '',
		brand: product?.brand ?? '',
		brandCountry: product?.brandCountry ?? '',
		isActive: product?.isActive ?? true,
		images:
			product?.images?.map((image: ProductImageItem) => ({
				id: image.id,
				url: image.url,
				key: image.key,
				originalName: image.originalName ?? undefined,
				size: image.size ?? null,
				mimeType: image.mimeType ?? null,
				order: image.order,
				isMain: image.isMain,
			})) ?? [],
		properties:
			product?.properties?.map(property => ({
				propertyId: property.propertyId ?? property.property?.id ?? '',
				propertyValueId: property.propertyValueId ?? '',
			})) ?? [],
	}
}

function getNumericError(value: string, label: string) {
	if (!value.trim()) return null
	const parsed = Number(value)
	if (!Number.isFinite(parsed)) return `${label}: введите корректное число`
	if (parsed < 0) return `${label}: значение не может быть отрицательным`
	return null
}

function getProductSubmitError(value: ProductFormValue) {
	if (!value.name.trim()) return 'Введите название товара'
	if (value.price.trim()) {
		const priceError = getNumericError(value.price, 'Цена')
		if (priceError) return priceError
	}
	if (value.compareAtPrice.trim()) {
		const compareError = getNumericError(value.compareAtPrice, 'Старая цена')
		if (compareError) return compareError
	}
	if (value.stock.trim()) {
		const stock = Number.parseInt(value.stock, 10)
		if (!Number.isFinite(stock) || stock < 0) {
			return 'Остаток должен быть неотрицательным целым числом'
		}
	}

	const invalidProperty = value.properties.find(
		property =>
			(property.propertyId && !property.propertyValueId) ||
			(!property.propertyId && property.propertyValueId),
	)
	if (invalidProperty) {
		return 'Заполните свойство и значение полностью или удалите пустую строку'
	}

	return null
}

function parseOptionalNumber(value: string) {
	if (!value.trim()) return undefined
	return Number.parseFloat(value)
}

function parseStock(value: string) {
	if (!value.trim()) return 0
	const parsed = Number.parseInt(value, 10)
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function getPropertiesError(
	properties: ProductFormValue['properties'],
	allProperties?: PropertyOption[],
) {
	const invalidProperty = properties.find(
		property =>
			(property.propertyId && !property.propertyValueId) ||
			(!property.propertyId && property.propertyValueId),
	)
	if (invalidProperty) {
		return 'Заполните свойство и значение полностью или удалите пустую строку.'
	}

	const selected = properties
		.map(property => property.propertyId)
		.filter(Boolean)
	const duplicates = selected.filter(
		(propertyId, index) => selected.indexOf(propertyId) !== index,
	)
	if (duplicates.length > 0) {
		return 'Каждое свойство можно выбрать только один раз.'
	}

	if (!allProperties || allProperties.length === 0) {
		return undefined
	}

	const invalidValue = properties.find(property => {
		if (!property.propertyId || !property.propertyValueId) return false
		const currentProperty = allProperties.find(
			item => item.id === property.propertyId,
		)
		return !currentProperty?.values.some(
			value => value.id === property.propertyValueId,
		)
	})

	if (invalidValue) {
		return 'Одно из значений свойства больше не существует. Выберите значение заново.'
	}

	return undefined
}

function getFieldError(field: Pick<AnyFieldApi, 'state'>) {
	if (!field.state.meta.isTouched) return null
	const firstError = field.state.meta.errors[0]
	return typeof firstError === 'string' ? firstError : null
}

function getInputClassName(error?: string | null, extraClassName?: string) {
	return [INPUT_CLS, error ? INPUT_ERROR_CLS : '', extraClassName]
		.filter(Boolean)
		.join(' ')
}

function getMutationErrorMessage(error: unknown) {
	if (error instanceof Error && error.message.trim()) {
		return error.message
	}

	return 'Не удалось сохранить товар. Проверьте поля формы и повторите попытку.'
}

export default function ProductFormModal({
	editId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void | Promise<void>
}) {
	const { data: product, isLoading } = trpc.products.getById.useQuery(editId!, {
		enabled: !!editId,
	})

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
		<ProductFormModalContent
			key={editId ?? 'new'}
			editId={editId}
			product={product ?? null}
			onClose={onClose}
			onSuccess={onSuccess}
		/>
	)
}

function ProductFormModalContent({
	editId,
	product,
	onClose,
	onSuccess,
}: {
	editId: string | null
	product: ProductDetails | null
	onClose: () => void
	onSuccess: () => void | Promise<void>
}) {
	const { data: categories } = trpc.categories.getAll.useQuery()
	const { data: allProperties } = trpc.properties.getAll.useQuery()
	const createMut = trpc.products.create.useMutation()
	const updateMut = trpc.products.update.useMutation()
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug))
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	const initialValues = useMemo(() => getInitialValues(product), [product])

	const form = useForm({
		defaultValues: initialValues,
		onSubmitInvalid: ({ value }) => {
			setSubmitError(
				getProductSubmitError(value) ??
					'Проверьте обязательные поля и исправьте подсвеченные ошибки.',
			)
		},
		onSubmit: async ({ value }) => {
			const validationError = getProductSubmitError(value)
			if (validationError) {
				setSubmitError(validationError)
				return
			}

			setSubmitError(null)

			const payload = {
				name: value.name.trim(),
				slug: (value.slug.trim() || generateSlug(value.name)).trim(),
				description: value.description.trim() || undefined,
				price: parseOptionalNumber(value.price),
				compareAtPrice: value.compareAtPrice.trim()
					? parseOptionalNumber(value.compareAtPrice)
					: undefined,
				stock: parseStock(value.stock),
				sku: value.sku.trim() || undefined,
				categoryId: value.categoryId || undefined,
				brand: value.brand.trim() || undefined,
				brandCountry: value.brandCountry.trim() || undefined,
				isActive: value.isActive,
				images: value.images.map((image, index) => ({
					id: image.id,
					url: image.url,
					key: image.key,
					originalName: image.originalName ?? null,
					size: image.size ?? null,
					mimeType: image.mimeType ?? null,
					order: index,
					isMain: image.isMain,
				})),
				properties: value.properties
					.filter(property => property.propertyId && property.propertyValueId)
					.map(property => ({
						propertyId: property.propertyId,
						propertyValueId: property.propertyValueId,
					})),
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

	const usedPropertyIds = new Set(
		(form.state.values.properties ?? []).map(property => property.propertyId),
	)
	const canAddMoreProperties =
		!allProperties || usedPropertyIds.size < allProperties.length
	const confirmDiscard = useUnsavedChangesGuard(hasUnsavedChanges)
	const safeClose = () => {
		if (confirmDiscard()) onClose()
	}
	const markDirty = () => {
		setHasUnsavedChanges(true)
		setSubmitError(null)
	}

	return (
		<AdminModal
			isOpen
			onClose={safeClose}
			title={editId ? 'Редактировать товар' : 'Новый товар'}
			size='xl'
			scrollable
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
						<Button
							variant='primary'
							type='submit'
							form='product-form-modal'
							disabled={isSubmitting}
						>
							{isSubmitting ? 'Сохранение...' : 'Сохранить'}
						</Button>
					)}
				</form.Subscribe>,
			]}
		>
			<div className='p-6'>
				<form
					id='product-form-modal'
					onSubmit={event => {
						event.preventDefault()
						void form.handleSubmit()
					}}
					className='space-y-6'
				>
					{submitError ? (
						<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
							{submitError}
						</div>
					) : null}

					<form.Field name='isActive'>
						{field => (
							<div className='flex justify-end'>
								<label className='inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1.5 text-sm text-foreground'>
									<input
										type='checkbox'
										checked={field.state.value}
										onChange={event => {
											markDirty()
											field.handleChange(event.target.checked)
										}}
										onBlur={field.handleBlur}
										className='h-4 w-4 rounded border-border accent-primary'
									/>
									<span>Активный</span>
								</label>
							</div>
						)}
					</form.Field>

					<div className='grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]'>
						<form.Field name='images' mode='array'>
							{field => (
								<div>
									<ProductImagesField
										images={field.state.value}
										onChange={nextImages => {
											markDirty()
											field.handleChange(nextImages)
										}}
										disabled={form.state.isSubmitting}
										canUpload={Boolean(editId)}
										showHeader={false}
										emptyTitle={
											editId
												? 'Загрузите фото товара'
												: 'Сохраните товар, чтобы загрузить фото'
										}
										emptyDescription={
											editId
												? 'После загрузки ниже появятся миниатюры, а главное фото можно будет выбрать в один клик.'
												: ''
										}
									/>
								</div>
							)}
						</form.Field>

						<div className='space-y-4'>
							<form.Field
								name='name'
								validators={{
									onBlur: ({ value }) =>
										value.trim() ? undefined : 'Введите название товара.',
								}}
							>
								{field => {
									const error = getFieldError(field)
									return (
										<FormFieldShell
											label='Название'
											htmlFor='product-name'
											required
											error={error}
										>
											<input
												id='product-name'
												value={field.state.value}
												onChange={event => {
													markDirty()
													const name = event.target.value
													field.handleChange(name)
													if (!slugTouched) {
														form.setFieldValue('slug', generateSlug(name))
													}
												}}
												onBlur={field.handleBlur}
												placeholder='Введите название товара'
												aria-invalid={Boolean(error)}
												className={getInputClassName(error)}
											/>
										</FormFieldShell>
									)
								}}
							</form.Field>

							<div className='grid gap-4 sm:grid-cols-2'>
								<form.Field
									name='price'
									validators={{
										onBlur: ({ value }) =>
											getNumericError(value, 'Цена') ?? undefined,
									}}
								>
									{field => {
										const error = getFieldError(field)
										return (
											<FormFieldShell
												label='Цена'
												htmlFor='product-price'
												error={error}
											>
												<input
													id='product-price'
													type='number'
													step='0.01'
													value={field.state.value}
													onChange={event => {
														markDirty()
														field.handleChange(event.target.value)
													}}
													onBlur={field.handleBlur}
													placeholder='0'
													aria-invalid={Boolean(error)}
													className={getInputClassName(error)}
												/>
											</FormFieldShell>
										)
									}}
								</form.Field>
								<form.Field
									name='compareAtPrice'
									validators={{
										onBlur: ({ value }) =>
											getNumericError(value, 'Старая цена') ?? undefined,
									}}
								>
									{field => {
										const error = getFieldError(field)
										return (
											<FormFieldShell
												label='Старая цена'
												htmlFor='product-compare-at-price'
												error={error}
											>
												<input
													id='product-compare-at-price'
													type='number'
													step='0.01'
													value={field.state.value}
													onChange={event => {
														markDirty()
														field.handleChange(event.target.value)
													}}
													onBlur={field.handleBlur}
													placeholder='0'
													aria-invalid={Boolean(error)}
													className={getInputClassName(error)}
												/>
											</FormFieldShell>
										)
									}}
								</form.Field>
							</div>
						</div>
					</div>

					<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
						<form.Field name='description'>
							{field => (
								<FormFieldShell label='Описание' htmlFor='product-description'>
									<textarea
										id='product-description'
										value={field.state.value}
										onChange={event => {
											markDirty()
											field.handleChange(event.target.value)
										}}
										onBlur={field.handleBlur}
										rows={11}
										placeholder='Опишите товар...'
										className='flex w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
									/>
								</FormFieldShell>
							)}
						</form.Field>

						<div className='space-y-4'>
							<form.Field
								name='slug'
								validators={{
									onBlur: ({ value }) =>
										value.trim()
											? undefined
											: 'Введите slug или оставьте его для автогенерации.',
								}}
							>
								{field => {
									const error = getFieldError(field)
									return (
										<FormFieldShell
											label='Slug'
											htmlFor='product-slug'
											required
											error={error}
											hint={!error ? SLUG_HINT : undefined}
										>
											<input
												id='product-slug'
												value={field.state.value}
												onChange={event => {
													markDirty()
													setSlugTouched(true)
													field.handleChange(event.target.value)
												}}
												onBlur={() => {
													if (!field.state.value) return
													setSlugTouched(true)
													field.handleChange(generateSlug(field.state.value))
													field.handleBlur()
												}}
												placeholder='auto-generated'
												aria-invalid={Boolean(error)}
												className={getInputClassName(error)}
											/>
										</FormFieldShell>
									)
								}}
							</form.Field>

							<form.Field name='sku'>
								{field => (
									<FormFieldShell label='SKU' htmlFor='product-sku'>
										<input
											id='product-sku'
											value={field.state.value}
											onChange={event => {
												markDirty()
												field.handleChange(event.target.value)
											}}
											onBlur={field.handleBlur}
											placeholder='Артикул'
											className={INPUT_CLS}
										/>
									</FormFieldShell>
								)}
							</form.Field>

							<form.Field name='categoryId'>
								{field => (
									<FormFieldShell label='Категория' htmlFor='product-category'>
										<select
											id='product-category'
											value={field.state.value}
											onChange={event => {
												markDirty()
												field.handleChange(event.target.value)
											}}
											onBlur={field.handleBlur}
											className={INPUT_CLS}
										>
											<option value=''>Без категории</option>
											{categories?.map((category: CategoryOption) => (
												<option key={category.id} value={category.id}>
													{category.name}
												</option>
											))}
										</select>
									</FormFieldShell>
								)}
							</form.Field>

							<form.Field name='brand'>
								{field => (
									<FormFieldShell label='Бренд' htmlFor='product-brand'>
										<input
											id='product-brand'
											value={field.state.value}
											onChange={event => {
												markDirty()
												field.handleChange(event.target.value)
											}}
											onBlur={field.handleBlur}
											placeholder='Бренд'
											className={INPUT_CLS}
										/>
									</FormFieldShell>
								)}
							</form.Field>

							<form.Field name='brandCountry'>
								{field => (
									<FormFieldShell
										label='Страна'
										htmlFor='product-brand-country'
									>
										<input
											id='product-brand-country'
											value={field.state.value}
											onChange={event => {
												markDirty()
												field.handleChange(event.target.value)
											}}
											onBlur={field.handleBlur}
											placeholder='Страна бренда'
											className={INPUT_CLS}
										/>
									</FormFieldShell>
								)}
							</form.Field>
						</div>
					</div>

					<FormSection
						title='Характеристики'
						description='Свойства товара теперь редактируются прямо в форме и уходят на сервер в payload `properties`.'
					>
						<form.Field
							name='properties'
							mode='array'
							validators={{
								onChange: ({ value }) =>
									getPropertiesError(value, allProperties),
								onSubmit: ({ value }) =>
									getPropertiesError(value, allProperties),
							}}
						>
							{field => {
								const error = getFieldError(field)
								return (
									<div className='space-y-4'>
										<div className='flex items-center justify-between gap-3'>
											<p className='text-sm text-muted-foreground'>
												Выберите свойство и одно из заранее созданных значений.
											</p>
											<Button
												type='button'
												variant='outline'
												disabled={!canAddMoreProperties}
												onClick={() => {
													markDirty()
													field.pushValue({
														propertyId: '',
														propertyValueId: '',
													})
												}}
											>
												<Plus className='mr-1 h-4 w-4' /> Добавить
											</Button>
										</div>

										{!canAddMoreProperties ? (
											<p className='text-xs text-muted-foreground'>
												Все доступные свойства уже добавлены.
											</p>
										) : null}

										{error ? (
											<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
												{error}
											</div>
										) : null}

										{field.state.value.length === 0 ? (
											<div className='rounded-xl border border-dashed border-border bg-background/60 px-4 py-5 text-sm text-muted-foreground'>
												Нет характеристик. Добавить первую.
											</div>
										) : (
											<div className='space-y-3'>
												{field.state.value.map((row, index) => {
													const property = allProperties?.find(
														(item: PropertyOption) =>
															item.id === row.propertyId,
													)

													return (
														<div
															key={`${row.propertyId}-${row.propertyValueId}-${index}`}
															className={[
																'grid gap-3 rounded-xl border bg-background/60 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]',
																error
																	? 'border-destructive/40'
																	: 'border-border/70',
															].join(' ')}
														>
															<FormFieldShell
																label='Свойство'
																htmlFor={`product-property-${index}`}
															>
																<select
																	id={`product-property-${index}`}
																	value={row.propertyId}
																	onChange={event => {
																		markDirty()
																		form.setFieldValue(
																			`properties[${index}].propertyId`,
																			event.target.value,
																		)
																		form.setFieldValue(
																			`properties[${index}].propertyValueId`,
																			'',
																		)
																	}}
																	onBlur={field.handleBlur}
																	className={getInputClassName(error)}
																>
																	<option value=''>Выберите...</option>
																	{allProperties?.map(
																		(item: PropertyOption) => (
																			<option
																				key={item.id}
																				value={item.id}
																				disabled={
																					usedPropertyIds.has(item.id) &&
																					item.id !== row.propertyId
																				}
																			>
																				{item.name}
																			</option>
																		),
																	)}
																</select>
															</FormFieldShell>

															<FormFieldShell
																label='Значение'
																htmlFor={`product-property-value-${index}`}
															>
																<select
																	id={`product-property-value-${index}`}
																	value={row.propertyValueId}
																	onChange={event => {
																		markDirty()
																		form.setFieldValue(
																			`properties[${index}].propertyValueId`,
																			event.target.value,
																		)
																	}}
																	disabled={!row.propertyId}
																	onBlur={field.handleBlur}
																	className={getInputClassName(error)}
																>
																	<option value=''>Выберите значение...</option>
																	{(property?.values ?? []).map(value => (
																		<option key={value.id} value={value.id}>
																			{value.value}
																		</option>
																	))}
																</select>
															</FormFieldShell>

															<div className='flex items-end'>
																<Button
																	type='button'
																	variant='ghost'
																	onClick={() => {
																		markDirty()
																		field.removeValue(index)
																	}}
																>
																	Удалить
																</Button>
															</div>
														</div>
													)
												})}
											</div>
										)}
									</div>
								)
							}}
						</form.Field>
					</FormSection>

					<div className='flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-end sm:justify-between'>
						<div className='w-full sm:max-w-[180px]'>
							<form.Field
								name='stock'
								validators={{
									onBlur: ({ value }) => {
										if (!value.trim()) return undefined
										const parsed = Number.parseInt(value, 10)
										if (!Number.isFinite(parsed) || parsed < 0) {
											return 'Остаток должен быть неотрицательным целым числом.'
										}
										return undefined
									},
								}}
							>
								{field => {
									const error = getFieldError(field)
									return (
										<FormFieldShell
											label='Остаток'
											htmlFor='product-stock'
											error={error}
										>
											<input
												id='product-stock'
												type='number'
												value={field.state.value}
												onChange={event => {
													markDirty()
													field.handleChange(event.target.value)
												}}
												onBlur={field.handleBlur}
												placeholder='0'
												aria-invalid={Boolean(error)}
												className={getInputClassName(error)}
											/>
										</FormFieldShell>
									)
								}}
							</form.Field>
						</div>
					</div>
				</form>
			</div>
		</AdminModal>
	)
}

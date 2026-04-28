'use client'

import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import type { AnyFieldApi } from '@tanstack/form-core'
import {
	FormCheckbox,
	FormInput,
	FormSection,
	FormTextarea,
	useUnsavedChangesGuard,
} from '@aurasveta/shared-admin'
import { ChevronDown, ChevronUp, Code2 } from 'lucide-react'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import FileUploader from '@/shared/ui/FileUploader'
import AdminModal from '@/shared/ui/AdminModal'
import { Button } from '@/shared/ui/Button'
import { generateSlug } from '@/shared/lib/generateSlug'

type PageDetails = RouterOutputs['pages']['getById']

type PageFormValue = {
	title: string
	slug: string
	content: string
	contentBlocks: string
	seo: string
	metaTitle: string
	metaDesc: string
	isPublished: boolean
	showAsBanner: boolean
	bannerLink: string
	isSystem: boolean
	pendingImageKey: string
	pendingImageOriginalName: string
}

const SLUG_HINT =
	'Латиница, цифры и дефис. Если оставить поле пустым, slug сгенерируется автоматически.'

function getInitialValues(page: PageDetails | null): PageFormValue {
	return {
		title: page?.title ?? '',
		slug: page?.slug ?? '',
		content: page?.content ?? '',
		contentBlocks: JSON.stringify(page?.contentBlocks ?? [], null, 2),
		seo: JSON.stringify(page?.seo ?? {}, null, 2),
		metaTitle: page?.metaTitle ?? '',
		metaDesc: page?.metaDesc ?? '',
		isPublished: page?.isPublished ?? false,
		showAsBanner: page?.showAsBanner ?? false,
		bannerLink: page?.bannerLink ?? '',
		isSystem: page?.isSystem ?? false,
		pendingImageKey: '',
		pendingImageOriginalName: '',
	}
}

function getFieldError(field: Pick<AnyFieldApi, 'state'>) {
	if (!field.state.meta.isTouched) return null
	const firstError = field.state.meta.errors[0]
	return typeof firstError === 'string' ? firstError : null
}

function parseContentBlocks(raw: string) {
	try {
		const parsed = JSON.parse(raw || '[]')
		if (!Array.isArray(parsed)) {
			return {
				value: null,
				error: 'Content blocks должны быть JSON-массивом.',
			}
		}

		return {
			value: parsed as Array<Record<string, unknown>>,
			error: null,
		}
	} catch {
		return {
			value: null,
			error: 'Некорректный JSON в Content blocks.',
		}
	}
}

function parseSeo(raw: string) {
	try {
		const parsed = JSON.parse(raw || '{}')
		if (parsed == null || Array.isArray(parsed) || typeof parsed !== 'object') {
			return {
				value: null,
				error: 'SEO должно быть JSON-объектом.',
			}
		}

		return {
			value: parsed as Record<string, unknown>,
			error: null,
		}
	} catch {
		return {
			value: null,
			error: 'Некорректный JSON в SEO.',
		}
	}
}

function getSubmitError(value: PageFormValue) {
	if (!value.title.trim()) return 'Введите заголовок страницы.'
	if (value.slug.trim() && generateSlug(value.slug) !== value.slug.trim()) {
		return 'Slug должен содержать только латиницу, цифры и дефис.'
	}

	const contentBlocksState = parseContentBlocks(value.contentBlocks)
	if (contentBlocksState.error) return contentBlocksState.error

	const seoState = parseSeo(value.seo)
	if (seoState.error) return seoState.error

	return null
}

function getMutationErrorMessage(error: unknown) {
	if (error instanceof Error && error.message.trim()) {
		return error.message
	}

	return 'Не удалось сохранить страницу. Проверьте поля формы и попробуйте снова.'
}

export default function PageFormModal({
	editId,
	onClose,
	onSuccess,
}: {
	editId: string | null
	onClose: () => void
	onSuccess: () => void | Promise<void>
}) {
	const { data: page, isLoading } = trpc.pages.getById.useQuery(editId!, {
		enabled: Boolean(editId),
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
		<PageFormModalContent
			key={`${editId ?? 'new'}:${page?.id ?? 'blank'}`}
			editId={editId}
			page={page ?? null}
			onClose={onClose}
			onSuccess={onSuccess}
		/>
	)
}

function PageFormModalContent({
	editId,
	page,
	onClose,
	onSuccess,
}: {
	editId: string | null
	page: PageDetails | null
	onClose: () => void
	onSuccess: () => void | Promise<void>
}) {
	const utils = trpc.useUtils()
	const createMut = trpc.pages.create.useMutation()
	const updateMut = trpc.pages.update.useMutation()
	const updateImageMut = trpc.pages.updateImagePath.useMutation()
	const removeImageMut = trpc.pages.removeImage.useMutation()
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [slugTouched, setSlugTouched] = useState(Boolean(page?.slug))
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [existingImagePath, setExistingImagePath] = useState<string | null>(
		page?.imagePath ?? null,
	)
	const [showAdvancedFields, setShowAdvancedFields] = useState(() => {
		const hasBlocks = Array.isArray(page?.contentBlocks)
			? page.contentBlocks.length > 0
			: false
		const hasSeo =
			page?.seo &&
			typeof page.seo === 'object' &&
			!Array.isArray(page.seo) &&
			Object.keys(page.seo).length > 0

		return Boolean(hasBlocks || hasSeo)
	})

	const initialValues = useMemo(() => getInitialValues(page), [page])

	const invalidatePageQueries = async () => {
		await Promise.all([
			utils.pages.getAll.invalidate(),
			utils.pages.getAdminList.invalidate(),
			editId ? utils.pages.getById.invalidate(editId) : Promise.resolve(),
		])
	}

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

			const parsedBlocks = parseContentBlocks(value.contentBlocks)
			const parsedSeo = parseSeo(value.seo)
			if (!parsedBlocks.value || !parsedSeo.value) {
				setSubmitError(
					parsedBlocks.error ??
						parsedSeo.error ??
						'Проверьте технические JSON-поля и повторите попытку.',
				)
				return
			}

			setSubmitError(null)

			const payload = {
				title: value.title.trim(),
				slug: (value.slug.trim() || generateSlug(value.title)).trim(),
				content: value.content || undefined,
				contentBlocks: parsedBlocks.value,
				seo: parsedSeo.value,
				metaTitle: value.metaTitle.trim() || undefined,
				metaDesc: value.metaDesc.trim() || undefined,
				isPublished: value.isPublished,
				showAsBanner: value.showAsBanner,
				bannerLink: value.bannerLink.trim() || undefined,
				isSystem: value.isSystem,
			}

			try {
				if (editId) {
					await updateMut.mutateAsync({ id: editId, ...payload })
				} else {
					const created = await createMut.mutateAsync(payload)
					if (value.pendingImageKey) {
						await updateImageMut.mutateAsync({
							pageId: created.id,
							imagePath: value.pendingImageKey,
							imageOriginalName: value.pendingImageOriginalName || null,
						})
					}
				}

				setHasUnsavedChanges(false)
				await invalidatePageQueries()
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
	const clearDirty = () => {
		setHasUnsavedChanges(false)
		setSubmitError(null)
	}

	const formId = 'page-form-modal'

	return (
		<AdminModal
			isOpen
			onClose={safeClose}
			title={editId ? 'Редактировать страницу' : 'Новая страница'}
			size='lg'
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
				className='space-y-6 p-6'
			>
				{submitError ? (
					<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
						{submitError}
					</div>
				) : null}

				<div className='grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]'>
					<div>
						<FileUploader
							currentImage={
								form.state.values.pendingImageKey || existingImagePath || null
							}
							onUploaded={(key, originalName) => {
								markDirty()
								if (editId) {
									void updateImageMut
										.mutateAsync({
											pageId: editId,
											imagePath: key,
											imageOriginalName: originalName,
										})
										.then(async () => {
											setExistingImagePath(key)
											form.setFieldValue('pendingImageKey', key)
											form.setFieldValue(
												'pendingImageOriginalName',
												originalName,
											)
											clearDirty()
											await invalidatePageQueries()
										})
										.catch(error => {
											setSubmitError(getMutationErrorMessage(error))
										})
									return
								}

								form.setFieldValue('pendingImageKey', key)
								form.setFieldValue('pendingImageOriginalName', originalName)
							}}
							onRemove={() => {
								markDirty()
								if (editId) {
									void removeImageMut
										.mutateAsync(editId)
										.then(async () => {
											setExistingImagePath(null)
											form.setFieldValue('pendingImageKey', '')
											form.setFieldValue('pendingImageOriginalName', '')
											clearDirty()
											await invalidatePageQueries()
										})
										.catch(error => {
											setSubmitError(getMutationErrorMessage(error))
										})
									return
								}

								form.setFieldValue('pendingImageKey', '')
								form.setFieldValue('pendingImageOriginalName', '')
							}}
							isLoading={updateImageMut.isPending || removeImageMut.isPending}
							label='Обложка страницы'
							hideLabel={false}
							aspectRatio='landscape'
						/>
					</div>

					<div className='space-y-4'>
						<form.Field
							name='title'
							validators={{
								onBlur: ({ value }) =>
									value.trim() ? undefined : 'Введите заголовок страницы.',
							}}
						>
							{field => (
								<FormInput
									id='page-title'
									label='Заголовок'
									required
									error={getFieldError(field)}
									value={field.state.value}
									onChange={event => {
										markDirty()
										const title = event.target.value
										field.handleChange(title)
										if (!slugTouched) {
											form.setFieldValue('slug', generateSlug(title))
										}
									}}
									onBlur={field.handleBlur}
									placeholder='Заголовок страницы'
								/>
							)}
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
							{field => (
								<FormInput
									id='page-slug'
									label='Slug'
									required
									error={getFieldError(field)}
									hint={getFieldError(field) ? undefined : SLUG_HINT}
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
									placeholder='page-slug'
									inputClassName='font-mono'
								/>
							)}
						</form.Field>

						<div className='grid gap-4 sm:grid-cols-2'>
							<form.Field name='metaTitle'>
								{field => (
									<FormInput
										id='page-meta-title'
										label='Meta Title'
										value={field.state.value}
										onChange={event => {
											markDirty()
											field.handleChange(event.target.value)
										}}
										onBlur={field.handleBlur}
										placeholder='SEO заголовок'
									/>
								)}
							</form.Field>

							<form.Field name='metaDesc'>
								{field => (
									<FormInput
										id='page-meta-desc'
										label='Meta Description'
										value={field.state.value}
										onChange={event => {
											markDirty()
											field.handleChange(event.target.value)
										}}
										onBlur={field.handleBlur}
										placeholder='SEO описание'
									/>
								)}
							</form.Field>
						</div>
					</div>
				</div>

				<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]'>
					<FormSection
						title='Контент'
						description='Основной HTML/Markdown-контент страницы, который увидит пользователь.'
					>
						<form.Field name='content'>
							{field => (
								<FormTextarea
									id='page-content'
									label='Содержимое'
									value={field.state.value}
									onChange={event => {
										markDirty()
										field.handleChange(event.target.value)
									}}
									onBlur={field.handleBlur}
									rows={14}
									placeholder='<h2>Заголовок</h2>'
									textareaClassName='font-mono text-xs'
								/>
							)}
						</form.Field>
					</FormSection>

					<div className='space-y-4'>
						<FormSection
							title='Публикация'
							description='Управление баннером, публикацией и системным флагом.'
						>
							<div className='space-y-3'>
								<form.Field name='bannerLink'>
									{field => (
										<FormInput
											id='page-banner-link'
											label='Banner link'
											value={field.state.value}
											onChange={event => {
												markDirty()
												field.handleChange(event.target.value)
											}}
											onBlur={field.handleBlur}
											placeholder='/pages/welcome'
										/>
									)}
								</form.Field>

								<form.Field name='isPublished'>
									{field => (
										<FormCheckbox
											variant='card'
											checked={field.state.value}
											onChange={checked => {
												markDirty()
												field.handleChange(checked)
											}}
											onBlur={field.handleBlur}
											label='Опубликовать страницу'
											description='После сохранения страница станет доступна на публичной части сайта.'
										/>
									)}
								</form.Field>

								<form.Field name='showAsBanner'>
									{field => (
										<FormCheckbox
											variant='card'
											checked={field.state.value}
											onChange={checked => {
												markDirty()
												field.handleChange(checked)
											}}
											onBlur={field.handleBlur}
											label='Показывать как баннер'
											description='Подходит для промо-страниц и спецпредложений в верхних секциях.'
										/>
									)}
								</form.Field>

								<form.Field name='isSystem'>
									{field => (
										<FormCheckbox
											variant='card'
											checked={field.state.value}
											onChange={checked => {
												markDirty()
												field.handleChange(checked)
											}}
											onBlur={field.handleBlur}
											label='Системная страница'
											description='Скрывает страницу от случайного удаления и сигнализирует о её инфраструктурной роли.'
										/>
									)}
								</form.Field>
							</div>
						</FormSection>

						<div className='rounded-2xl border border-border/70 bg-muted/10 p-4'>
							<button
								type='button'
								onClick={() => setShowAdvancedFields(value => !value)}
								className='flex w-full items-center justify-between gap-3 text-left'
							>
								<div className='flex items-center gap-2'>
									<Code2 className='h-4 w-4 text-primary' />
									<div>
										<div className='text-sm font-medium text-foreground'>
											Технические поля
										</div>
										<div className='text-xs text-muted-foreground'>
											JSON-редактор для content blocks и SEO-объекта.
										</div>
									</div>
								</div>
								{showAdvancedFields ? (
									<ChevronUp className='h-4 w-4 text-muted-foreground' />
								) : (
									<ChevronDown className='h-4 w-4 text-muted-foreground' />
								)}
							</button>

							{showAdvancedFields ? (
								<div className='mt-4 space-y-4'>
									<form.Field name='contentBlocks'>
										{field => (
											<FormTextarea
												id='page-content-blocks'
												label='Content blocks JSON'
												error={getFieldError(field)}
												hint={
													getFieldError(field)
														? undefined
														: 'Оставьте [] для пустого набора блоков.'
												}
												value={field.state.value}
												onChange={event => {
													markDirty()
													field.handleChange(event.target.value)
												}}
												onBlur={field.handleBlur}
												rows={8}
												textareaClassName='font-mono text-xs'
											/>
										)}
									</form.Field>

									<form.Field name='seo'>
										{field => (
											<FormTextarea
												id='page-seo-json'
												label='SEO JSON'
												error={getFieldError(field)}
												hint={
													getFieldError(field)
														? undefined
														: 'Оставьте {} для пустого SEO-объекта.'
												}
												value={field.state.value}
												onChange={event => {
													markDirty()
													field.handleChange(event.target.value)
												}}
												onBlur={field.handleBlur}
												rows={8}
												textareaClassName='font-mono text-xs'
											/>
										)}
									</form.Field>
								</div>
							) : null}
						</div>
					</div>
				</div>
			</form>
		</AdminModal>
	)
}

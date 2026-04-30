'use client'

import { useMemo, useState } from 'react'
import {
	FormCheckbox,
	FormFieldShell,
	FormInput,
	FormSection,
	FormSelect,
	FormTextarea,
	useUnsavedChangesGuard,
} from '@aurasveta/shared-admin'
import { Plus, Trash2 } from 'lucide-react'
import { getAllSectionDefinitions } from '@/entities/section'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import AdminModal from '@/shared/ui/AdminModal'
import {
	CharacteristicFilterBuilder,
	EntityReferencePicker,
	MediaPicker,
} from '@/shared/ui'
import {
	SectionConfigSchema,
	type SectionConfig,
	type LinkTarget,
	type SectionType,
} from '@/shared/types/sections'
import {
	clonePageSectionDraft,
	type PageSectionDraft,
} from '../model/pageSectionDraft'

interface PageSectionEditorModalProps {
	isOpen: boolean
	value: PageSectionDraft
	onClose: () => void
	onSubmit: (value: PageSectionDraft) => void
	onChangeType: (type: SectionType, section: PageSectionDraft) => PageSectionDraft
}

type ConfigByType<TType extends SectionType> = Extract<
	SectionConfig,
	{ type: TType }
>

type SectionLinkEditorProps = {
	label: string
	value?: LinkTarget
	onChange: (value: LinkTarget | undefined) => void
	pages: Array<{ id: string; title: string; slug: string }>
	categories: Array<{ id: string; name: string; slug: string }>
	products: Array<{ id: string; name: string; slug: string }>
	required?: boolean
}

function cloneLinkTarget(value?: LinkTarget) {
	return value ? (JSON.parse(JSON.stringify(value)) as LinkTarget) : undefined
}

function SectionLinkEditor({
	label,
	value,
	onChange,
	pages,
	categories,
	products,
	required,
}: SectionLinkEditorProps) {
	const kind = value?.kind ?? 'external'

	return (
		<div className='rounded-2xl border border-border/70 bg-muted/10 p-4'>
			<div className='mb-3 flex items-center justify-between'>
				<div className='text-sm font-medium text-foreground'>
					{label}
					{required ? <span className='text-destructive'> *</span> : null}
				</div>
				{!required ? (
					<Button type='button' variant='ghost' size='sm' onClick={() => onChange(undefined)}>
						Очистить
					</Button>
				) : null}
			</div>
			<div className='space-y-3'>
				<FormSelect
					label='Тип ссылки'
					value={kind}
					onChange={event => {
						const nextKind = event.target.value as LinkTarget['kind']
						switch (nextKind) {
							case 'page':
								onChange({ kind: 'page', pageId: pages[0]?.id ?? '' })
								break
							case 'category':
								onChange({ kind: 'category', categoryId: categories[0]?.id ?? '' })
								break
							case 'product':
								onChange({ kind: 'product', productId: products[0]?.id ?? '' })
								break
							default:
								onChange({ kind: 'external', url: '' })
						}
					}}
				>
					<option value='external'>Внешняя ссылка</option>
					<option value='page'>Страница</option>
					<option value='category'>Категория</option>
					<option value='product'>Товар</option>
				</FormSelect>

				{kind === 'page' ? (
					<EntityReferencePicker
						label='Страница'
						value={value?.kind === 'page' ? value.pageId : undefined}
						onChange={next => onChange(next ? { kind: 'page', pageId: next } : undefined)}
						options={pages.map(page => ({ value: page.id, label: page.title, description: `/${page.slug}` }))}
						placeholder='Выберите страницу'
					/>
				) : null}

				{kind === 'category' ? (
					<EntityReferencePicker
						label='Категория'
						value={value?.kind === 'category' ? value.categoryId : undefined}
						onChange={next =>
							onChange(next ? { kind: 'category', categoryId: next } : undefined)
						}
						options={categories.map(category => ({ value: category.id, label: category.name, description: category.slug }))}
						placeholder='Выберите категорию'
					/>
				) : null}

				{kind === 'product' ? (
					<EntityReferencePicker
						label='Товар'
						value={value?.kind === 'product' ? value.productId : undefined}
						onChange={next => onChange(next ? { kind: 'product', productId: next } : undefined)}
						options={products.map(product => ({ value: product.id, label: product.name, description: product.slug }))}
						placeholder='Выберите товар'
					/>
				) : null}

				{kind === 'external' ? (
					<FormInput
						label='URL'
						value={value?.kind === 'external' ? value.url : ''}
						onChange={event => onChange({ kind: 'external', url: event.target.value })}
						placeholder='https://example.com'
					/>
				) : null}
			</div>
		</div>
	)
}

function MultiReferencePicker({
	label,
	selectedIds,
	onChange,
	options,
	placeholder,
}: {
	label: string
	selectedIds: string[]
	onChange: (value: string[]) => void
	options: Array<{ id: string; label: string; description?: string }>
	placeholder: string
}) {
	const [draftId, setDraftId] = useState('')
	const selected = options.filter(option => selectedIds.includes(option.id))

	return (
		<FormFieldShell label={label} hint={placeholder}>
			<div className='space-y-3'>
				<div className='flex gap-2'>
					<select
						value={draftId}
						onChange={event => setDraftId(event.target.value)}
						className='flex h-10 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
					>
						<option value=''>Выберите элемент…</option>
						{options
							.filter(option => !selectedIds.includes(option.id))
							.map(option => (
								<option key={option.id} value={option.id}>
									{option.description
										? `${option.label} — ${option.description}`
										: option.label}
								</option>
							))}
					</select>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						onClick={() => {
							if (!draftId) return
							onChange([...selectedIds, draftId])
							setDraftId('')
						}}
					>
						<Plus className='mr-1 h-4 w-4' /> Добавить
					</Button>
				</div>
				{selected.length > 0 ? (
					<div className='flex flex-wrap gap-2'>
						{selected.map(item => (
							<span
								key={item.id}
								className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground'
							>
								<span>{item.label}</span>
								<button
									type='button'
									onClick={() =>
										onChange(selectedIds.filter(id => id !== item.id))
									}
									className='text-muted-foreground hover:text-destructive'
								>
									<Trash2 className='h-3.5 w-3.5' />
								</button>
							</span>
						))}
					</div>
				) : (
					<div className='rounded-xl border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground'>
						Пока ничего не выбрано.
					</div>
				)}
			</div>
		</FormFieldShell>
	)
}

export default function PageSectionEditorModal({
	isOpen,
	value,
	onClose,
	onSubmit,
	onChangeType,
}: PageSectionEditorModalProps) {
	const [draft, setDraft] = useState(() => clonePageSectionDraft(value))
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const confirmDiscard = useUnsavedChangesGuard(hasUnsavedChanges)
	const definitions = useMemo(() => getAllSectionDefinitions(), [])
	const { data: pages = [] } = trpc.pages.getAll.useQuery()
	const { data: categories = [] } = trpc.categories.getAll.useQuery()
	const { data: products = [] } = trpc.products.getAdminOptions.useQuery({ limit: 300 })

	const safeClose = () => {
		if (confirmDiscard()) onClose()
	}
	const markDirty = () => {
		setHasUnsavedChanges(true)
		setSubmitError(null)
	}

	function updateDraft(mutator: (current: PageSectionDraft) => PageSectionDraft) {
		markDirty()
		setDraft(current => mutator(current))
	}

	function updateTypedConfig<TType extends SectionType>(
		type: TType,
		updater: (config: ConfigByType<TType>) => ConfigByType<TType>,
	) {
		updateDraft(current => {
			if (current.config.type !== type) return current

			return {
				...current,
				config: updater(current.config as ConfigByType<TType>),
			}
		})
	}

	function validateDraft(section: PageSectionDraft): string | null {
		if (section.config.type === 'rich-text' && !section.config.body.trim()) {
			return 'Для rich-text секции заполните текст.'
		}
		if (section.config.type === 'cta-banner') {
			const primary = section.config.primaryCta
			if (!primary) return 'Для CTA banner требуется основная ссылка.'
			if (primary.kind === 'external' && !primary.url.trim()) {
				return 'Заполните URL основной ссылки CTA banner.'
			}
		}
		return null
	}

	const categoryOptions = categories.map(category => ({ id: category.id, label: category.name, description: category.slug }))
	const productOptions = products.map(product => ({ id: product.id, label: product.name, description: product.slug }))
	const heroConfig = draft.config.type === 'hero' ? draft.config : null
	const productGridConfig = draft.config.type === 'product-grid' ? draft.config : null
	const featuredCategoriesConfig = draft.config.type === 'featured-categories' ? draft.config : null
	const richTextConfig = draft.config.type === 'rich-text' ? draft.config : null
	const galleryConfig = draft.config.type === 'gallery' ? draft.config : null
	const benefitsConfig = draft.config.type === 'benefits' ? draft.config : null
	const faqConfig = draft.config.type === 'faq' ? draft.config : null
	const ctaBannerConfig = draft.config.type === 'cta-banner' ? draft.config : null

	return (
		<AdminModal
			isOpen={isOpen}
			onClose={safeClose}
			title='Настройки секции'
			size='xl'
			scrollable
			footer={[
				<Button key='cancel' type='button' variant='ghost' onClick={safeClose}>
					Отмена
				</Button>,
				<Button
					key='save'
					type='button'
					onClick={() => {
								const parsedConfig = SectionConfigSchema.safeParse(draft.config)
								if (!parsedConfig.success || parsedConfig.data.type !== draft.type) {
									setSubmitError('Проверьте конфигурацию секции: одно из обязательных полей заполнено некорректно.')
									return
								}

								const normalized = {
									...draft,
									config: parsedConfig.data,
								}
								const error = validateDraft(normalized)
						if (error) {
							setSubmitError(error)
							return
						}
						setHasUnsavedChanges(false)
						onSubmit(normalized)
					}}
				>
					Сохранить секцию
				</Button>,
			]}
		>
			<div className='space-y-5 p-6'>
				{submitError ? (
					<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
						{submitError}
					</div>
				) : null}

				<div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
					<div className='space-y-4'>
						<FormSelect
							label='Тип секции'
							value={draft.type}
							onChange={event =>
								updateDraft(current =>
									onChangeType(event.target.value as SectionType, current),
								)
							}
						>
							{definitions.map(definition => (
								<option key={definition.type} value={definition.type}>
									{definition.label}
								</option>
							))}
						</FormSelect>

						<FormInput
							label='Заголовок секции'
							value={draft.title}
							onChange={event => updateDraft(current => ({ ...current, title: event.target.value }))}
							placeholder='Можно оставить пустым'
						/>

						<FormInput
							label='Подзаголовок'
							value={draft.subtitle}
							onChange={event => updateDraft(current => ({ ...current, subtitle: event.target.value }))}
							placeholder='Необязательно'
						/>

						<FormInput
							label='Anchor'
							value={draft.anchor}
							onChange={event => updateDraft(current => ({ ...current, anchor: event.target.value }))}
							placeholder='Например: hero-home'
						/>

						<FormCheckbox
							variant='card'
							checked={draft.isActive}
							onChange={checked => updateDraft(current => ({ ...current, isActive: checked }))}
							label='Секция активна'
							description='Неактивные секции сохраняются, но не попадают в публичный рендер.'
						/>
					</div>

					<div className='rounded-2xl border border-border/70 bg-muted/10 p-4'>
						<p className='text-sm font-medium text-foreground'>
							{definitions.find(item => item.type === draft.type)?.label}
						</p>
						<p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
							{definitions.find(item => item.type === draft.type)?.description}
						</p>
					</div>
				</div>

				<FormSection title='Фон секции' description='Пока доступны none / color / gradient.'>
					<div className='grid gap-4 md:grid-cols-3'>
						<FormSelect
							label='Тип фона'
							value={draft.background.type}
							onChange={event => {
								const nextType = event.target.value as PageSectionDraft['background']['type']
								updateDraft(current => ({
									...current,
									background:
										nextType === 'color'
											? { type: 'color', value: '#ffffff' }
											: nextType === 'gradient'
												? { type: 'gradient', value: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)' }
												: { type: 'none' },
								}))
							}}
						>
							<option value='none'>Без фона</option>
							<option value='color'>Цвет</option>
							<option value='gradient'>Градиент</option>
						</FormSelect>
						{draft.background.type === 'color' ? (
							<FormInput
								label='Цвет'
								value={draft.background.value}
								onChange={event =>
									updateDraft(current => ({
										...current,
										background: { type: 'color', value: event.target.value },
									}))
								}
								placeholder='#ffffff'
							/>
						) : null}
						{draft.background.type === 'gradient' ? (
							<div className='md:col-span-2'>
								<FormInput
									label='CSS gradient'
									value={draft.background.value}
									onChange={event =>
										updateDraft(current => ({
											...current,
											background: { type: 'gradient', value: event.target.value },
										}))
									}
									placeholder='linear-gradient(135deg, #fff 0%, #f3f4f6 100%)'
								/>
							</div>
						) : null}
					</div>
				</FormSection>

				{heroConfig ? (
					<FormSection title='Hero content' description='Оффер, бейджи, CTA и главное изображение.'>
						<div className='space-y-4'>
							<FormTextarea
								label='Описание'
								value={heroConfig.description ?? ''}
								onChange={event =>
									updateTypedConfig('hero', config => ({ ...config, description: event.target.value }))
								}
								rows={4}
							/>
							<FormInput
								label='Бейджи через запятую'
								value={heroConfig.badges.join(', ')}
								onChange={event =>
									updateTypedConfig('hero', config => ({
										...config,
										badges: event.target.value
												.split(',')
												.map(item => item.trim())
												.filter(Boolean),
									}))
								}
							/>
							<div className='grid gap-4 lg:grid-cols-2'>
								<SectionLinkEditor
									label='Primary CTA'
									value={cloneLinkTarget(heroConfig.primaryCta)}
									onChange={next =>
										updateTypedConfig('hero', config => ({ ...config, primaryCta: next }))
									}
									pages={pages.map(page => ({ id: page.id, title: page.title, slug: page.slug }))}
									categories={categories.map(category => ({ id: category.id, name: category.name, slug: category.slug }))}
									products={products.map(product => ({ id: product.id, name: product.name, slug: product.slug }))}
								/>
								<SectionLinkEditor
									label='Secondary CTA'
									value={cloneLinkTarget(heroConfig.secondaryCta)}
									onChange={next =>
										updateTypedConfig('hero', config => ({ ...config, secondaryCta: next }))
									}
									pages={pages.map(page => ({ id: page.id, title: page.title, slug: page.slug }))}
									categories={categories.map(category => ({ id: category.id, name: category.name, slug: category.slug }))}
									products={products.map(product => ({ id: product.id, name: product.name, slug: product.slug }))}
								/>
							</div>
							<MediaPicker
								label='Главное изображение hero'
								value={draft.mediaItems[0]?.storageKey ?? null}
								onChange={(storageKey, originalName) =>
									updateDraft(current => ({
										...current,
										mediaItems: storageKey
											? [
												{
													storageKey,
													originalName: originalName ?? null,
														alt: null,
													role: 'hero-media',
												},
											]
											: [],
									}))
								}
							/>
						</div>
					</FormSection>
				) : null}

				{productGridConfig ? (
					<FormSection title='Товары' description='Источник данных, лимит и карточки.'>
						<div className='space-y-4'>
							<div className='grid gap-4 md:grid-cols-2'>
								<FormSelect
									label='Источник'
									value={productGridConfig.source.mode}
									onChange={event => {
										const mode = event.target.value as typeof productGridConfig.source.mode
										updateTypedConfig('product-grid', config => ({
											...config,
											source:
													mode === 'category'
														? { mode: 'category', categoryId: categories[0]?.id ?? '' }
														: mode === 'characteristics'
															? { mode: 'characteristics', filters: [] }
															: mode === 'collection'
																? { mode: 'collection', collection: 'featured' }
																: { mode: 'manual' },
										}))
									}}
								>
									<option value='manual'>Ручной список</option>
									<option value='category'>Категория</option>
									<option value='characteristics'>Фильтры характеристик</option>
									<option value='collection'>Коллекция</option>
								</FormSelect>
								<FormSelect
									label='Сортировка'
									value={productGridConfig.sort}
									onChange={event =>
										updateTypedConfig('product-grid', config => ({ ...config, sort: event.target.value as typeof config.sort }))
									}
								>
									<option value='manual'>Manual</option>
									<option value='newest'>Newest</option>
									<option value='price-asc'>Цена по возрастанию</option>
									<option value='price-desc'>Цена по убыванию</option>
									<option value='popular'>Популярность</option>
								</FormSelect>
							</div>
							<div className='grid gap-4 md:grid-cols-4'>
								<FormInput label='Лимит' type='number' value={String(productGridConfig.limit)} onChange={event => updateTypedConfig('product-grid', config => ({ ...config, limit: Number(event.target.value) || 1 }))} />
								<FormInput label='Колонки mobile' type='number' value={String(productGridConfig.columns.mobile)} onChange={event => updateTypedConfig('product-grid', config => ({ ...config, columns: { ...config.columns, mobile: Number(event.target.value) || 1 } }))} />
								<FormInput label='Колонки tablet' type='number' value={String(productGridConfig.columns.tablet)} onChange={event => updateTypedConfig('product-grid', config => ({ ...config, columns: { ...config.columns, tablet: Number(event.target.value) || 2 } }))} />
								<FormInput label='Колонки desktop' type='number' value={String(productGridConfig.columns.desktop)} onChange={event => updateTypedConfig('product-grid', config => ({ ...config, columns: { ...config.columns, desktop: Number(event.target.value) || 4 } }))} />
							</div>

							{productGridConfig.source.mode === 'manual' ? (
								<MultiReferencePicker label='Товары' selectedIds={draft.manualProductIds} onChange={next => updateDraft(current => ({ ...current, manualProductIds: next }))} options={productOptions} placeholder='Добавьте товары в ручной список.' />
							) : null}
							{productGridConfig.source.mode === 'category' ? (
								<EntityReferencePicker label='Категория-источник' value={productGridConfig.source.categoryId} onChange={next => updateTypedConfig('product-grid', config => ({ ...config, source: { mode: 'category', categoryId: next ?? '' } }))} options={categoryOptions.map(option => ({ value: option.id, label: option.label, description: option.description }))} placeholder='Выберите категорию' />
							) : null}
							{productGridConfig.source.mode === 'characteristics' ? (
								<CharacteristicFilterBuilder value={productGridConfig.source.filters.map(item => ({ propertyId: item.propertyId, valueIds: item.valueIds }))} onChange={next => updateTypedConfig('product-grid', config => ({ ...config, source: { mode: 'characteristics', filters: next.map(filter => ({ ...filter, operator: 'in' as const })) } }))} />
							) : null}
							{productGridConfig.source.mode === 'collection' ? (
								<FormSelect label='Коллекция' value={productGridConfig.source.collection} onChange={event => updateTypedConfig('product-grid', config => ({ ...config, source: { mode: 'collection', collection: event.target.value as 'featured' | 'new' | 'sale' } }))}>
									<option value='featured'>Featured</option>
									<option value='new'>New</option>
									<option value='sale'>Sale</option>
								</FormSelect>
							) : null}
						</div>
					</FormSection>
				) : null}

				{featuredCategoriesConfig ? (
					<FormSection title='Категории' description='Либо ручной список, либо автоматическая подборка.'>
						<div className='space-y-4'>
							<div className='grid gap-4 md:grid-cols-3'>
								<FormSelect label='Источник' value={featuredCategoriesConfig.source.mode} onChange={event => {
									const mode = event.target.value as typeof featuredCategoriesConfig.source.mode
									updateTypedConfig('featured-categories', config => ({
										...config,
										source: mode === 'children-of-category' ? { mode: 'children-of-category', parentCategoryId: categories[0]?.id ?? '' } : mode === 'header-root' ? { mode: 'header-root' } : { mode: 'manual' },
									}))
								}}>
									<option value='manual'>Ручной список</option>
									<option value='children-of-category'>Дети категории</option>
									<option value='header-root'>Header root</option>
								</FormSelect>
								<FormSelect label='Layout' value={featuredCategoriesConfig.layout} onChange={event => updateTypedConfig('featured-categories', config => ({ ...config, layout: event.target.value as typeof config.layout }))}>
									<option value='grid'>Grid</option>
									<option value='carousel'>Carousel</option>
								</FormSelect>
								<FormInput label='Лимит' type='number' value={String(featuredCategoriesConfig.limit)} onChange={event => updateTypedConfig('featured-categories', config => ({ ...config, limit: Number(event.target.value) || 1 }))} />
							</div>
							{featuredCategoriesConfig.source.mode === 'manual' ? (
								<MultiReferencePicker label='Категории' selectedIds={draft.manualCategoryIds} onChange={next => updateDraft(current => ({ ...current, manualCategoryIds: next }))} options={categoryOptions} placeholder='Добавьте категории, которые должны попасть в подборку.' />
							) : null}
							{featuredCategoriesConfig.source.mode === 'children-of-category' ? (
								<EntityReferencePicker label='Родительская категория' value={featuredCategoriesConfig.source.parentCategoryId} onChange={next => updateTypedConfig('featured-categories', config => ({ ...config, source: { mode: 'children-of-category', parentCategoryId: next ?? '' } }))} options={categoryOptions.map(option => ({ value: option.id, label: option.label, description: option.description }))} placeholder='Выберите категорию' />
							) : null}
						</div>
					</FormSection>
				) : null}

				{richTextConfig ? (
					<FormSection title='Текстовый контент' description='Редакционный текст и ограничение ширины.'>
						<div className='space-y-4'>
							<FormTextarea label='Текст' value={richTextConfig.body} onChange={event => updateTypedConfig('rich-text', config => ({ ...config, body: event.target.value }))} rows={10} />
							<FormSelect label='Max width' value={richTextConfig.maxWidth} onChange={event => updateTypedConfig('rich-text', config => ({ ...config, maxWidth: event.target.value as typeof config.maxWidth }))}>
								<option value='sm'>SM</option>
								<option value='md'>MD</option>
								<option value='lg'>LG</option>
								<option value='xl'>XL</option>
								<option value='full'>FULL</option>
							</FormSelect>
						</div>
					</FormSection>
				) : null}

				{galleryConfig ? (
					<FormSection title='Галерея' description='Изображения и параметры сетки.'>
						<div className='space-y-4'>
							<div className='grid gap-4 md:grid-cols-3'>
								<FormSelect label='Layout' value={galleryConfig.layout} onChange={event => updateTypedConfig('gallery', config => ({ ...config, layout: event.target.value as typeof config.layout }))}>
									<option value='grid'>Grid</option>
									<option value='masonry'>Masonry</option>
									<option value='carousel'>Carousel</option>
								</FormSelect>
								<FormSelect label='Aspect ratio' value={galleryConfig.aspectRatio} onChange={event => updateTypedConfig('gallery', config => ({ ...config, aspectRatio: event.target.value as typeof config.aspectRatio }))}>
									<option value='1:1'>1:1</option>
									<option value='4:3'>4:3</option>
									<option value='3:4'>3:4</option>
									<option value='16:9'>16:9</option>
								</FormSelect>
								<FormCheckbox variant='card' checked={galleryConfig.lightbox} onChange={checked => updateTypedConfig('gallery', config => ({ ...config, lightbox: checked }))} label='Lightbox' description='Пока влияет только на конфиг и будущие интеракции.' />
							</div>
							<div className='space-y-3'>
								{draft.mediaItems.map((item, index) => (
									<div key={`${item.storageKey}:${index}`} className='grid gap-4 rounded-2xl border border-border/70 bg-muted/10 p-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]'>
										<MediaPicker label={`Изображение #${index + 1}`} value={item.storageKey} onChange={(storageKey, originalName) => updateDraft(current => ({ ...current, mediaItems: current.mediaItems.map((media, mediaIndex) => mediaIndex === index ? { ...media, storageKey: storageKey ?? '', originalName: originalName ?? null } : media).filter(media => media.storageKey) }))} />
										<div className='space-y-3'>
											<FormInput label='Alt' value={item.alt ?? ''} onChange={event => updateDraft(current => ({ ...current, mediaItems: current.mediaItems.map((media, mediaIndex) => mediaIndex === index ? { ...media, alt: event.target.value } : media) }))} />
											<FormInput label='Role' value={item.role ?? ''} onChange={event => updateDraft(current => ({ ...current, mediaItems: current.mediaItems.map((media, mediaIndex) => mediaIndex === index ? { ...media, role: event.target.value } : media) }))} placeholder='gallery-image' />
										</div>
										<Button type='button' variant='ghost' size='sm' onClick={() => updateDraft(current => ({ ...current, mediaItems: current.mediaItems.filter((_, mediaIndex) => mediaIndex !== index) }))}>
											<Trash2 className='mr-1 h-4 w-4' /> Удалить
										</Button>
									</div>
								))}
								<Button type='button' variant='ghost' size='sm' onClick={() => updateDraft(current => ({ ...current, mediaItems: [...current.mediaItems, { storageKey: '', originalName: null, alt: '', role: 'gallery-image' }] }))}>
									<Plus className='mr-1 h-4 w-4' /> Добавить изображение
								</Button>
							</div>
						</div>
					</FormSection>
				) : null}

				{benefitsConfig ? (
					<FormSection title='Преимущества' description='Карточки value proposition.'>
						<div className='space-y-3'>
							{benefitsConfig.items.map((item, index) => (
								<div key={`${item.title}:${index}`} className='space-y-3 rounded-2xl border border-border/70 bg-muted/10 p-4'>
									<div className='grid gap-4 md:grid-cols-2'>
										<FormInput label='Заголовок' value={item.title} onChange={event => updateTypedConfig('benefits', config => ({ ...config, items: config.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, title: event.target.value } : entry) }))} />
										<FormInput label='Icon URL / token' value={item.icon ?? ''} onChange={event => updateTypedConfig('benefits', config => ({ ...config, items: config.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, icon: event.target.value } : entry) }))} />
									</div>
									<FormTextarea label='Описание' value={item.description ?? ''} onChange={event => updateTypedConfig('benefits', config => ({ ...config, items: config.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, description: event.target.value } : entry) }))} rows={3} />
									<SectionLinkEditor label='Ссылка карточки' value={cloneLinkTarget(item.link)} onChange={next => updateTypedConfig('benefits', config => ({ ...config, items: config.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, link: next } : entry) }))} pages={pages.map(page => ({ id: page.id, title: page.title, slug: page.slug }))} categories={categories.map(category => ({ id: category.id, name: category.name, slug: category.slug }))} products={products.map(product => ({ id: product.id, name: product.name, slug: product.slug }))} />
									<Button type='button' variant='ghost' size='sm' onClick={() => updateTypedConfig('benefits', config => ({ ...config, items: config.items.filter((_, entryIndex) => entryIndex !== index) }))}>
										<Trash2 className='mr-1 h-4 w-4' /> Удалить карточку
									</Button>
								</div>
							))}
							<Button type='button' variant='ghost' size='sm' onClick={() => updateTypedConfig('benefits', config => ({ ...config, items: [...config.items, { title: 'Новое преимущество', description: '', icon: '' }] }))}>
								<Plus className='mr-1 h-4 w-4' /> Добавить карточку
							</Button>
						</div>
					</FormSection>
				) : null}

				{faqConfig ? (
					<FormSection title='FAQ' description='Вопросы и ответы.'>
						<div className='space-y-3'>
							{faqConfig.items.map((item, index) => (
								<div key={`${item.question}:${index}`} className='space-y-3 rounded-2xl border border-border/70 bg-muted/10 p-4'>
									<FormInput label='Вопрос' value={item.question} onChange={event => updateTypedConfig('faq', config => ({ ...config, items: config.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, question: event.target.value } : entry) }))} />
									<FormTextarea label='Ответ' value={item.answer} onChange={event => updateTypedConfig('faq', config => ({ ...config, items: config.items.map((entry, entryIndex) => entryIndex === index ? { ...entry, answer: event.target.value } : entry) }))} rows={4} />
									<Button type='button' variant='ghost' size='sm' onClick={() => updateTypedConfig('faq', config => ({ ...config, items: config.items.filter((_, entryIndex) => entryIndex !== index) }))}>
										<Trash2 className='mr-1 h-4 w-4' /> Удалить пару
									</Button>
								</div>
							))}
							<Button type='button' variant='ghost' size='sm' onClick={() => updateTypedConfig('faq', config => ({ ...config, items: [...config.items, { question: 'Новый вопрос', answer: 'Новый ответ' }] }))}>
								<Plus className='mr-1 h-4 w-4' /> Добавить FAQ
							</Button>
						</div>
					</FormSection>
				) : null}

				{ctaBannerConfig ? (
					<FormSection title='CTA banner' description='Основной призыв к действию.'>
						<div className='space-y-4'>
							<FormTextarea label='Описание' value={ctaBannerConfig.description ?? ''} onChange={event => updateTypedConfig('cta-banner', config => ({ ...config, description: event.target.value }))} rows={3} />
							<FormSelect label='Выравнивание' value={ctaBannerConfig.align} onChange={event => updateTypedConfig('cta-banner', config => ({ ...config, align: event.target.value as typeof config.align }))}>
								<option value='left'>Left</option>
								<option value='center'>Center</option>
							</FormSelect>
							<div className='grid gap-4 lg:grid-cols-2'>
								<SectionLinkEditor label='Основная ссылка' value={cloneLinkTarget(ctaBannerConfig.primaryCta)} onChange={next => updateTypedConfig('cta-banner', config => ({ ...config, primaryCta: next ?? { kind: 'external', url: 'https://example.com' } }))} pages={pages.map(page => ({ id: page.id, title: page.title, slug: page.slug }))} categories={categories.map(category => ({ id: category.id, name: category.name, slug: category.slug }))} products={products.map(product => ({ id: product.id, name: product.name, slug: product.slug }))} required />
								<SectionLinkEditor label='Дополнительная ссылка' value={cloneLinkTarget(ctaBannerConfig.secondaryCta)} onChange={next => updateTypedConfig('cta-banner', config => ({ ...config, secondaryCta: next }))} pages={pages.map(page => ({ id: page.id, title: page.title, slug: page.slug }))} categories={categories.map(category => ({ id: category.id, name: category.name, slug: category.slug }))} products={products.map(product => ({ id: product.id, name: product.name, slug: product.slug }))} />
							</div>
						</div>
					</FormSection>
				) : null}
			</div>
		</AdminModal>
	)
}

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import MultiImageUploader, {
	type ProductImageDraft,
} from '../../components/MultiImageUploader'
import {
	productFormSchema,
	type ProductFormValue,
} from '../product-form.schema'

interface ProductFormModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	product: {
		id: string
		name: string
		slug: string
		description?: string | null
		price?: number | null
		compareAtPrice?: number | null
		stock?: number | null
		sku?: string | null
		rootCategoryId?: string | null
		subcategoryId?: string | null
		brand?: string | null
		brandCountry?: string | null
		isActive?: boolean | null
		metaTitle?: string | null
		metaDesc?: string | null
		images?: Array<{
			id?: string
			url: string
			key: string
			originalName?: string | null
			size?: number | null
			mimeType?: string | null
			order?: number | null
			isMain?: boolean | null
		}>
		properties?: Array<{
			propertyId: string
			propertyValueId: string
		}>
		seo?: {
			title?: string | null
			description?: string | null
			keywords?: string | null
			ogTitle?: string | null
			ogDescription?: string | null
			ogImage?: string | null
			canonicalUrl?: string | null
			noIndex?: boolean | null
		} | null
	} | null
	onSuccess: () => void
}

function defaultFormValues(): ProductFormValue {
	return {
		name: '',
		slug: '',
		description: '',
		price: '',
		compareAtPrice: '',
		stock: '',
		sku: '',
		rootCategoryId: '',
		subcategoryId: '',
		brand: '',
		brandCountry: '',
		isActive: true,
		images: [],
		properties: [],
		seo: {
			title: '',
			description: '',
			keywords: '',
			ogTitle: '',
			ogDescription: '',
			ogImage: '',
			canonicalUrl: '',
			noIndex: false,
		},
	}
}

function productToFormValues(
	product: NonNullable<ProductFormModalProps['product']>,
): ProductFormValue {
	return {
		name: product.name ?? '',
		slug: product.slug ?? '',
		description: product.description ?? '',
		price: String(product.price ?? ''),
		compareAtPrice: String(product.compareAtPrice ?? ''),
		stock: String(product.stock ?? ''),
		sku: product.sku ?? '',
		rootCategoryId: product.rootCategoryId ?? '',
		subcategoryId: product.subcategoryId ?? '',
		brand: product.brand ?? '',
		brandCountry: product.brandCountry ?? '',
		isActive: product.isActive ?? true,
		images: (product.images ?? []).map((img, i) => ({
			id: img.id ?? undefined,
			url: img.url,
			key: img.key,
			originalName: img.originalName ?? null,
			size: img.size ?? null,
			mimeType: img.mimeType ?? null,
			order: img.order ?? i,
			isMain: img.isMain ?? i === 0,
		})),
		properties: (product.properties ?? []).map(p => ({
			propertyId: p.propertyId,
			propertyValueId: p.propertyValueId,
		})),
		seo: {
			title: product.seo?.title ?? product.metaTitle ?? '',
			description: product.seo?.description ?? product.metaDesc ?? '',
			keywords: product.seo?.keywords ?? '',
			ogTitle: product.seo?.ogTitle ?? '',
			ogDescription: product.seo?.ogDescription ?? '',
			ogImage: product.seo?.ogImage ?? '',
			canonicalUrl: product.seo?.canonicalUrl ?? '',
			noIndex: product.seo?.noIndex ?? false,
		},
	}
}

export default function ProductFormModal({
	open,
	onOpenChange,
	product,
	onSuccess,
}: ProductFormModalProps) {
	const isEdit = !!product

	const {
		register,
		watch,
		setValue,
		reset,
		handleSubmit,
		formState: { errors, isSubmitting, isValid },
	} = useForm<ProductFormValue>({
		resolver: zodResolver(productFormSchema),
		mode: 'onChange',
		defaultValues: defaultFormValues(),
	})

	const { data: categories } = trpc.categories.getAll.useQuery()
	const { data: properties } = trpc.properties.getAll.useQuery()

	const createMut = trpc.products.create.useMutation({
		onSuccess: () => {
			toast.success('Товар создан')
			onSuccess()
			onOpenChange(false)
		},
	})
	const updateMut = trpc.products.update.useMutation({
		onSuccess: () => {
			toast.success('Товар обновлён')
			onSuccess()
			onOpenChange(false)
		},
	})

	useEffect(() => {
		if (open) {
			if (product) {
				reset(productToFormValues(product))
			} else {
				reset(defaultFormValues())
			}
		}
	}, [product, open, reset])

	const onSubmit = (values: ProductFormValue) => {
		const payload = {
			name: values.name,
			slug: values.slug || undefined,
			description: values.description || null,
			price: values.price ? Number(values.price) : undefined,
			compareAtPrice: values.compareAtPrice
				? Number(values.compareAtPrice)
				: null,
			stock: values.stock ? Number(values.stock) : 0,
			sku: values.sku || null,
			rootCategoryId: values.rootCategoryId || null,
			subcategoryId: values.subcategoryId || null,
			brand: values.brand || null,
			brandCountry: values.brandCountry || null,
			isActive: values.isActive,
			images: values.images.map(img => ({
				key: img.key,
				url: img.url,
				originalName: img.originalName,
				size: img.size,
				mimeType: img.mimeType,
				order: img.order,
				isMain: img.isMain,
			})),
			properties: values.properties,
			seo: values.seo,
		}

		if (isEdit && product) {
			updateMut.mutate({ id: product.id, ...payload })
		} else {
			createMut.mutate(payload)
		}
	}

	const nameValue = watch('name')
	const priceValue = watch('price')
	const metaTitleValue = watch('seo.title')
	const metaDescValue = watch('seo.description')
	const rootCategoryIdValue = watch('rootCategoryId')

	const rootCategories = (categories ?? []).filter(c => !c.parentId)
	const subcategories = (categories ?? []).filter(
		c => c.parentId === rootCategoryIdValue,
	)

	const priceNum = Number(priceValue) || 0
	const costNum = 0
	const profit = priceNum - costNum
	const margin = priceNum > 0 ? ((profit / priceNum) * 100).toFixed(1) : '0'

	const imagesValue = watch('images')
	const isActiveValue = watch('isActive')
	const propertiesValue = watch('properties')

	const appendPropertyRow = () => {
		setValue('properties', [
			...propertiesValue,
			{ propertyId: '', propertyValueId: '' },
		])
	}

	const removePropertyRow = (index: number) => {
		setValue(
			'properties',
			propertiesValue.filter((_, rowIndex) => rowIndex !== index),
		)
	}

	const changeProperty = (index: number, propertyId: string) => {
		setValue(
			'properties',
			propertiesValue.map((row, rowIndex) =>
				rowIndex === index ? { propertyId, propertyValueId: '' } : row,
			),
		)
	}

	const changePropertyValue = (index: number, propertyValueId: string) => {
		setValue(
			'properties',
			propertiesValue.map((row, rowIndex) =>
				rowIndex === index ? { ...row, propertyValueId } : row,
			),
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-3xl w-full max-h-[70vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-lg font-bold'>
						{isEdit ? 'Редактировать товар' : 'Новый товар'}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<Tabs defaultValue='general'>
						<TabsList className='mb-4'>
							<TabsTrigger value='general'>Основное</TabsTrigger>
							<TabsTrigger value='pricing'>Цены</TabsTrigger>
							<TabsTrigger value='inventory'>Склад</TabsTrigger>
							<TabsTrigger value='properties'>Характеристики</TabsTrigger>
							<TabsTrigger value='images'>Изображения</TabsTrigger>
							<TabsTrigger value='seo'>SEO</TabsTrigger>
						</TabsList>

						<TabsContent value='general' className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Название *</label>
									<Input {...register('name')} />
									{errors.name && (
										<p className='text-xs text-destructive'>
											{errors.name.message}
										</p>
									)}
								</div>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>SKU</label>
									<Input {...register('sku')} />
								</div>
							</div>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Описание</label>
								<textarea
									className='w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-sm min-h-[80px]'
									{...register('description')}
								/>
							</div>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Бренд</label>
									<Input {...register('brand')} />
								</div>
							</div>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>
										Корневая категория *
									</label>
									<Select
										value={rootCategoryIdValue}
										onValueChange={v => {
											setValue('rootCategoryId', v)
											setValue('subcategoryId', '')
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder='Выберите категорию' />
										</SelectTrigger>
										<SelectContent>
											{rootCategories.map(c => (
												<SelectItem key={c.id} value={c.id}>
													{c.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.rootCategoryId && (
										<p className='text-xs text-destructive'>
											{errors.rootCategoryId.message}
										</p>
									)}
								</div>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Подкатегория *</label>
									<Select
										value={watch('subcategoryId')}
										onValueChange={v => setValue('subcategoryId', v)}
										disabled={
											!rootCategoryIdValue || subcategories.length === 0
										}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={
													rootCategoryIdValue
														? 'Выберите подкатегорию'
														: 'Сначала выберите категорию'
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{subcategories.map(c => (
												<SelectItem key={c.id} value={c.id}>
													{c.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.subcategoryId && (
										<p className='text-xs text-destructive'>
											{errors.subcategoryId.message}
										</p>
									)}
								</div>
							</div>
							<div className='flex items-center justify-between py-2'>
								<span className='text-sm font-medium'>Активен</span>
								<Switch
									checked={isActiveValue}
									onCheckedChange={v => setValue('isActive', v)}
								/>
							</div>
						</TabsContent>

						<TabsContent value='pricing' className='space-y-4'>
							<div className='grid grid-cols-3 gap-4'>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Цена продажи *</label>
									<Input type='number' {...register('price')} />
									{errors.price && (
										<p className='text-xs text-destructive'>
											{errors.price.message}
										</p>
									)}
								</div>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Старая цена</label>
									<Input type='number' {...register('compareAtPrice')} />
									{errors.compareAtPrice && (
										<p className='text-xs text-destructive'>
											{errors.compareAtPrice.message}
										</p>
									)}
								</div>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Себестоимость</label>
									<Input type='number' placeholder='—' disabled />
								</div>
							</div>
							<div className='rounded-[var(--radius-md)] bg-secondary p-4'>
								<div className='text-xs font-bold text-muted-foreground uppercase mb-2'>
									Маржинальность
								</div>
								<div className='flex gap-6'>
									<div>
										<div className='text-xs text-muted-foreground'>Прибыль</div>
										<div className='text-lg font-bold text-success'>
											₽ {profit.toLocaleString('ru-RU')}
										</div>
									</div>
									<div>
										<div className='text-xs text-muted-foreground'>Маржа</div>
										<div className='text-lg font-bold text-accent'>
											{margin}%
										</div>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value='inventory' className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Остаток</label>
									<Input type='number' {...register('stock')} />
									{errors.stock && (
										<p className='text-xs text-destructive'>
											{errors.stock.message}
										</p>
									)}
								</div>
								<div className='space-y-2'>
									<label className='text-sm font-medium'>Порог "мало"</label>
									<Input type='number' defaultValue={20} disabled />
								</div>
							</div>
						</TabsContent>

						<TabsContent value='properties' className='space-y-4'>
							<div className='flex items-center justify-between'>
								<div className='text-sm text-muted-foreground'>
									Настройте характеристики товара для каталожной фильтрации
								</div>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={appendPropertyRow}
								>
									<Plus className='mr-1 h-4 w-4' />
									Добавить
								</Button>
							</div>

							{propertiesValue.length === 0 ? (
								<div className='rounded-[var(--radius-md)] border border-dashed border-border p-4 text-sm text-muted-foreground'>
									Характеристики ещё не добавлены
								</div>
							) : (
								<div className='space-y-3'>
									{propertiesValue.map((row, index) => {
										const property = properties?.find(
											p => p.id === row.propertyId,
										)
										const availableValues = property?.values ?? []

										return (
											<div
												key={`${row.propertyId}-${row.propertyValueId}-${index}`}
												className='grid grid-cols-1 gap-3 rounded-[var(--radius-md)] border border-border p-3 md:grid-cols-[1fr_1fr_auto]'
											>
												<div className='space-y-2'>
													<label className='text-sm font-medium'>
														Свойство
													</label>
													<Select
														value={row.propertyId}
														onValueChange={value =>
															changeProperty(index, value)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder='Выберите свойство' />
														</SelectTrigger>
														<SelectContent>
															{(properties ?? []).map(item => (
																<SelectItem key={item.id} value={item.id}>
																	{item.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<div className='space-y-2'>
													<label className='text-sm font-medium'>
														Значение
													</label>
													<Select
														value={row.propertyValueId}
														onValueChange={value =>
															changePropertyValue(index, value)
														}
														disabled={!row.propertyId}
													>
														<SelectTrigger>
															<SelectValue placeholder='Выберите значение' />
														</SelectTrigger>
														<SelectContent>
															{availableValues.map(value => (
																<SelectItem key={value.id} value={value.id}>
																	{value.value}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<div className='flex items-end'>
													<Button
														type='button'
														variant='ghost'
														size='icon'
														onClick={() => removePropertyRow(index)}
														aria-label='Удалить характеристику'
													>
														<Trash2 className='h-4 w-4' />
													</Button>
												</div>
											</div>
										)
									})}
								</div>
							)}

							{errors.properties?.message && (
								<p className='text-xs text-destructive'>
									{errors.properties.message}
								</p>
							)}
						</TabsContent>

						<TabsContent value='images' className='space-y-4'>
							<MultiImageUploader
								images={imagesValue}
								onChange={v => setValue('images', v as ProductImageDraft[])}
							/>
						</TabsContent>

						<TabsContent value='seo' className='space-y-4'>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Meta Title</label>
								<Input {...register('seo.title')} />
								<div className='text-xs text-muted-foreground text-right'>
									{metaTitleValue.length}/60
								</div>
							</div>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Meta Description</label>
								<textarea
									className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]'
									{...register('seo.description')}
								/>
								<div className='text-xs text-muted-foreground text-right'>
									{metaDescValue.length}/160
								</div>
							</div>
							{(() => {
								const titleScore = Math.min(
									metaTitleValue.length >= 10 && metaTitleValue.length <= 60
										? 40
										: metaTitleValue.length > 0
											? 20
											: 0,
									40,
								)
								const descScore = Math.min(
									metaDescValue.length >= 50 && metaDescValue.length <= 160
										? 40
										: metaDescValue.length > 0
											? 20
											: 0,
									40,
								)
								const nameScore = nameValue.length > 0 ? 20 : 0
								const total = titleScore + descScore + nameScore
								const color =
									total >= 80
										? 'bg-success'
										: total >= 50
											? 'bg-warning'
											: 'bg-destructive'
								return (
									<div className='space-y-1.5'>
										<div className='flex items-center justify-between text-xs'>
											<span className='font-medium'>SEO Score</span>
											<span
												className={`font-bold ${
													total >= 80
														? 'text-success'
														: total >= 50
															? 'text-warning'
															: 'text-destructive'
												}`}
											>
												{total}/100
											</span>
										</div>
										<div className='h-2 w-full rounded-full bg-secondary overflow-hidden'>
											<div
												className={`h-full rounded-full transition-all duration-300 ${color}`}
												style={{ width: `${total}%` }}
											/>
										</div>
									</div>
								)
							})()}
						</TabsContent>
					</Tabs>
					<div className='flex justify-end gap-2 mt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={() => onOpenChange(false)}
						>
							Отмена
						</Button>
						<Button
							type='submit'
							disabled={
								!isValid ||
								isSubmitting ||
								createMut.isPending ||
								updateMut.isPending
							}
						>
							Сохранить
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

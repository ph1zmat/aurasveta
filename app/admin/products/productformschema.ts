import { z } from 'zod'
import { SeoFormSchema, type SeoFormValues } from '@/shared/types/seo'

export const productImageDraftSchema = z.object({
	id: z.string().optional(),
	url: z.string(),
	key: z.string(),
	originalName: z.string().nullable().optional(),
	size: z.number().nullable().optional(),
	mimeType: z.string().nullable().optional(),
	order: z.number(),
	isMain: z.boolean(),
})

export const productPropertyDraftSchema = z.object({
	propertyId: z.string(),
	propertyValueId: z.string(),
})

export const productFormSchema = z
	.object({
		name: z.string(),
		slug: z.string(),
		description: z.string(),
		price: z.string(),
		compareAtPrice: z.string(),
		stock: z.string(),
		sku: z.string(),
		rootCategoryId: z.string(),
		subcategoryId: z.string(),
		brand: z.string(),
		brandCountry: z.string(),
		isActive: z.boolean(),
		images: z.array(productImageDraftSchema),
		properties: z.array(productPropertyDraftSchema),
		seo: SeoFormSchema,
	})
	.superRefine((value, ctx) => {
		if (!value.name.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Введите название товара',
				path: ['name'],
			})
		}

		if (!value.rootCategoryId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Выберите корневую категорию',
				path: ['rootCategoryId'],
			})
		}

		if (!value.subcategoryId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Выберите подкатегорию',
				path: ['subcategoryId'],
			})
		}

		if (value.price.trim()) {
			const price = Number(value.price)
			if (!Number.isFinite(price) || price < 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Цена: введите корректное число',
					path: ['price'],
				})
			}
		}

		if (value.compareAtPrice.trim()) {
			const compareAtPrice = Number(value.compareAtPrice)
			if (!Number.isFinite(compareAtPrice) || compareAtPrice < 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Старая цена: введите корректное число',
					path: ['compareAtPrice'],
				})
			}
		}

		if (value.stock.trim()) {
			const stock = Number.parseInt(value.stock, 10)
			if (!Number.isFinite(stock) || stock < 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Остаток должен быть неотрицательным целым числом',
					path: ['stock'],
				})
			}
		}

		const invalidPropertyIndex = value.properties.findIndex(
			property =>
				(property.propertyId && !property.propertyValueId) ||
				(!property.propertyId && property.propertyValueId),
		)

		if (invalidPropertyIndex >= 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					'Заполните свойство и значение полностью или удалите пустую строку',
				path: ['properties', invalidPropertyIndex],
			})
		}
	})

export type ProductFormValue = z.infer<typeof productFormSchema>
export type ProductSeoValue = SeoFormValues
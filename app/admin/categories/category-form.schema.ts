import { z } from 'zod'
import { generateSlug } from '@/shared/lib/generateSlug'
import { SeoFormSchema, type SeoFormValues } from '@/shared/types/seo'

export const CategoryModeSchema = z.enum(['MANUAL', 'FILTER'])
export const CategoryFilterKindSchema = z.enum(['PROPERTY_VALUE', 'SALE'])

export const categoryFormSchema = z
	.object({
		name: z.string(),
		slug: z.string(),
		description: z.string(),
		parentId: z.string(),
		childCategoryIds: z.array(z.string()),
		categoryMode: CategoryModeSchema,
		filterKind: CategoryFilterKindSchema,
		filterPropertyId: z.string(),
		filterPropertyValueId: z.string(),
		showInHeader: z.boolean(),
		pendingImageKey: z.string(),
		pendingImageOriginalName: z.string(),
		seo: SeoFormSchema,
	})
	.superRefine((value, ctx) => {
		if (!value.name.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Введите название категории.',
				path: ['name'],
			})
		}

		if (value.slug.trim() && generateSlug(value.slug) !== value.slug.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Slug должен содержать только латиницу, цифры и дефис.',
				path: ['slug'],
			})
		}

		if (
			value.categoryMode === 'FILTER' &&
			value.filterKind === 'PROPERTY_VALUE'
		) {
			if (!value.filterPropertyId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Выберите свойство для фильтрующей категории.',
					path: ['filterPropertyId'],
				})
			}

			if (!value.filterPropertyValueId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Выберите значение свойства для фильтрующей категории.',
					path: ['filterPropertyValueId'],
				})
			}
		}

		const uniqueChildIds = new Set(value.childCategoryIds.filter(Boolean))
		if (uniqueChildIds.size !== value.childCategoryIds.filter(Boolean).length) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Одна и та же подкатегория не должна быть выбрана дважды.',
				path: ['childCategoryIds'],
			})
		}
	})

export type CategoryFormValue = z.infer<typeof categoryFormSchema>
export type CategorySeoValue = SeoFormValues

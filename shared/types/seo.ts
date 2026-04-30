import { z } from 'zod'

export const SeoTargetTypeSchema = z.enum(['product', 'category', 'page'])
export type SeoTargetType = z.infer<typeof SeoTargetTypeSchema>

const SeoNullableStringSchema = z.string().nullable().optional()

export const SeoFieldsInputSchema = z.object({
	title: SeoNullableStringSchema,
	description: SeoNullableStringSchema,
	keywords: SeoNullableStringSchema,
	ogTitle: SeoNullableStringSchema,
	ogDescription: SeoNullableStringSchema,
	ogImage: SeoNullableStringSchema,
	canonicalUrl: SeoNullableStringSchema,
	noIndex: z.boolean().optional(),
})

export type SeoFieldsInput = z.infer<typeof SeoFieldsInputSchema>

export const SeoMetadataInputSchema = z.object({
	targetType: SeoTargetTypeSchema,
	targetId: z.string(),
	}).extend(SeoFieldsInputSchema.shape)

export type SeoMetadataInput = z.infer<typeof SeoMetadataInputSchema>

export const SeoFormSchema = z.object({
	title: z.string(),
	description: z.string(),
	keywords: z.string(),
	ogTitle: z.string(),
	ogDescription: z.string(),
	ogImage: z.string(),
	canonicalUrl: z.string(),
	noIndex: z.boolean(),
})

export type SeoFormValues = z.infer<typeof SeoFormSchema>

import { z } from 'zod'

export const AdminOrderStatusSchema = z.enum([
	'PENDING',
	'PAID',
	'SHIPPED',
	'DELIVERED',
	'CANCELLED',
])

export type AdminOrderStatus = z.infer<typeof AdminOrderStatusSchema>

export const AdminOrderUpdateInputSchema = z.object({
	id: z.string(),
	status: AdminOrderStatusSchema.optional(),
	phone: z.string().trim().nullable().optional(),
	address: z.string().trim().nullable().optional(),
	comment: z.string().trim().nullable().optional(),
})

export type AdminOrderUpdateInput = z.infer<typeof AdminOrderUpdateInputSchema>
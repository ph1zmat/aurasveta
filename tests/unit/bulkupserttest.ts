import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Проверяем схему bulkUpsert через Zod
const bulkUpsertInputSchema = z.array(
	z.object({
		key: z.string().min(1),
		value: z.unknown(),
		type: z.string().optional(),
		isPublic: z.boolean().optional(),
		group: z.string().optional(),
		description: z.string().optional(),
	})
)

describe('setting.bulkUpsert input schema', () => {
	it('accepts valid array of settings', () => {
		const input = [
			{ key: 'shopName', value: 'Test', type: 'string', isPublic: true, group: 'general' },
			{ key: 'maintenance', value: 'false', type: 'boolean', isPublic: false, group: 'general' },
		]
		const result = bulkUpsertInputSchema.safeParse(input)
		expect(result.success).toBe(true)
	})

	it('rejects empty key', () => {
		const input = [{ key: '', value: 'test' }]
		const result = bulkUpsertInputSchema.safeParse(input)
		expect(result.success).toBe(false)
	})

	it('accepts minimal object with only key and value', () => {
		const input = [{ key: 'foo', value: 'bar' }]
		const result = bulkUpsertInputSchema.safeParse(input)
		expect(result.success).toBe(true)
	})

	it('rejects non-array input', () => {
		const result = bulkUpsertInputSchema.safeParse({ key: 'foo', value: 'bar' })
		expect(result.success).toBe(false)
	})
})

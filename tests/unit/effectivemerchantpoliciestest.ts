import { describe, expect, it, vi } from 'vitest'

const defaultPoliciesMock = vi.hoisted(() => ({
	shippingPolicy: { findFirst: vi.fn() },
	returnPolicy: { findFirst: vi.fn() },
	warrantyPolicy: { findFirst: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
	prisma: defaultPoliciesMock,
}))

import { getEffectiveMerchantPolicies } from '@/lib/merchant-policies/geteffectivemerchantpolicies'

describe('getEffectiveMerchantPolicies', () => {
	it('возвращает override policy, если они активны', async () => {
		const prisma = {
			product: {
				findUnique: vi.fn(async () => ({
					shippingPolicyId: 'ship-override',
					returnPolicyId: 'ret-override',
					warrantyPolicyId: 'war-override',
				})),
			},
			shippingPolicy: {
				findFirst: vi
					.fn()
					.mockResolvedValueOnce({ id: 'ship-override', isActive: true })
					.mockResolvedValueOnce({ id: 'ship-default', isActive: true }),
			},
			returnPolicy: {
				findFirst: vi
					.fn()
					.mockResolvedValueOnce({ id: 'ret-override', isActive: true })
					.mockResolvedValueOnce({ id: 'ret-default', isActive: true }),
			},
			warrantyPolicy: {
				findFirst: vi
					.fn()
					.mockResolvedValueOnce({ id: 'war-override', isActive: true })
					.mockResolvedValueOnce({ id: 'war-default', isActive: true }),
			},
		}

		defaultPoliciesMock.shippingPolicy.findFirst.mockResolvedValue({
			id: 'ship-default',
			isActive: true,
		})
		defaultPoliciesMock.returnPolicy.findFirst.mockResolvedValue({
			id: 'ret-default',
			isActive: true,
		})
		defaultPoliciesMock.warrantyPolicy.findFirst.mockResolvedValue({
			id: 'war-default',
			isActive: true,
		})

		const result = await getEffectiveMerchantPolicies(prisma as never, 'product-1')

		expect(result.shippingPolicy?.id).toBe('ship-override')
		expect(result.returnPolicy?.id).toBe('ret-override')
		expect(result.warrantyPolicy?.id).toBe('war-override')
	})

	it('падает на default, если override отсутствует или неактивен', async () => {
		const prisma = {
			product: {
				findUnique: vi.fn(async () => ({
					shippingPolicyId: null,
					returnPolicyId: 'ret-inactive',
					warrantyPolicyId: null,
				})),
			},
			shippingPolicy: {
				findFirst: vi.fn(async () => ({ id: 'ship-default', isActive: true })),
			},
			returnPolicy: {
				findFirst: vi
					.fn()
					.mockResolvedValueOnce(null)
					.mockResolvedValueOnce({ id: 'ret-default', isActive: true }),
			},
			warrantyPolicy: {
				findFirst: vi.fn(async () => ({ id: 'war-default', isActive: true })),
			},
		}

		defaultPoliciesMock.shippingPolicy.findFirst.mockResolvedValue({
			id: 'ship-default',
			isActive: true,
		})
		defaultPoliciesMock.returnPolicy.findFirst.mockResolvedValue({
			id: 'ret-default',
			isActive: true,
		})
		defaultPoliciesMock.warrantyPolicy.findFirst.mockResolvedValue({
			id: 'war-default',
			isActive: true,
		})

		const result = await getEffectiveMerchantPolicies(prisma as never, 'product-1')

		expect(result.shippingPolicy?.id).toBe('ship-default')
		expect(result.returnPolicy?.id).toBe('ret-default')
		expect(result.warrantyPolicy?.id).toBe('war-default')
	})

	it('возвращает null-набор, если товар не найден', async () => {
		const prisma = {
			product: {
				findUnique: vi.fn(async () => null),
			},
			shippingPolicy: { findFirst: vi.fn() },
			returnPolicy: { findFirst: vi.fn() },
			warrantyPolicy: { findFirst: vi.fn() },
		}

		const result = await getEffectiveMerchantPolicies(prisma as never, 'missing-product')

		expect(result).toEqual({
			shippingPolicy: null,
			returnPolicy: null,
			warrantyPolicy: null,
		})
	})
})

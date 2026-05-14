import type { PrismaClient } from '@prisma/client'

type ShippingPolicyRecord = {
	id: string
	isActive: boolean
	isDefault: boolean
	countryCode: string
	currency: string
	shippingRate: number | null
	minTransitDays: number | null
	maxTransitDays: number | null
	updatedAt: Date
}

type ReturnPolicyRecord = {
	id: string
	isActive: boolean
	isDefault: boolean
	returnPolicyCategory: 'FINITE_WINDOW' | 'NOT_PERMITTED'
	merchantReturnDays: number | null
	returnMethod: 'BY_MAIL' | 'IN_STORE' | 'PICKUP'
	returnFees: 'FREE' | 'BUYER_PAYS' | 'RESTOCKING_FEE'
	updatedAt: Date
}

type WarrantyPolicyRecord = {
	id: string
	isActive: boolean
	isDefault: boolean
	durationMonths: number | null
	warrantyScope: 'LIMITED' | 'FULL' | 'MANUFACTURER'
	updatedAt: Date
}

export type EffectiveMerchantPolicies = {
	shippingPolicy: ShippingPolicyRecord | null
	returnPolicy: ReturnPolicyRecord | null
	warrantyPolicy: WarrantyPolicyRecord | null
}

const activePolicyFilter = {
	isActive: true,
} as const

type PolicyPrismaClient = {
	product: {
		findUnique: PrismaClient['product']['findUnique']
	}
	shippingPolicy: {
		findFirst: PrismaClient['shippingPolicy']['findFirst']
	}
	returnPolicy: {
		findFirst: PrismaClient['returnPolicy']['findFirst']
	}
	warrantyPolicy: {
		findFirst: PrismaClient['warrantyPolicy']['findFirst']
	}
}

export async function getEffectiveMerchantPolicies(
	prisma: PolicyPrismaClient,
	productId: string,
): Promise<EffectiveMerchantPolicies> {
	const policyClient = prisma

	const product = await policyClient.product.findUnique({
		where: { id: productId },
		select: {
			shippingPolicyId: true,
			returnPolicyId: true,
			warrantyPolicyId: true,
		},
	})

	if (!product) {
		return {
			shippingPolicy: null,
			returnPolicy: null,
			warrantyPolicy: null,
		}
	}

	const [shippingOverride, shippingDefault, returnOverride, returnDefault, warrantyOverride, warrantyDefault] = await Promise.all([
		product.shippingPolicyId
			? policyClient.shippingPolicy.findFirst({
				where: { id: product.shippingPolicyId, ...activePolicyFilter },
			})
			: Promise.resolve(null),
		policyClient.shippingPolicy.findFirst({
			where: { isDefault: true, ...activePolicyFilter },
			orderBy: { updatedAt: 'desc' },
		}),
		product.returnPolicyId
			? policyClient.returnPolicy.findFirst({
				where: { id: product.returnPolicyId, ...activePolicyFilter },
			})
			: Promise.resolve(null),
		policyClient.returnPolicy.findFirst({
			where: { isDefault: true, ...activePolicyFilter },
			orderBy: { updatedAt: 'desc' },
		}),
		product.warrantyPolicyId
			? policyClient.warrantyPolicy.findFirst({
				where: { id: product.warrantyPolicyId, ...activePolicyFilter },
			})
			: Promise.resolve(null),
		policyClient.warrantyPolicy.findFirst({
			where: { isDefault: true, ...activePolicyFilter },
			orderBy: { updatedAt: 'desc' },
		}),
	])

	return {
		shippingPolicy: (shippingOverride ?? shippingDefault) as ShippingPolicyRecord | null,
		returnPolicy: (returnOverride ?? returnDefault) as ReturnPolicyRecord | null,
		warrantyPolicy: (warrantyOverride ?? warrantyDefault) as WarrantyPolicyRecord | null,
	}
}

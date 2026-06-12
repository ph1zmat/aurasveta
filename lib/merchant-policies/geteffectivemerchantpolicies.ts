import type { PrismaClient } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

const activePolicyFilter = {
	isActive: true,
} as const

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

async function fetchDefaultMerchantPolicies(
	prisma: Pick<
		PolicyPrismaClient,
		'shippingPolicy' | 'returnPolicy' | 'warrantyPolicy'
	>,
): Promise<{
	shippingPolicy: ShippingPolicyRecord | null
	returnPolicy: ReturnPolicyRecord | null
	warrantyPolicy: WarrantyPolicyRecord | null
}> {
	const [shippingDefault, returnDefault, warrantyDefault] = await Promise.all([
		prisma.shippingPolicy.findFirst({
			where: { isDefault: true, ...activePolicyFilter },
			orderBy: { updatedAt: 'desc' },
		}),
		prisma.returnPolicy.findFirst({
			where: { isDefault: true, ...activePolicyFilter },
			orderBy: { updatedAt: 'desc' },
		}),
		prisma.warrantyPolicy.findFirst({
			where: { isDefault: true, ...activePolicyFilter },
			orderBy: { updatedAt: 'desc' },
		}),
	])

	return {
		shippingPolicy: (shippingDefault as ShippingPolicyRecord | null) ?? null,
		returnPolicy: (returnDefault as ReturnPolicyRecord | null) ?? null,
		warrantyPolicy: (warrantyDefault as WarrantyPolicyRecord | null) ?? null,
	}
}

const getDefaultMerchantPoliciesCached = unstable_cache(
	async () => fetchDefaultMerchantPolicies(prisma),
	['merchant-policies-defaults'],
	{ revalidate: 600 },
)

export async function getEffectiveMerchantPolicies(
	prisma: PolicyPrismaClient,
	productId: string,
): Promise<EffectiveMerchantPolicies> {
	const product = await prisma.product.findUnique({
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

	const [defaults, shippingOverride, returnOverride, warrantyOverride] =
		await Promise.all([
			getDefaultMerchantPoliciesCached(),
			product.shippingPolicyId
				? prisma.shippingPolicy.findFirst({
						where: { id: product.shippingPolicyId, ...activePolicyFilter },
					})
				: Promise.resolve(null),
			product.returnPolicyId
				? prisma.returnPolicy.findFirst({
						where: { id: product.returnPolicyId, ...activePolicyFilter },
					})
				: Promise.resolve(null),
			product.warrantyPolicyId
				? prisma.warrantyPolicy.findFirst({
						where: { id: product.warrantyPolicyId, ...activePolicyFilter },
					})
				: Promise.resolve(null),
		])

	return {
		shippingPolicy:
			(shippingOverride as ShippingPolicyRecord | null) ??
			(defaults.shippingPolicy as ShippingPolicyRecord | null),
		returnPolicy:
			(returnOverride as ReturnPolicyRecord | null) ??
			(defaults.returnPolicy as ReturnPolicyRecord | null),
		warrantyPolicy:
			(warrantyOverride as WarrantyPolicyRecord | null) ??
			(defaults.warrantyPolicy as WarrantyPolicyRecord | null),
	}
}

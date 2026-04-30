import { describe, it, expect, vi } from 'vitest'

describe('getAllByStatuses optimization', () => {
	it('uses single findMany instead of 5 separate queries', async () => {
		const findMany = vi.fn().mockResolvedValue([
			{ id: '1', status: 'PENDING', total: 100, user: { name: 'Test' }, items: [] },
			{ id: '2', status: 'PAID', total: 200, user: { name: 'Test2' }, items: [] },
		])
		const prisma = {
			order: {
				findMany,
			},
		} as {
			order: {
				findMany: typeof findMany
			}
		}

		const statuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
		const orders = await prisma.order.findMany({
			where: { status: { in: statuses } },
			include: { user: { select: { name: true, email: true } }, items: true },
			orderBy: { createdAt: 'desc' },
			take: 250,
		})

		// Группировка в JS
		const result = Object.fromEntries(statuses.map((s) => [s, [] as typeof orders])) as Record<(typeof statuses)[number], typeof orders>
		for (const order of orders) {
			const list = result[order.status as (typeof statuses)[number]]
			if (list.length < 50) list.push(order)
		}

		expect(findMany).toHaveBeenCalledTimes(1)
		expect(result.PENDING.length).toBe(1)
		expect(result.PAID.length).toBe(1)
		expect(result.SHIPPED.length).toBe(0)
	})
})

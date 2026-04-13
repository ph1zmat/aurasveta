import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		throw new Error('DATABASE_URL is not set')
	}
	const url = new URL(connectionString)
	if (!url.searchParams.has('connection_limit')) {
		url.searchParams.set('connection_limit', '20')
	}
	const adapter = new PrismaPg(url.toString())
	return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma
}

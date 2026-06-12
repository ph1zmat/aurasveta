import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		throw new Error('DATABASE_URL is not set')
	}
	const url = new URL(connectionString)
	if (!url.searchParams.has('connection_limit')) {
		const envLimit = process.env.PRISMA_CONNECTION_LIMIT?.trim()
		// Для малых VPS (1 CPU / 2 GB RAM) используем минимальный пул,
		// чтобы не перегружать Neon/PostgreSQL и не тратить память на idle-соединения.
		url.searchParams.set(
			'connection_limit',
			envLimit && /^\d+$/.test(envLimit) ? envLimit : '3',
		)
	}
	const adapter = new PrismaPg(url.toString())
	return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Singleton в любом окружении: предотвращает создание нескольких клиентов
// при hot-reload и снижает расход памяти в production.
globalForPrisma.prisma = prisma

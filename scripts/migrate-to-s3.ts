/**
 * Скрипт миграции изображений с локального диска в объектное хранилище (MinIO / S3).
 *
 * Находит записи в `product_images` с legacy-путями (/productimg/... или /uploads/),
 * загружает файлы в хранилище и обновляет `key`/`url` на стабильные storage-значения.
 *
 * Запуск:
 *   npx tsx --require dotenv/config scripts/migrate-to-s3.ts
 *
 * Убедитесь, что:
 *   1. docker-compose up -d (MinIO запущен)
 *   2. В .env.local заданы STORAGE_* переменные
 *   3. DATABASE_URL указывает на нужную БД
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { readFile, access } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { uploadFile } from '../lib/storage'
import { getStorageFileUrl } from '../shared/lib/storage-file-url'

if (process.env.NODE_ENV === 'production') {
	throw new Error('Migrate script must not run in production!')
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set.')
}

const adapter = new PrismaPg(databaseUrl)
const prisma = new PrismaClient({ adapter })
const PUBLIC_DIR = path.join(process.cwd(), 'public')

const EXT_TO_MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
}

function extToMime(ext: string): string {
	return EXT_TO_MIME[ext.toLowerCase()] ?? 'application/octet-stream'
}

/** Возвращает true, если строка является legacy-путём (локальным), а не S3-ключом */
function isLegacyPath(img: string): boolean {
	return img.startsWith('/productimg/') || img.startsWith('/uploads/')
}

async function migrateProductImages() {
	console.log('🚀 Начало миграции изображений продуктов...\n')

	const images = await prisma.$queryRawUnsafe<
		Array<{
			id: string
			product_name: string
			key: string
			url: string
		}>
	>(
		`
		SELECT
			pi."id",
			p."name" as product_name,
			pi."key",
			pi."url"
		FROM "product_images" pi
		INNER JOIN "products" p ON p."id" = pi."product_id"
		ORDER BY p."name" ASC, pi."order" ASC
		`,
	)

	let totalMigrated = 0
	let totalSkipped = 0
	let totalErrors = 0

	for (const image of images) {
		const legacyPath = isLegacyPath(image.key)
			? image.key
			: isLegacyPath(image.url)
				? image.url
				: null

		if (!legacyPath) continue

		const localPath = path.join(PUBLIC_DIR, legacyPath)

		try {
			await access(localPath)
			const buffer = await readFile(localPath)
			const ext = path.extname(legacyPath)
			const key = `products/${crypto.randomUUID()}${ext}`

			await uploadFile(key, buffer, extToMime(ext))
			await prisma.$executeRawUnsafe(
				`UPDATE "product_images" SET "key" = $1, "url" = $2 WHERE "id" = $3`,
				key,
				getStorageFileUrl(key),
				image.id,
			)

			totalMigrated++
			console.log(`  ✅ "${image.product_name}" → ${legacyPath} → ${key}`)
		} catch {
			console.warn(`  ⚠️  Файл не найден: ${localPath} (оставляем как есть)`)
			totalSkipped++
			totalErrors++
		}
	}

	console.log(`\n─────────────────────────────────────────`)
	console.log(`✅ Загружено:  ${totalMigrated}`)
	console.log(`⚠️  Пропущено: ${totalSkipped}`)
	console.log(`❌ Ошибок:    ${totalErrors}`)
	console.log(`─────────────────────────────────────────`)
}

migrateProductImages()
	.catch(err => {
		console.error('Критическая ошибка:', err)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())

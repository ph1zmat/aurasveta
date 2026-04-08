/**
 * Migration script: converts existing Base64 images to files.
 *
 * Reads all products, categories, and pages that have `image_base64` set,
 * decodes the Base64 data, saves as files in public/productimg/,
 * and updates the DB record with the new `image_path`.
 *
 * Run once after deploying the schema migration:
 *   npx tsx scripts/migrateBase64ToFiles.ts
 */

import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const prisma = new PrismaClient()
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'productimg')

async function ensureDir() {
	await mkdir(UPLOAD_DIR, { recursive: true })
}

function decodeBase64Image(
	dataUri: string,
): { buffer: Buffer; ext: string } | null {
	const match = dataUri.match(/^data:image\/([\w+]+);base64,(.+)$/)
	if (!match) return null

	let ext = match[1]
	if (ext === 'jpeg') ext = 'jpg'
	if (ext === 'svg+xml') ext = 'svg'

	const buffer = Buffer.from(match[2], 'base64')
	return { buffer, ext }
}

async function migrateProducts() {
	// We need to query raw since the field may have been removed from Prisma schema
	const products = await prisma.$queryRaw<
		Array<{ id: string; image_base64: string | null }>
	>`SELECT id, image_base64 FROM products WHERE image_base64 IS NOT NULL AND image_path IS NULL`

	console.log(`Found ${products.length} products with Base64 images`)

	for (const product of products) {
		if (!product.image_base64) continue

		const decoded = decodeBase64Image(product.image_base64)
		if (!decoded) {
			console.warn(`  Skipping product ${product.id}: invalid Base64 format`)
			continue
		}

		const fileName = `${crypto.randomUUID()}-product.${decoded.ext}`
		const filePath = path.join(UPLOAD_DIR, fileName)
		const relativePath = `/productimg/${fileName}`

		await writeFile(filePath, decoded.buffer)

		await prisma.$executeRaw`
			UPDATE products SET image_path = ${relativePath}, image_base64 = NULL
			WHERE id = ${product.id}
		`

		console.log(`  Product ${product.id} -> ${relativePath}`)
	}
}

async function migrateCategories() {
	const categories = await prisma.$queryRaw<
		Array<{ id: string; image_base64: string | null }>
	>`SELECT id, image_base64 FROM categories WHERE image_base64 IS NOT NULL AND image_path IS NULL`

	console.log(`Found ${categories.length} categories with Base64 images`)

	for (const cat of categories) {
		if (!cat.image_base64) continue

		const decoded = decodeBase64Image(cat.image_base64)
		if (!decoded) {
			console.warn(`  Skipping category ${cat.id}: invalid Base64 format`)
			continue
		}

		const fileName = `${crypto.randomUUID()}-category.${decoded.ext}`
		const filePath = path.join(UPLOAD_DIR, fileName)
		const relativePath = `/productimg/${fileName}`

		await writeFile(filePath, decoded.buffer)

		await prisma.$executeRaw`
			UPDATE categories SET image_path = ${relativePath}, image_base64 = NULL
			WHERE id = ${cat.id}
		`

		console.log(`  Category ${cat.id} -> ${relativePath}`)
	}
}

async function migratePages() {
	const pages = await prisma.$queryRaw<
		Array<{ id: string; image_base64: string | null }>
	>`SELECT id, image_base64 FROM pages WHERE image_base64 IS NOT NULL AND image_path IS NULL`

	console.log(`Found ${pages.length} pages with Base64 images`)

	for (const page of pages) {
		if (!page.image_base64) continue

		const decoded = decodeBase64Image(page.image_base64)
		if (!decoded) {
			console.warn(`  Skipping page ${page.id}: invalid Base64 format`)
			continue
		}

		const fileName = `${crypto.randomUUID()}-page.${decoded.ext}`
		const filePath = path.join(UPLOAD_DIR, fileName)
		const relativePath = `/productimg/${fileName}`

		await writeFile(filePath, decoded.buffer)

		await prisma.$executeRaw`
			UPDATE pages SET image_path = ${relativePath}, image_base64 = NULL
			WHERE id = ${page.id}
		`

		console.log(`  Page ${page.id} -> ${relativePath}`)
	}
}

async function main() {
	console.log('=== Base64 -> File migration ===\n')
	await ensureDir()
	await migrateProducts()
	await migrateCategories()
	await migratePages()
	console.log('\n=== Migration complete ===')
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect())

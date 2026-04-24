/**
 * Сервисный слой для работы с объектным хранилищем (MinIO / AWS S3).
 *
 * Конфигурируется через переменные окружения:
 *   STORAGE_ENDPOINT          — URL S3-совместимого хранилища
 *   STORAGE_REGION            — регион (по умолчанию us-east-1)
 *   STORAGE_ACCESS_KEY        — access key
 *   STORAGE_SECRET_KEY        — secret key
 *   STORAGE_BUCKET_NAME       — имя бакета
 *   STORAGE_FORCE_PATH_STYLE  — true для MinIO, false для AWS S3
 *   STORAGE_PRESIGN_TTL       — срок действия presigned URL в секундах (по умолчанию 3600)
 *   STORAGE_PUBLIC_URL        — (опц.) публичный URL/CDN, если задан — presigned-ссылки не используются
 *
 * ВАЖНО: этот модуль содержит серверные секреты — импортировать только в Server Components,
 * API Routes и Server Actions. Никогда не использовать в клиентском коде.
 */

import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Readable } from 'stream'

const STORAGE_MAX_ATTEMPTS = Math.max(
	1,
	parseInt(process.env.STORAGE_MAX_ATTEMPTS ?? '3', 10) || 3,
)

function isRetryableStorageError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false
	const value = error as { name?: string; code?: string; message?: string }
	const name = (value.name ?? '').toLowerCase()
	const code = (value.code ?? '').toLowerCase()
	const message = (value.message ?? '').toLowerCase()

	return (
		name.includes('timeout') ||
		name.includes('throttl') ||
		code.includes('timeout') ||
		code.includes('socket') ||
		code.includes('econnreset') ||
		code.includes('etimedout') ||
		message.includes('timeout') ||
		message.includes('socket') ||
		message.includes('connection reset') ||
		message.includes('temporar')
	)
}

async function withStorageRetry<T>(
	operationName: string,
	fn: () => Promise<T>,
): Promise<T> {
	let attempt = 0
	let lastError: unknown

	while (attempt < STORAGE_MAX_ATTEMPTS) {
		attempt += 1
		try {
			return await fn()
		} catch (error) {
			lastError = error
			const retryable = isRetryableStorageError(error)
			if (!retryable || attempt >= STORAGE_MAX_ATTEMPTS) {
				throw error
			}

			const backoffMs = 150 * 2 ** (attempt - 1)
			console.warn(
				`storage ${operationName} retry ${attempt}/${STORAGE_MAX_ATTEMPTS} in ${backoffMs}ms`,
			)
			await new Promise(resolve => setTimeout(resolve, backoffMs))
		}
	}

	throw lastError
}

// ─── Конфигурация ─────────────────────────────────────────────────────────────

interface StorageConfig {
	endpoint: string
	region: string
	accessKeyId: string
	secretAccessKey: string
	bucket: string
	forcePathStyle: boolean
	publicUrl: string
	presignTtl: number
}

function getConfig(): StorageConfig {
	const endpoint = process.env.STORAGE_ENDPOINT
	const region = process.env.STORAGE_REGION ?? 'us-east-1'
	const accessKeyId = process.env.STORAGE_ACCESS_KEY
	const secretAccessKey = process.env.STORAGE_SECRET_KEY
	const bucket = process.env.STORAGE_BUCKET_NAME
	const forcePathStyle = process.env.STORAGE_FORCE_PATH_STYLE === 'true'
	const publicUrl = process.env.STORAGE_PUBLIC_URL?.replace(/\/$/, '') ?? ''
	const presignTtl = parseInt(process.env.STORAGE_PRESIGN_TTL ?? '3600', 10)

	if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
		throw new Error(
			'Storage misconfigured. Check STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, ' +
				'STORAGE_SECRET_KEY, STORAGE_BUCKET_NAME environment variables.',
		)
	}

	return {
		endpoint,
		region,
		accessKeyId,
		secretAccessKey,
		bucket,
		forcePathStyle,
		publicUrl,
		presignTtl,
	}
}

// ─── Singleton клиент ─────────────────────────────────────────────────────────

let _client: S3Client | null = null

function getClient(): S3Client {
	if (!_client) {
		const { endpoint, region, accessKeyId, secretAccessKey, forcePathStyle } =
			getConfig()
		_client = new S3Client({
			endpoint,
			region,
			credentials: { accessKeyId, secretAccessKey },
			forcePathStyle, // обязательно для MinIO и других path-style хранилищ
		})
	}
	return _client
}

// ─── Публичные функции ────────────────────────────────────────────────────────

/**
 * Загружает файл в хранилище.
 *
 * @param key         — путь внутри бакета, например "products/uuid/photo.jpg"
 * @param body        — Buffer или Readable stream
 * @param contentType — MIME-тип, например "image/jpeg"
 */
export async function uploadFile(
	key: string,
	body: Buffer | Readable,
	contentType = 'application/octet-stream',
): Promise<void> {
	const { bucket } = getConfig()
	await withStorageRetry('putObject', async () => {
		await getClient().send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: body,
				ContentType: contentType,
			}),
		)
	})
}

/**
 * Возвращает URL файла.
 *
 * - Если задан STORAGE_PUBLIC_URL (CDN) — возвращает постоянную прямую ссылку.
 * - Иначе — presigned URL, действительный `expiresIn` (или STORAGE_PRESIGN_TTL) секунд.
 *
 * Presigned URL кешируется на стороне клиента через Cache-Control.
 * Не вызывать для каждого запроса без кеширования при больших списках товаров.
 */
export async function getFileUrl(
	key: string,
	expiresIn?: number,
): Promise<string> {
	const { bucket, publicUrl, presignTtl } = getConfig()

	if (publicUrl) {
		return `${publicUrl}/${key}`
	}

	return withStorageRetry('getSignedUrl', async () => {
		const command = new GetObjectCommand({ Bucket: bucket, Key: key })
		return getSignedUrl(getClient(), command, {
			expiresIn: expiresIn ?? presignTtl,
		})
	})
}

/**
 * Удаляет файл из хранилища.
 * Не бросает ошибку, если файл не существует.
 */
export async function deleteFile(key: string): Promise<void> {
	const { bucket } = getConfig()
	await withStorageRetry('deleteObject', async () => {
		await getClient().send(
			new DeleteObjectCommand({ Bucket: bucket, Key: key }),
		)
	})
}

/**
 * Проверяет существование файла через HEAD-запрос.
 */
export async function fileExists(key: string): Promise<boolean> {
	const { bucket } = getConfig()
	try {
		await withStorageRetry('headObject', async () => {
			await getClient().send(
				new HeadObjectCommand({ Bucket: bucket, Key: key }),
			)
		})
		return true
	} catch {
		return false
	}
}

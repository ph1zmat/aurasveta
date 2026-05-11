/**
 * Конвертирует SVG-файлы внутри `public/` в WebP, сохраняя исходные SVG.
 *
 * Что делает:
 * - рекурсивно ищет `.svg` файлы в указанной папке (по умолчанию `public`)
 * - создаёт рядом `.webp` с тем же basename
 * - НЕ удаляет исходные `.svg`
 * - по умолчанию пропускает уже существующие `.webp`
 *
 * Запуск:
 *   npm run convert:svg-to-webp
 *   npm run convert:svg-to-webp -- public/images
 *   npm run convert:svg-to-webp -- public --force
 *   npm run convert:svg-to-webp -- public --dry-run
 */

import { mkdir, readdir, readFile, access } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

type CliOptions = {
	targetDir: string
	force: boolean
	dryRun: boolean
}

type Counters = {
	found: number
	converted: number
	skipped: number
	errors: number
}

function parseArgs(argv: string[]): CliOptions {
	let targetDir = 'public'
	let force = false
	let dryRun = false

	for (const arg of argv) {
		if (arg === '--force') {
			force = true
			continue
		}

		if (arg === '--dry-run') {
			dryRun = true
			continue
		}

		if (!arg.startsWith('--')) {
			targetDir = arg
		}
	}

	return {
		targetDir: path.resolve(process.cwd(), targetDir),
		force,
		dryRun,
	}
}

async function exists(filePath: string): Promise<boolean> {
	try {
		await access(filePath)
		return true
	} catch {
		return false
	}
}

async function collectSvgFiles(dirPath: string): Promise<string[]> {
	const entries = await readdir(dirPath, { withFileTypes: true })
	const files: string[] = []

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name)

		if (entry.isDirectory()) {
			files.push(...(await collectSvgFiles(fullPath)))
			continue
		}

		if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.svg') {
			files.push(fullPath)
		}
	}

	return files
}

async function convertSvgToWebp(inputPath: string, outputPath: string) {
	const svgBuffer = await readFile(inputPath)

	await mkdir(path.dirname(outputPath), { recursive: true })
	await sharp(svgBuffer, { density: 300 })
		.webp({
			lossless: true,
			effort: 6,
		})
		.toFile(outputPath)
}

async function main() {
	const options = parseArgs(process.argv.slice(2))
	const counters: Counters = {
		found: 0,
		converted: 0,
		skipped: 0,
		errors: 0,
	}

	if (!(await exists(options.targetDir))) {
		throw new Error(`Папка не найдена: ${options.targetDir}`)
	}

	const svgFiles = await collectSvgFiles(options.targetDir)
	counters.found = svgFiles.length

	console.log('🖼️  SVG → WebP converter')
	console.log(`📁 Папка: ${options.targetDir}`)
	console.log(`🔎 Найдено SVG: ${counters.found}`)
	console.log(`⚙️  Режим: ${options.dryRun ? 'dry-run' : 'write'}`)
	console.log(`♻️  Перезапись: ${options.force ? 'включена' : 'выключена'}\n`)

	for (const svgPath of svgFiles) {
		const webpPath = svgPath.replace(/\.svg$/i, '.webp')
		const relativeSvgPath = path.relative(process.cwd(), svgPath)
		const relativeWebpPath = path.relative(process.cwd(), webpPath)

		if (!options.force && (await exists(webpPath))) {
			counters.skipped++
			console.log(`⏭️  Пропуск: ${relativeWebpPath} уже существует`)
			continue
		}

		try {
			if (options.dryRun) {
				counters.converted++
				console.log(`🧪 Dry-run: ${relativeSvgPath} → ${relativeWebpPath}`)
				continue
			}

			await convertSvgToWebp(svgPath, webpPath)
			counters.converted++
			console.log(`✅ ${relativeSvgPath} → ${relativeWebpPath}`)
		} catch (error) {
			counters.errors++
			const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
			console.error(`❌ ${relativeSvgPath}: ${message}`)
		}
	}

	console.log('\n─────────────────────────────────────────')
	console.log(`Найдено:    ${counters.found}`)
	console.log(`Обработано: ${counters.converted}`)
	console.log(`Пропущено:  ${counters.skipped}`)
	console.log(`Ошибок:     ${counters.errors}`)
	console.log('─────────────────────────────────────────')

	if (counters.errors > 0) {
		process.exitCode = 1
	}
}

main().catch(error => {
	console.error('Критическая ошибка:', error)
	process.exit(1)
})

import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['app', 'entities', 'features', 'lib', 'shared', 'widgets', 'packages']

const INCLUDED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const EXCLUDED_DIRS = new Set(['node_modules'])

const rules: Array<{ name: string; pattern: RegExp }> = [
	{
		name: 'Запрещённый fallback-секрет',
		pattern: /fallback-secret/i,
	},
]

type Violation = {
	filePath: string
	ruleName: string
	line: number
	excerpt: string
}

async function walk(dirPath: string): Promise<string[]> {
	const entries = await fs.readdir(dirPath, { withFileTypes: true })
	const files: string[] = []

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name)
		if (entry.isDirectory()) {
			if (EXCLUDED_DIRS.has(entry.name)) continue
			files.push(...(await walk(fullPath)))
			continue
		}

		if (!entry.isFile()) continue
		const ext = path.extname(entry.name)
		if (!INCLUDED_EXTENSIONS.has(ext)) continue
		files.push(fullPath)
	}

	return files
}

function toRelative(filePath: string): string {
	return path.relative(ROOT, filePath).replace(/\\/g, '/')
}

async function main() {
	const allFiles = (
		await Promise.all(
			SCAN_DIRS.map(async dir => {
				const abs = path.join(ROOT, dir)
				try {
					const stat = await fs.stat(abs)
					if (!stat.isDirectory()) return []
					return walk(abs)
				} catch {
					return []
				}
			}),
		)
	).flat()
	const violations: Violation[] = []

	for (const filePath of allFiles) {
		const rel = toRelative(filePath)
		const content = await fs.readFile(filePath, 'utf8')
		const lines = content.split(/\r?\n/)

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]
			for (const rule of rules) {
				if (!rule.pattern.test(line)) continue
				violations.push({
					filePath: rel,
					ruleName: rule.name,
					line: i + 1,
					excerpt: line.trim(),
				})
			}
		}
	}

	if (violations.length > 0) {
		console.error('❌ Guardrails check failed:')
		for (const violation of violations) {
			console.error(
				`- ${violation.filePath}:${violation.line} [${violation.ruleName}] ${violation.excerpt}`,
			)
		}
		process.exit(1)
	}

	console.log('✅ Guardrails check passed')
}

main().catch(error => {
	console.error('❌ Guardrails check crashed:', error)
	process.exit(1)
})

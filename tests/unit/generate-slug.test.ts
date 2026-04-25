import { describe, it, expect } from 'vitest'
import { generateSlug, ensureUniqueSlug } from '@/shared/lib/generateSlug'

// ────────────────────────────────────────────────────────────────
// generateSlug – transliteration & normalization
// ────────────────────────────────────────────────────────────────
describe('generateSlug – basic', () => {
	it('lowercases ASCII text', () => {
		expect(generateSlug('Hello World')).toBe('hello-world')
	})

	it('replaces spaces with hyphens', () => {
		expect(generateSlug('hello world')).toBe('hello-world')
	})

	it('collapses multiple spaces/hyphens into one hyphen', () => {
		expect(generateSlug('hello  ---  world')).toBe('hello-world')
	})

	it('strips leading and trailing hyphens', () => {
		expect(generateSlug('-hello-')).toBe('hello')
	})

	it('removes special characters', () => {
		expect(generateSlug('price: $100!')).toBe('price-100')
	})

	it('truncates at 100 characters', () => {
		const long = 'a'.repeat(200)
		expect(generateSlug(long)).toHaveLength(100)
	})

	it('handles empty string', () => {
		expect(generateSlug('')).toBe('')
	})
})

describe('generateSlug – Cyrillic transliteration', () => {
	it('transliterates common Russian words', () => {
		expect(generateSlug('люстра')).toBe('lyustra')
	})

	it('transliterates mixed Russian + spaces', () => {
		expect(generateSlug('Люстра потолочная')).toBe('lyustra-potolochnaya')
	})

	it('transliterates ё → e', () => {
		expect(generateSlug('ёлка')).toBe('elka')
	})

	it('transliterates щ → sch', () => {
		expect(generateSlug('щётка')).toBe('schetka')
	})

	it('transliterates ж → zh', () => {
		expect(generateSlug('жираф')).toBe('zhiraf')
	})

	it('transliterates ш → sh', () => {
		expect(generateSlug('шар')).toBe('shar')
	})

	it('transliterates ч → ch', () => {
		expect(generateSlug('чайник')).toBe('chaynik')
	})

	it('transliterates ц → ts', () => {
		expect(generateSlug('цвет')).toBe('tsvet')
	})

	it('strips ъ and ь soft/hard signs', () => {
		expect(generateSlug('объект')).toBe('obekt')
		expect(generateSlug('соль')).toBe('sol')
	})

	it('handles mixed Cyrillic and Latin', () => {
		const slug = generateSlug('LED люстра')
		expect(slug).toBe('led-lyustra')
	})

	it('transliterates digits remain as-is', () => {
		expect(generateSlug('люстра 100вт')).toBe('lyustra-100vt')
	})
})

// ────────────────────────────────────────────────────────────────
// ensureUniqueSlug
// ────────────────────────────────────────────────────────────────
describe('ensureUniqueSlug', () => {
	it('returns base slug when it is unique', async () => {
		const existsCheck = async () => false
		const result = await ensureUniqueSlug('Люстра', existsCheck)
		expect(result).toBe('lyustra')
	})

	it('appends -1 when base slug is taken', async () => {
		const taken = new Set(['lyustra'])
		const existsCheck = async (slug: string) => taken.has(slug)
		const result = await ensureUniqueSlug('Люстра', existsCheck)
		expect(result).toBe('lyustra-1')
	})

	it('increments suffix until a free slot is found', async () => {
		const taken = new Set(['lyustra', 'lyustra-1', 'lyustra-2'])
		const existsCheck = async (slug: string) => taken.has(slug)
		const result = await ensureUniqueSlug('Люстра', existsCheck)
		expect(result).toBe('lyustra-3')
	})

	it('calls generateSlug on the base text', async () => {
		const existsCheck = async () => false
		const result = await ensureUniqueSlug('Hello World', existsCheck)
		expect(result).toBe('hello-world')
	})
})

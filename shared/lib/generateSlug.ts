const cyrillicToLatin: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'g',
	д: 'd',
	е: 'e',
	ё: 'e',
	ж: 'zh',
	з: 'z',
	и: 'i',
	й: 'y',
	к: 'k',
	л: 'l',
	м: 'm',
	н: 'n',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	у: 'u',
	ф: 'f',
	х: 'kh',
	ц: 'ts',
	ч: 'ch',
	ш: 'sh',
	щ: 'sch',
	ъ: '',
	ы: 'y',
	ь: '',
	э: 'e',
	ю: 'yu',
	я: 'ya',
}

/**
 * Transliterate a string from Cyrillic to Latin and produce a URL-safe slug.
 * - Lowercases text
 * - Replaces Cyrillic → Latin
 * - Replaces spaces and invalid characters with hyphens
 * - Removes duplicate hyphens
 * - Trims leading/trailing hyphens
 * - Truncates to 100 characters
 */
export function generateSlug(text: string): string {
	return text
		.toLowerCase()
		.split('')
		.map(char => cyrillicToLatin[char] ?? char)
		.join('')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/-{2,}/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 100)
}

/**
 * Ensure the generated slug is unique in a table by appending a numeric suffix.
 * `existsCheck` should return `true` if the slug is already taken.
 */
export async function ensureUniqueSlug(
	base: string,
	existsCheck: (slug: string) => Promise<boolean>,
): Promise<string> {
	let slug = generateSlug(base)
	let suffix = 0

	while (await existsCheck(slug)) {
		suffix++
		slug = `${generateSlug(base)}-${suffix}`
	}

	return slug
}

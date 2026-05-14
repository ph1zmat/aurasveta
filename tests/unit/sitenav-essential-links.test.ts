import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
	LEGACY_FOOTER_ABOUT_LINKS,
	LEGACY_HEADER_SERVICE_LINKS,
} from '@/shared/config/legacysitenav'

const root = 'c:/webcum/aurasveta'

function read(relPath: string) {
	return readFileSync(path.join(root, relPath), 'utf8')
}

describe('site navigation essential links contract', () => {
	it('legacy fallback содержит ключевые служебные ссылки для SEO/internal linking', () => {
		const allLinks = [
			...LEGACY_HEADER_SERVICE_LINKS,
			...LEGACY_FOOTER_ABOUT_LINKS,
		].map(link => link.href)

		expect(allLinks).toEqual(expect.arrayContaining(['/delivery']))
		expect(allLinks).toEqual(expect.arrayContaining(['/contacts']))
		expect(allLinks).toEqual(expect.arrayContaining(['/returns']))
		expect(allLinks).toEqual(expect.arrayContaining(['/warranty']))
	})

	it('содержит прямой текстовый entrypoint в каталог', () => {
		const mobileBottomNav = read('widgets/navigation/ui/mobilebottomnav.tsx')

		expect(mobileBottomNav).toContain("label: 'Каталог'")
		expect(mobileBottomNav).toContain("href: '/catalog'")
	})
})

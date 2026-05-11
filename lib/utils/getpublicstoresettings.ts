import { prisma } from '@/lib/prisma'

export type PublicStoreSettings = {
	phone: string
	additionalPhone: string | null
	email: string
	address: string
	city: string | null
	workingHours: Record<string, string>
	socialLinks: Array<{ platform: string; url: string }>
	logoUrl: string | null
	faviconUrl: string | null
}

function asStringRecord(value: unknown): Record<string, string> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).filter(
			(entry): entry is [string, string] => typeof entry[1] === 'string',
		),
	)
}

function asSocialLinks(
	value: unknown,
): Array<{ platform: string; url: string }> {
	if (!Array.isArray(value)) return []
	return value.flatMap(item => {
		if (
			item &&
			typeof item === 'object' &&
			'platform' in item &&
			'url' in item &&
			typeof item.platform === 'string' &&
			typeof item.url === 'string' &&
			item.url.trim().length > 0
		) {
			return [{ platform: item.platform, url: item.url }]
		}
		return []
	})
}

/**
 * Читает публичные настройки магазина из БД.
 * Безопасно для RSC — не возвращает чувствительных данных.
 * При отсутствии записи возвращает null.
 */
export async function getPublicStoreSettings(): Promise<PublicStoreSettings | null> {
	try {
		const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } })
		if (!settings) return null

		return {
			phone: settings.phone,
			additionalPhone: settings.additionalPhone,
			email: settings.email,
			address: settings.address,
			city: settings.city,
			workingHours: asStringRecord(settings.workingHours),
			socialLinks: asSocialLinks(settings.socialLinks),
			logoUrl: settings.logoUrl,
			faviconUrl: settings.faviconUrl,
		}
	} catch {
		return null
	}
}

/**
 * Возвращает строку часов работы для текущего дня недели.
 * workingHours — объект вида {"Пн-Пт": "8:00-21:00", "Сб": "10:00-19:00", "Вс": "выходной"}
 */
export function getTodayWorkingHours(
	workingHours: Record<string, string>,
): string | null {
	if (!workingHours || Object.keys(workingHours).length === 0) return null

	const day = new Date().getDay() // 0=вс, 1=пн, ..., 6=сб

	// Ключи диапазонов дней — ищем совпадение
	const dayKeys: Record<number, string[]> = {
		1: ['Пн', 'Пн-Пт', 'Пн–Пт', 'Пн-Сб', 'Пн–Сб'],
		2: ['Вт', 'Пн-Пт', 'Пн–Пт', 'Пн-Сб', 'Пн–Сб'],
		3: ['Ср', 'Пн-Пт', 'Пн–Пт', 'Пн-Сб', 'Пн–Сб'],
		4: ['Чт', 'Пн-Пт', 'Пн–Пт', 'Пн-Сб', 'Пн–Сб'],
		5: ['Пт', 'Пн-Пт', 'Пн–Пт', 'Пн-Сб', 'Пн–Сб'],
		6: ['Сб', 'Пн-Сб', 'Пн–Сб'],
		0: ['Вс'],
	}

	const candidates = dayKeys[day] ?? []
	for (const key of candidates) {
		if (key in workingHours) return workingHours[key]
	}

	// Если точного совпадения нет — вернуть первое значение
	const first = Object.values(workingHours)[0]
	return first ?? null
}

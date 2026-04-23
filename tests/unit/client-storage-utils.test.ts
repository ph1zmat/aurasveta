import { afterEach, describe, expect, it, vi } from 'vitest'
import { addRecentlyViewed, getRecentlyViewedIds } from '@/shared/lib/recentlyViewed'
import { getTrackingSessionId } from '@/shared/lib/trackingSession'

type StorageMap = Record<string, string>

function createLocalStorageMock(seed: StorageMap = {}) {
	const state: StorageMap = { ...seed }
	return {
		getItem: vi.fn((key: string) => (key in state ? state[key] : null)),
		setItem: vi.fn((key: string, value: string) => {
			state[key] = value
		}),
		removeItem: vi.fn((key: string) => {
			delete state[key]
		}),
		clear: vi.fn(() => {
			for (const k of Object.keys(state)) delete state[k]
		}),
		_state: state,
	}
}

afterEach(() => {
	delete (globalThis as { window?: unknown }).window
	delete (globalThis as { localStorage?: unknown }).localStorage
	vi.restoreAllMocks()
})

describe('recentlyViewed utils', () => {
	it('возвращает пустой массив на сервере', () => {
		expect(getRecentlyViewedIds()).toEqual([])
	})

	it('добавляет товар в начало и убирает дубликаты', () => {
		;(globalThis as { window?: unknown }).window = {}
		const ls = createLocalStorageMock({
			recentlyViewed: JSON.stringify(['p1', 'p2', 'p3']),
		})
		;(globalThis as { localStorage?: unknown }).localStorage = ls

		addRecentlyViewed('p2')
		expect(getRecentlyViewedIds()).toEqual(['p2', 'p1', 'p3'])
	})

	it('ограничивает список до 20 элементов', () => {
		;(globalThis as { window?: unknown }).window = {}
		const ids = Array.from({ length: 20 }, (_, i) => `p${i}`)
		const ls = createLocalStorageMock({ recentlyViewed: JSON.stringify(ids) })
		;(globalThis as { localStorage?: unknown }).localStorage = ls

		addRecentlyViewed('p100')
		const result = getRecentlyViewedIds()
		expect(result).toHaveLength(20)
		expect(result[0]).toBe('p100')
	})
})

describe('trackingSession', () => {
	it('возвращает пустую строку на сервере', () => {
		expect(getTrackingSessionId()).toBe('')
	})

	it('создает и сохраняет session id при первом вызове', () => {
		;(globalThis as { window?: unknown }).window = {}
		const ls = createLocalStorageMock()
		;(globalThis as { localStorage?: unknown }).localStorage = ls
		vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-1')

		const id = getTrackingSessionId()
		expect(id).toBe('uuid-1')
		expect(ls.setItem).toHaveBeenCalledWith('aura-tracking-session', 'uuid-1')
	})

	it('переиспользует сохраненный session id', () => {
		;(globalThis as { window?: unknown }).window = {}
		const ls = createLocalStorageMock({ 'aura-tracking-session': 'uuid-existing' })
		;(globalThis as { localStorage?: unknown }).localStorage = ls

		expect(getTrackingSessionId()).toBe('uuid-existing')
	})
})
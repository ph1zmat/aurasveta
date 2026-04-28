import { describe, expect, it } from 'vitest'
import {
	buildSearchParamsUrl,
	mergeSearchParams,
	readBooleanParam,
	readEnumParam,
	readPositiveIntParam,
	readStringParam,
} from '@/packages/shared-admin/src/utils/search-params'

describe('shared admin search params utils', () => {
	it('reads positive int with fallback', () => {
		expect(readPositiveIntParam('3', 1)).toBe(3)
		expect(readPositiveIntParam('0', 2)).toBe(2)
		expect(readPositiveIntParam(undefined, 4)).toBe(4)
	})

	it('reads trimmed strings', () => {
		expect(readStringParam('  demo  ')).toBe('demo')
		expect(readStringParam('', 'fallback')).toBe('fallback')
	})

	it('reads boolean flags from common encodings', () => {
		expect(readBooleanParam('1')).toBe(true)
		expect(readBooleanParam('true')).toBe(true)
		expect(readBooleanParam('0')).toBe(false)
		expect(readBooleanParam('off')).toBe(false)
		expect(readBooleanParam(undefined, true)).toBe(true)
	})

	it('reads enum values safely', () => {
		expect(
			readEnumParam('name', ['name', 'createdAt'] as const, 'createdAt'),
		).toBe('name')
		expect(
			readEnumParam('other', ['name', 'createdAt'] as const, 'createdAt'),
		).toBe('createdAt')
	})

	it('merges and removes search params predictably', () => {
		const params = mergeSearchParams('?page=2&search=lamp&create=1', {
			page: 5,
			search: 'table-lamp',
			create: null,
			inStock: false,
		})

		expect(params.get('page')).toBe('5')
		expect(params.get('search')).toBe('table-lamp')
		expect(params.get('create')).toBeNull()
		expect(params.get('inStock')).toBe('0')
	})

	it('builds same-origin relative urls for admin navigation', () => {
		expect(
			buildSearchParamsUrl('/admin/products', '?page=2&search=lamp', {
				page: 1,
				search: 'table lamp',
				create: true,
			}),
		).toBe('/admin/products?page=1&search=table+lamp&create=1')

		expect(
			buildSearchParamsUrl('/admin/products', '?page=2&search=lamp', {
				page: null,
				search: null,
			}),
		).toBe('/admin/products')
	})
})

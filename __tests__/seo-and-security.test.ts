import { describe, it, expect } from 'vitest'
import { validateWebhookUrl } from '@/shared/lib/validateUrl'
import {
	generateProductSeo,
	generateCategorySeo,
	generatePageSeo,
} from '@/shared/lib/seo/generateSeo'

describe('validateWebhookUrl', () => {
	it('allows valid public URLs', () => {
		expect(validateWebhookUrl('https://example.com/webhook').valid).toBe(true)
		expect(
			validateWebhookUrl('https://hooks.slack.com/services/xxx').valid,
		).toBe(true)
	})

	it('blocks localhost', () => {
		expect(validateWebhookUrl('http://localhost/admin').valid).toBe(false)
	})

	it('blocks private IPs', () => {
		expect(validateWebhookUrl('http://10.0.0.1/admin').valid).toBe(false)
		expect(validateWebhookUrl('http://192.168.1.1/').valid).toBe(false)
		expect(validateWebhookUrl('http://172.16.0.1/').valid).toBe(false)
		expect(validateWebhookUrl('http://127.0.0.1/').valid).toBe(false)
	})

	it('blocks metadata endpoint', () => {
		expect(
			validateWebhookUrl('http://169.254.169.254/latest/meta-data').valid,
		).toBe(false)
	})

	it('blocks non-http protocols', () => {
		expect(validateWebhookUrl('ftp://example.com/file').valid).toBe(false)
		expect(validateWebhookUrl('file:///etc/passwd').valid).toBe(false)
	})
})

describe('generateProductSeo', () => {
	it('generates product SEO with name and price', () => {
		const result = generateProductSeo({
			name: 'Люстра Классика',
			description: 'Красивая люстра',
			price: 150,
		})
		expect(result.title).toContain('Люстра Классика')
		expect(result.description).toContain('150')
		expect(result.ogTitle).toBe('Люстра Классика')
	})

	it('handles product without description', () => {
		const result = generateProductSeo({ name: 'Бра настенное' })
		expect(result.title).toContain('Бра настенное')
		expect(result.description).toBeTruthy()
	})
})

describe('generateCategorySeo', () => {
	it('generates category SEO', () => {
		const result = generateCategorySeo({
			name: 'Люстры',
			description: 'Большой выбор люстр',
		})
		expect(result.title).toContain('Люстры')
	})
})

describe('generatePageSeo', () => {
	it('generates page SEO from title', () => {
		const result = generatePageSeo({
			title: 'О компании',
			content: '<p>Мы — магазин светильников</p>',
		})
		expect(result.title).toContain('О компании')
		expect(result.description).not.toContain('<p>')
	})
})

import { describe, it, expect } from 'vitest'
import Papa from 'papaparse'

describe('CSV import via PapaParse', () => {
	it('parses CSV with commas inside quoted fields', () => {
		const csv = `name,slug,price
"Aura, Premium",aura-premium,1000
"Simple Lamp",simple-lamp,500`
		const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
		expect(result.errors).toHaveLength(0)
		expect(result.data[0].name).toBe('Aura, Premium')
		expect(result.data[0].slug).toBe('aura-premium')
	})

	it('parses CSV with semicolon delimiter', () => {
		const csv = `name;slug;price
"Лампа Aura";lampa-aura;1500`
		const result = Papa.parse<Record<string, string>>(csv, {
			header: true,
			skipEmptyLines: true,
			delimiter: ';',
		})
		expect(result.errors).toHaveLength(0)
		expect(result.data[0].name).toBe('Лампа Aura')
	})

	it('parses CSV with multiline descriptions', () => {
		const csv = `name,description,price
"Complex Lamp","Line one\nLine two",2000`
		const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
		expect(result.errors).toHaveLength(0)
		expect(result.data[0].description).toBe('Line one\nLine two')
	})
})

describe('CSV export via Papa.unparse', () => {
	it('escapes quotes and newlines correctly', () => {
		const rows = [
			{ name: 'Lamp "Aura"', description: 'Line 1\nLine 2', price: 1000 },
		]
		const csv = Papa.unparse(rows, { newline: '\n' })
		expect(csv).toContain('"Lamp ""Aura"""')
		expect(csv).toContain('"Line 1\nLine 2"')
	})

	it('handles commas inside values', () => {
		const rows = [{ name: 'Aura, Premium', price: 1000 }]
		const csv = Papa.unparse(rows, { newline: '\n' })
		const lines = csv.split('\n')
		expect(lines[1]).toBe('"Aura, Premium",1000')
	})
})

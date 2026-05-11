import { Metadata } from 'next'
import SeoDashboard from './seodashboard'

export const metadata: Metadata = {
	title: 'SEO Здоровье',
	description: 'Автоматическое исправление SEO проблем',
}

export default function SeoPage() {
	return <SeoDashboard />
}

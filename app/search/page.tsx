import { Suspense } from 'react'
import type { Metadata } from 'next'
import SearchContent from './SearchContent'

export const metadata: Metadata = {
	title: 'Поиск товаров | Aura Sveta',
	description: 'Поиск по каталогу товаров',
}

export default function SearchPage() {
	return (
		<Suspense>
			<SearchContent />
		</Suspense>
	)
}

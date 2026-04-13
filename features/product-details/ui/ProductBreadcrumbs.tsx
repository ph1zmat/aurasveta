'use client'

import { useSearchParams } from 'next/navigation'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'

export default function ProductBreadcrumbs({
	productName,
	categoryName,
	categoryHref,
}: {
	productName: string
	categoryName: string
	categoryHref?: string
}) {
	const searchParams = useSearchParams()
	const returnTo = searchParams.get('returnTo')
	const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : null

	const catalogHref = safeReturnTo ?? '/catalog'

	return (
		<Breadcrumbs
			items={[
				{ label: 'Главная', href: '/' },
				{ label: 'Каталог', href: catalogHref },
				{ label: categoryName, href: safeReturnTo ? catalogHref : categoryHref },
				{ label: productName },
			]}
		/>
	)
}


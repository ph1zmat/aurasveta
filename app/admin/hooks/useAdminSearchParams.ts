'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
	buildSearchParamsUrl,
	type SearchParamValue,
} from '@aurasveta/shared-admin'

type UpdateSearchParamsOptions = {
	history?: 'replace' | 'push'
}

export function useAdminSearchParams() {
	const pathname = usePathname()
	const router = useRouter()
	const searchParams = useSearchParams()

	const updateSearchParams = useCallback(
		(
			updates: Record<string, SearchParamValue>,
			options: UpdateSearchParamsOptions = {},
		) => {
			const currentUrl = buildSearchParamsUrl(pathname, searchParams, {})
			const nextUrl = buildSearchParamsUrl(pathname, searchParams, updates)

			if (nextUrl === currentUrl) {
				return
			}

			if (options.history === 'push') {
				router.push(nextUrl, { scroll: false })
				return
			}

			router.replace(nextUrl, { scroll: false })
		},
		[pathname, router, searchParams],
	)

	return {
		searchParams,
		updateSearchParams,
	}
}

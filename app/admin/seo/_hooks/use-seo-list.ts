'use client'

import { useState, useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { SeoFilter, SeoTargetType } from '../_lib/constants'

export type SeoEditFields = {
	title?: string | null
	description?: string | null
	keywords?: string | null
	ogTitle?: string | null
	ogDescription?: string | null
	ogImage?: string | null
	canonicalUrl?: string | null
	noIndex?: boolean
}

export type SeoEditState = Record<string, SeoEditFields>

export function useSeoList(typeFilter: SeoTargetType | 'all', filter: SeoFilter, searchQuery: string) {
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [editing, setEditing] = useState<SeoEditState>({})

	const { data: rawList, isLoading, refetch } = trpc.seo.listAll.useQuery(
		typeFilter !== 'all' ? { targetType: typeFilter } : undefined,
	)

	const { mutate: updateSeo } = trpc.seo.update.useMutation({
		onSuccess: () => {
			refetch()
		},
	})

	const filtered = useMemo(() => {
		let items = (rawList ?? []).filter((item) => {
			if (filter === 'missing-title') return !item.title
			if (filter === 'missing-desc') return !item.description
			if (filter === 'noindex') return item.noIndex
			return true
		})

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase()
			items = items.filter(
				(item) =>
					(item.title ?? '').toLowerCase().includes(q) ||
					(item.description ?? '').toLowerCase().includes(q) ||
					item.targetId.toLowerCase().includes(q),
			)
		}

		return items
	}, [rawList, filter, searchQuery])

	const handleEdit = useCallback(<K extends keyof SeoEditFields>(id: string, field: K, value: SeoEditFields[K]) => {
		setEditing((prev) => ({
			...prev,
			[id]: { ...(prev[id] ?? {}), [field]: value },
		}))
	}, [])

	const handleExpand = useCallback((item: (typeof filtered)[number]) => {
		setExpandedId((prev) => {
			const isOpen = prev === item.id
			if (!isOpen) {
				setEditing((edits) => ({
					...edits,
					[item.id]: {
						title: item.title,
						description: item.description,
						keywords: item.keywords,
						ogTitle: item.ogTitle,
						ogDescription: item.ogDescription,
						ogImage: item.ogImage,
						canonicalUrl: item.canonicalUrl,
						noIndex: item.noIndex,
					},
				}))
			}
			return isOpen ? null : item.id
		})
	}, [])

	const handleSave = useCallback(
		(item: (typeof filtered)[number]) => {
			const changes = editing[item.id] ?? {}
			updateSeo({
				targetType: item.targetType as SeoTargetType,
				targetId: item.targetId,
				title: changes.title !== undefined ? changes.title : item.title,
				description: changes.description !== undefined ? changes.description : item.description,
				keywords: changes.keywords !== undefined ? changes.keywords : item.keywords,
				ogTitle: changes.ogTitle !== undefined ? changes.ogTitle : item.ogTitle,
				ogDescription: changes.ogDescription !== undefined ? changes.ogDescription : item.ogDescription,
				ogImage: changes.ogImage !== undefined ? changes.ogImage : item.ogImage,
				canonicalUrl: changes.canonicalUrl !== undefined ? changes.canonicalUrl : item.canonicalUrl,
				noIndex: changes.noIndex !== undefined ? changes.noIndex : item.noIndex,
			})
			setExpandedId(null)
		},
		[editing, updateSeo],
	)

	return {
		items: filtered,
		isLoading,
		refetch,
		expandedId,
		editing,
		handleEdit,
		handleExpand,
		handleSave,
	}
}

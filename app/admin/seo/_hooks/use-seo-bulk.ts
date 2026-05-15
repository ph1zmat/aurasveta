'use client'

import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { SeoTargetType, BulkMode } from '../_lib/constants'
import { BULK_UI_LIMIT } from '../_lib/constants'

export function useSeoBulk() {
	const [targetType, setTargetType] = useState<SeoTargetType>('product')
	const [mode, setMode] = useState<BulkMode>('strict')
	const [onlyMissing, setOnlyMissing] = useState(true)
	const [previewDone, setPreviewDone] = useState(false)
	const [isApplyingAll, setIsApplyingAll] = useState(false)

	const utils = trpc.useUtils()

	const {
		data: previewData,
		isFetching: isPreviewing,
		refetch: runPreview,
	} = trpc.seo.bulkGeneratePreview.useQuery(
		{ targetType, mode, onlyMissing, limit: BULK_UI_LIMIT },
		{ enabled: false },
	)

	const { mutateAsync: applyBulk, isPending: isApplying } = trpc.seo.bulkGenerateApply.useMutation({
		onSuccess: () => {
			void utils.seo.listAll.invalidate()
		},
	})

	const handlePreview = useCallback(async () => {
		await runPreview()
		setPreviewDone(true)
	}, [runPreview])

	const getApplyInput = useCallback(
		(cursor?: string) => ({
			targetType,
			mode,
			onlyMissing,
			limit: BULK_UI_LIMIT,
			...(cursor ? { cursor } : {}),
		}),
		[targetType, mode, onlyMissing],
	)

	const handleApplyCurrentBatch = useCallback(async () => {
		const result = await applyBulk(getApplyInput())
		setPreviewDone(false)
		return result
	}, [applyBulk, getApplyInput])

	const handleApplyAll = useCallback(async () => {
		if (isApplyingAll) return
		setIsApplyingAll(true)
		try {
			let cursor: string | undefined
			let batches = 0
			let applied = 0
			let skipped = 0
			let errors = 0

			do {
				const result = await applyBulk(getApplyInput(cursor))
				batches += 1
				applied += result.applied
				skipped += result.skipped
				errors += result.errors
				cursor = result.nextCursor ?? undefined
			} while (cursor)

			setPreviewDone(false)
			return { batches, applied, skipped, errors }
		} finally {
			setIsApplyingAll(false)
		}
	}, [applyBulk, getApplyInput, isApplyingAll])

	const reset = useCallback(() => {
		setPreviewDone(false)
	}, [])

	return {
		targetType,
		setTargetType,
		mode,
		setMode,
		onlyMissing,
		setOnlyMissing,
		previewDone,
		previewData,
		isPreviewing,
		isApplying,
		isApplyingAll,
		handlePreview,
		handleApplyCurrentBatch,
		handleApplyAll,
		reset,
	}
}

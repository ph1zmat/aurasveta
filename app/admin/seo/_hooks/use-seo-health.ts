'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'

export function useSeoHealth() {
	const [lastResult, setLastResult] = useState<{
		success: boolean
		completedAt: string
		titlesAdded: number
		descriptionsAdded: number
		ogImagesAdded: number
		snippetsApplied: number
		totalApplied: number
		totalProcessed: number
		errors: number
	} | null>(null)
	const [showPreview, setShowPreview] = useState(false)

	const utils = trpc.useUtils()

	const { data: summary, isLoading: isSummaryLoading } = trpc.seo.getSummary.useQuery()
	const { data: history, isLoading: isHistoryLoading } = trpc.seo.getQuickFixHistory.useQuery()
	const { data: previewData, isFetching: isPreviewing, refetch: runPreview } =
		trpc.seo.quickFixPreview.useQuery(undefined, { enabled: false })

	const { mutateAsync: runQuickFix, isPending: isFixing } = trpc.seo.quickFix.useMutation({
		onSuccess: (result) => {
			toast.success(`SEO обновлено: ${result.titlesAdded} title, ${result.descriptionsAdded} description`)
			setLastResult(result)
			setShowPreview(false)
			void utils.seo.getSummary.invalidate()
			void utils.seo.getQuickFixHistory.invalidate()
		},
		onError: (err) => {
			toast.error(err.message ?? 'Не удалось исправить SEO')
		},
	})

	const handlePreview = async () => {
		const result = await runPreview()
		setShowPreview(true)
		if (result.data) {
			toast.info(`Будет обновлено: ${result.data.totalWillBeAffected} записей`)
		}
	}

	const handleFix = async () => {
		await runQuickFix({ mode: 'safe-overwrite' })
	}

	const overallScore = summary?.overallScore ?? 0
	const overallStatus = overallScore >= 90 ? 'good' : overallScore >= 60 ? 'warning' : 'critical'

	return {
		summary,
		isSummaryLoading,
		history,
		isHistoryLoading,
		previewData,
		isPreviewing,
		isFixing,
		showPreview,
		setShowPreview,
		lastResult,
		overallScore,
		overallStatus,
		handlePreview,
		handleFix,
	}
}

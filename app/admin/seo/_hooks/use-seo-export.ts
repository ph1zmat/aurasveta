'use client'

import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import type { SeoTargetType, SeoFilter } from '../_lib/constants'

export function useSeoExport(typeFilter: SeoTargetType | 'all', filter: SeoFilter) {
	const { refetch: exportAuditCsv, isFetching: isExporting } = trpc.seo.exportAuditCsv.useQuery(
		{
			targetType: typeFilter === 'all' ? undefined : typeFilter,
			filter,
		},
		{ enabled: false },
	)

	const handleExportCsv = async () => {
		const result = await exportAuditCsv()
		const csv = result.data?.csv
		if (!csv) {
			toast.error('Не удалось сформировать CSV')
			return
		}

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		const ts = new Date().toISOString().slice(0, 10)
		link.download = `seo-audit-${ts}.csv`
		link.click()
		URL.revokeObjectURL(link.href)
		toast.success(`CSV выгружен (${result.data?.count ?? 0} строк)`)
	}

	return { handleExportCsv, isExporting }
}

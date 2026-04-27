'use client'

import { useState, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'
import {
	Download,
	Upload,
	FileJson,
	FileSpreadsheet,
	CheckCircle2,
	AlertCircle,
	ArrowDownToLine,
	ArrowUpFromLine,
	Package,
} from 'lucide-react'
import Papa from 'papaparse'

export default function ImportExportClient() {
	const { data: stats } = trpc.admin.getStats.useQuery()
	const [importResult, setImportResult] = useState<{
		type: 'success' | 'error'
		text: string
	} | null>(null)
	const [exporting, setExporting] = useState(false)

	const utils = trpc.useUtils()
	const importMut = trpc.admin.importProducts.useMutation({
		onSuccess: data => {
			setImportResult({
				type: 'success',
				text: `Создано ${data.created}, обновлено ${data.updated} (всего ${data.total})`,
			})
		},
		onError: err => {
			setImportResult({ type: 'error', text: err.message })
		},
	})

	const fileRef = useRef<HTMLInputElement>(null)

	async function handleExport(format: 'json' | 'csv') {
		setExporting(true)
		try {
			const result = await utils.admin.exportProducts.fetch(format)
			const blob = new Blob([result.data], {
				type: format === 'json' ? 'application/json' : 'text/csv',
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `products.${format}`
			a.click()
			URL.revokeObjectURL(url)
		} finally {
			setExporting(false)
		}
	}

	function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = event => {
			const text = event.target?.result as string

			if (file.name.endsWith('.json')) {
				try {
					const data = JSON.parse(text)
					importMut.mutate(Array.isArray(data) ? data : [data])
				} catch {
					setImportResult({ type: 'error', text: 'Невалидный JSON' })
				}
			} else if (file.name.endsWith('.csv')) {
				Papa.parse(text, {
					header: true,
					complete: results => {
						const items = (results.data as Record<string, string>[])
							.map(row => ({
								name: row.name || '',
								slug: row.slug || '',
								description: row.description || undefined,
								price: row.price ? parseFloat(row.price) : undefined,
								stock: row.stock ? parseInt(row.stock) : 0,
								sku: row.sku || undefined,
								categorySlug: row.category || undefined,
								brand: row.brand || undefined,
								brandCountry: row.brandCountry || undefined,
								isActive: row.isActive !== 'false',
							}))
							.filter(item => item.name && item.slug)
						importMut.mutate(items)
					},
				})
			} else {
				setImportResult({ type: 'error', text: 'Поддерживаются только .json и .csv' })
			}
		}
		reader.readAsText(file)
		if (fileRef.current) fileRef.current.value = ''
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-3'>
				<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
					<ArrowDownToLine className='h-5 w-5 text-primary' />
				</div>
				<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
					Импорт / Экспорт
				</h1>
			</div>

			<div className='grid gap-5 lg:grid-cols-2'>
				{/* Export card */}
				<div className='rounded-2xl border border-border bg-muted/10 p-6 transition-colors hover:bg-muted/15'>
					<div className='mb-4 flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10'>
							<Download className='h-5 w-5 text-emerald-500' />
						</div>
						<div>
							<h2 className='text-sm font-semibold text-foreground'>
								Экспорт товаров
							</h2>
							<p className='text-xs text-muted-foreground'>
								Скачать все товары в файл
							</p>
						</div>
					</div>

					<div className='mb-5 flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2'>
						<Package className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm text-muted-foreground'>Всего товаров:</span>
						<span className='text-sm font-semibold text-foreground'>
							{stats?.totalProducts ?? 0}
						</span>
					</div>

					<div className='flex gap-3'>
						<button
							onClick={() => void handleExport('json')}
							disabled={exporting}
							className='flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50'
						>
							<FileJson className='h-4 w-4' /> JSON
						</button>
						<button
							onClick={() => void handleExport('csv')}
							disabled={exporting}
							className='flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50'
						>
							<FileSpreadsheet className='h-4 w-4' /> CSV
						</button>
					</div>
				</div>

				{/* Import card */}
				<div className='rounded-2xl border border-border bg-muted/10 p-6 transition-colors hover:bg-muted/15'>
					<div className='mb-4 flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10'>
							<Upload className='h-5 w-5 text-blue-500' />
						</div>
						<div>
							<h2 className='text-sm font-semibold text-foreground'>
								Импорт товаров
							</h2>
							<p className='text-xs text-muted-foreground'>
								Загрузить из JSON или CSV файла
							</p>
						</div>
					</div>

					{/* Drop zone */}
					<label className='mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/10 py-8 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/20'>
						<ArrowUpFromLine className='h-8 w-8 text-muted-foreground/30' />
						<span className='text-sm'>Нажмите или перетащите файл</span>
						<span className='text-[11px] text-muted-foreground/60'>.json или .csv</span>
						<input
							ref={fileRef}
							type='file'
							accept='.json,.csv'
							className='hidden'
							onChange={handleFileUpload}
						/>
					</label>

					{importMut.isPending && (
						<div className='flex items-center gap-2 text-sm text-muted-foreground'>
							<div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent' />
							Импортируется...
						</div>
					)}

					{importResult && (
						<div
							className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
								importResult.type === 'success'
									? 'bg-emerald-500/10 text-emerald-600'
									: 'bg-red-500/10 text-red-500'
							}`}
						>
							{importResult.type === 'success' ? (
								<CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0' />
							) : (
								<AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
							)}
							{importResult.text}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}



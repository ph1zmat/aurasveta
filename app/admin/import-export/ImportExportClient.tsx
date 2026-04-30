'use client'

import { useState, useRef, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Download, Upload, FileText, FolderOpen, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

interface CsvRow {
	name: string
	slug: string
	description?: string
	price?: number
	stock?: number
	sku?: string
	categorySlug?: string
	brand?: string
	isActive: boolean
}

interface RowValidation {
	row: number
	field: string
	message: string
}

function parseRow(data: Record<string, string>): CsvRow {
	const getValue = (...keys: string[]) => {
		for (const key of keys) {
			if (data[key] !== undefined) return data[key].trim()
		}
		return ''
	}

	const priceRaw = getValue('price', 'Цена')
	const stockRaw = getValue('stock', 'Остаток')

	return {
		name: getValue('name', 'Название'),
		slug: getValue('slug', 'Slug'),
		description: getValue('description', 'Описание') || undefined,
		price: priceRaw ? Number(priceRaw) : undefined,
		stock: stockRaw ? Number(stockRaw) : undefined,
		sku: getValue('sku', 'SKU') || undefined,
		categorySlug: getValue('category', 'Категория') || undefined,
		brand: getValue('brand', 'Бренд') || undefined,
		isActive: getValue('isActive', 'Активен').toLowerCase() !== 'false',
	}
}

function validateRows(rows: CsvRow[]): RowValidation[] {
	const errors: RowValidation[] = []
	const seenSlugs = new Set<string>()

	rows.forEach((row, idx) => {
		if (!row.name.trim()) {
			errors.push({ row: idx + 1, field: 'name', message: 'Название обязательно' })
		}
		if (!row.slug.trim()) {
			errors.push({ row: idx + 1, field: 'slug', message: 'Slug обязателен' })
		} else if (!/^[a-z0-9-_]+$/.test(row.slug)) {
			errors.push({ row: idx + 1, field: 'slug', message: 'Slug должен содержать только a-z, 0-9, -, _' })
		} else if (seenSlugs.has(row.slug)) {
			errors.push({ row: idx + 1, field: 'slug', message: `Slug "${row.slug}" дублируется в файле` })
		} else {
			seenSlugs.add(row.slug)
		}
		if (row.price !== undefined && (!Number.isFinite(row.price) || row.price < 0)) {
			errors.push({ row: idx + 1, field: 'price', message: 'Цена должна быть неотрицательным числом' })
		}
		if (row.stock !== undefined && (!Number.isFinite(row.stock) || row.stock < 0 || !Number.isInteger(row.stock))) {
			errors.push({ row: idx + 1, field: 'stock', message: 'Остаток должен быть неотрицательным целым числом' })
		}
	})

	return errors
}

export default function ImportExportClient() {
	const [tab, setTab] = useState<'import' | 'export' | 'history'>('import')
	const [importFile, setImportFile] = useState<File | null>(null)
	const [importPreview, setImportPreview] = useState<Record<string, string>[] | null>(null)
	const [importResult, setImportResult] = useState<{ created: number; updated: number; total: number } | null>(null)
	const [validationErrors, setValidationErrors] = useState<RowValidation[]>([])
	const [parsedRows, setParsedRows] = useState<CsvRow[]>([])
	const fileRef = useRef<HTMLInputElement>(null)
	const utils = trpc.useUtils()

	const { refetch: refetchExport } = trpc.admin.exportProducts.useQuery('csv', { enabled: false })
	const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = trpc.importOperations.list.useQuery({ limit: 20 })
	const { mutate: createHistory } = trpc.importOperations.create.useMutation({
		onSuccess: () => {
			void refetchHistory()
			void utils.importOperations.list.invalidate()
		},
	})
	const { mutate: importProducts, isPending: importing } = trpc.admin.importProducts.useMutation({
		onSuccess: (data) => {
			setImportResult(data)
			toast.success(`Импорт завершён: создано ${data.created}, обновлено ${data.updated}`)
			addHistory('import', data.total)
		},
	})

	const addHistory = (type: string, count: number) => {
		createHistory({
			type: type as 'import' | 'export',
			count,
			status: 'Завершён',
		})
	}

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setImportFile(file)
		setImportResult(null)
		setValidationErrors([])

		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			preview: 6,
			complete: (results) => {
				if (results.errors.length > 0) {
					console.warn('CSV parse warnings:', results.errors)
				}
				setImportPreview(results.data)
			},
		})

		// Full parse for validation
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				const rows = results.data.map(parseRow)
				setParsedRows(rows)
				const errors = validateRows(rows)
				setValidationErrors(errors)
				if (errors.length > 0) {
					toast.error(`Найдено ${errors.length} ошибок в CSV`)
				}
			},
		})
	}, [])

	const handleImport = async () => {
		if (!importFile || parsedRows.length === 0) return
		if (validationErrors.length > 0) {
			toast.error('Исправьте ошибки в файле перед импортом')
			return
		}

		const validRows = parsedRows.filter((r) => r.name && r.slug)
		if (validRows.length === 0) {
			toast.error('Файл пустой или неверный формат')
			return
		}

		importProducts(validRows)
	}

	const handleExport = async (format: 'csv' | 'json') => {
		const { data } = await refetchExport()
		if (data?.data) {
			const blob = new Blob([data.data], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' })
			const link = document.createElement('a')
			link.href = URL.createObjectURL(blob)
			link.download = `products-${new Date().toISOString().slice(0, 10)}.${format}`
			link.click()
			URL.revokeObjectURL(link.href)
			toast.success('Экспорт завершён')
			addHistory('export', 0)
		}
	}

	const hasErrors = validationErrors.length > 0

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>Импорт / Экспорт</h1>
					<p className='text-sm text-muted-foreground'>Массовая загрузка и выгрузка данных</p>
				</div>
			</div>

			<div className='flex gap-2'>
				<Button variant={tab === 'import' ? 'default' : 'outline'} size='sm' onClick={() => setTab('import')}>
					<Upload className='h-4 w-4 mr-1' />
					Импорт
				</Button>
				<Button variant={tab === 'export' ? 'default' : 'outline'} size='sm' onClick={() => setTab('export')}>
					<Download className='h-4 w-4 mr-1' />
					Экспорт
				</Button>
				<Button variant={tab === 'history' ? 'default' : 'outline'} size='sm' onClick={() => setTab('history')}>
					<FileText className='h-4 w-4 mr-1' />
					История
				</Button>
			</div>

			{tab === 'import' && (
				<Card className='border-border'>
					<CardContent className='p-6 space-y-4'>
						<div
							className='border-2 border-dashed border-border rounded-(--radius-lg) p-12 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors'
							onClick={() => fileRef.current?.click()}
						>
							<FolderOpen className='h-10 w-10 text-muted-foreground/40 mx-auto mb-3' />
							<div className='text-lg font-bold mb-1'>
								{importFile ? importFile.name : 'Нажмите для выбора файла'}
							</div>
							<div className='text-sm text-muted-foreground mb-4'>CSV (макс. 10MB)</div>
							<Button variant='outline' onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>
								Выбрать файл
							</Button>
						</div>
						<input ref={fileRef} type='file' accept='.csv' className='hidden' onChange={handleFileChange} />

						{hasErrors && (
							<div className='rounded-md bg-destructive/10 p-4 space-y-2'>
								<div className='flex items-center gap-2 text-sm font-medium text-destructive'>
									<AlertCircle className='h-4 w-4' />
									Найдены ошибки в файле
								</div>
								<div className='max-h-40 overflow-y-auto space-y-1'>
									{validationErrors.map((err, i) => (
										<div key={i} className='text-xs text-destructive'>
											Строка {err.row}, поле &quot;{err.field}&quot;: {err.message}
										</div>
									))}
								</div>
							</div>
						)}

						{importPreview && importPreview.length > 0 && (
							<div className='space-y-2'>
								<div className='text-sm font-medium'>Предпросмотр (первые 5 строк)</div>
								<div className='overflow-auto border border-border rounded-md'>
									<table className='w-full text-xs'>
										<thead className='bg-secondary/50'>
											<tr>
												{Object.keys(importPreview[0]).map((h) => (
													<th key={h} className='text-left p-2 font-medium border-b border-border'>{h}</th>
												))}
											</tr>
										</thead>
										<tbody>
											{importPreview.map((row, i) => (
												<tr key={i} className='border-b border-border last:border-0'>
													{Object.values(row).map((v: unknown, j) => (
														<td key={j} className='p-2 text-muted-foreground'>{String(v).slice(0, 50)}</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<Button onClick={handleImport} disabled={importing || hasErrors} className='w-full'>
									{importing ? 'Импорт...' : hasErrors ? 'Исправьте ошибки' : 'Импортировать'}
								</Button>
							</div>
						)}

						{importResult && (
							<div className='rounded-md bg-success/10 p-4 text-sm'>
								<div className='font-medium text-success'>Импорт завершён</div>
								<div className='text-muted-foreground mt-1'>
									Создано: {importResult.created} · Обновлено: {importResult.updated} · Всего: {importResult.total}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{tab === 'export' && (
				<Card className='border-border max-w-xl'>
					<CardContent className='p-6 space-y-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Сущность</label>
							<div className='text-sm text-muted-foreground'>Товары</div>
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Формат</label>
							<div className='flex gap-2'>
								<Button size='sm' onClick={() => handleExport('csv')}>
									CSV
								</Button>
								<Button variant='outline' size='sm' onClick={() => handleExport('json')}>
									JSON
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{tab === 'history' && (
				<Card className='border-border'>
					<CardContent className='p-0 overflow-x-auto'>
						<table className='w-full text-sm'>
							<thead>
								<tr className='border-b border-border bg-secondary/50'>
									<th className='text-left p-3 text-xs font-bold uppercase text-muted-foreground'>Операция</th>
									<th className='text-left p-3 text-xs font-bold uppercase text-muted-foreground'>Дата</th>
									<th className='text-left p-3 text-xs font-bold uppercase text-muted-foreground'>Статус</th>
								</tr>
							</thead>
							<tbody>
								{historyLoading && (
									<tr>
										<td colSpan={3} className='text-center py-8 text-muted-foreground text-sm'>Загрузка...</td>
									</tr>
								)}
								{history.map((h) => (
									<tr key={h.id} className='border-b border-border'>
										<td className='p-3'>
											<Badge className={h.type === 'import' ? 'bg-info/15 text-info' : 'bg-success/15 text-success'}>
												{h.type === 'import' ? 'Импорт' : 'Экспорт'}
											</Badge>
											{h.count > 0 && <span className='ml-2 text-xs text-muted-foreground'>{h.count} записей</span>}
										</td>
										<td className='p-3 text-muted-foreground text-xs'>{new Date(h.createdAt).toLocaleDateString('ru-RU')}</td>
										<td className='p-3'>
											<Badge className='bg-success/15 text-success'>{h.status}</Badge>
										</td>
									</tr>
								))}
								{!historyLoading && history.length === 0 && (
									<tr>
										<td colSpan={3} className='text-center py-12 text-muted-foreground text-sm'>
											Нет истории
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</CardContent>
				</Card>
			)}
		</div>
	)
}

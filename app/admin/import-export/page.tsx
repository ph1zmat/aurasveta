'use client'

import { useState, useRef } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import { Download, Upload } from 'lucide-react'
import Papa from 'papaparse'

export default function ImportExportPage() {
	const [importResult, setImportResult] = useState<string | null>(null)

	const { refetch: refetchJson } = trpc.admin.exportProducts.useQuery('json', {
		enabled: false,
	})
	const { refetch: refetchCsv } = trpc.admin.exportProducts.useQuery('csv', {
		enabled: false,
	})
	const importMut = trpc.admin.importProducts.useMutation({
		onSuccess: data => {
			setImportResult(
				`Импорт завершён: ${data.created} создано, ${data.updated} обновлено`,
			)
		},
		onError: err => {
			setImportResult(`Ошибка: ${err.message}`)
		},
	})

	const fileRef = useRef<HTMLInputElement>(null)

	async function handleExport(format: 'json' | 'csv') {
		const result = format === 'json' ? await refetchJson() : await refetchCsv()
		const data = result.data
		if (!data) return

		const blob = new Blob([data.data], {
			type: format === 'json' ? 'application/json' : 'text/csv',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `products.${format}`
		a.click()
		URL.revokeObjectURL(url)
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
					setImportResult('Ошибка: невалидный JSON')
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
				setImportResult('Поддерживаются только .json и .csv файлы')
			}
		}
		reader.readAsText(file)
	}

	return (
		<div className='space-y-8'>
			<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
				Импорт / Экспорт
			</h1>

			{/* Export */}
			<div className='rounded-xl border border-border bg-muted/30 p-6'>
				<h2 className='mb-4 font-semibold text-foreground'>Экспорт товаров</h2>
				<div className='flex gap-3'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => handleExport('json')}
					>
						<Download className='mr-1 h-4 w-4' /> Скачать JSON
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => handleExport('csv')}
					>
						<Download className='mr-1 h-4 w-4' /> Скачать CSV
					</Button>
				</div>
			</div>

			{/* Import */}
			<div className='rounded-xl border border-border bg-muted/30 p-6'>
				<h2 className='mb-4 font-semibold text-foreground'>Импорт товаров</h2>
				<p className='mb-4 text-sm text-muted-foreground'>
					Загрузите файл JSON или CSV с товарами. Если товар с таким slug уже
					существует, он будет обновлён.
				</p>
				<div className='flex items-center gap-3'>
					<input
						ref={fileRef}
						type='file'
						accept='.json,.csv'
						onChange={handleFileUpload}
						className='hidden'
					/>
					<Button
						variant='primary'
						size='sm'
						onClick={() => fileRef.current?.click()}
						disabled={importMut.isPending}
					>
						<Upload className='mr-1 h-4 w-4' />
						{importMut.isPending ? 'Импорт...' : 'Загрузить файл'}
					</Button>
				</div>
				{importResult && (
					<p className='mt-3 text-sm text-foreground'>{importResult}</p>
				)}
			</div>
		</div>
	)
}

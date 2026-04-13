import { useState, useRef } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import { Download } from 'lucide-react'

export function ImportExportPage() {
  const { data: stats } = trpc.admin.getStats.useQuery()
  const importMut = trpc.admin.importProducts.useMutation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  const utils = trpc.useUtils()

  const handleExport = async (format: 'json' | 'csv') => {
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()

    try {
      let products: any[]
      if (file.name.endsWith('.json')) {
        products = JSON.parse(text)
      } else {
        // CSV parsing — simplified
        const lines = text.split('\n').filter(l => l.trim())
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        products = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const obj: any = {}
          headers.forEach((h, i) => { obj[h] = values[i] })
          return obj
        })
      }

      const result = await importMut.mutateAsync(products)
      setImportResult(`Импортировано: создано ${result.created}, обновлено ${result.updated} (всего ${result.total})`)
    } catch (err) {
      setImportResult(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    }

    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">Импорт / Экспорт</h1>

      {/* Export section */}
      <div className="rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-foreground">
          Экспорт товаров
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Всего товаров: {stats?.totalProducts ?? 0}
        </p>
        <div className="flex gap-3">
          <Button size="sm" onClick={() => handleExport('json')} disabled={exporting}>
            <Download className="mr-1 h-4 w-4" /> Экспорт JSON
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleExport('csv')} disabled={exporting}>
            <Download className="mr-1 h-4 w-4" /> Экспорт CSV
          </Button>
        </div>
      </div>

      {/* Import section */}
      <div className="rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-foreground">
          Импорт товаров
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Загрузите файл в формате JSON или CSV. Существующие товары обновятся по slug.
        </p>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleImport}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:text-primary-foreground" />
          {importMut.isPending && <span className="text-sm text-muted-foreground">Импортируется...</span>}
        </div>
        {importResult && (
          <div className="mt-3 rounded-lg bg-muted p-3 text-sm text-foreground">{importResult}</div>
        )}
      </div>
    </div>
  )
}

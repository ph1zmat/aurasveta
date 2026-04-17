import { useState, useRef } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
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

export function ImportExportPage() {
const { data: stats } = trpc.admin.getStats.useQuery()
const importMut = trpc.admin.importProducts.useMutation()
const fileRef = useRef<HTMLInputElement>(null)
const [importResult, setImportResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
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
const lines = text.split('\n').filter(l => l.trim())
const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
products = lines.slice(1).map(line => {
const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
const obj: any = {}
headers.forEach((h, i) => {
obj[h] = values[i]
})
return obj
})
}

const result = await importMut.mutateAsync(products)
setImportResult({
type: 'success',
text: `Создано ${result.created}, обновлено ${result.updated} (всего ${result.total})`,
})
} catch (err) {
setImportResult({
type: 'error',
text: err instanceof Error ? err.message : 'Неизвестная ошибка',
})
}

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
{/* Export section */}
<div className='rounded-2xl border border-border bg-muted/10 p-6 transition-colors hover:bg-muted/15'>
<div className='flex items-center gap-3 mb-4'>
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

<div className='flex items-center gap-2 mb-5 rounded-lg bg-muted/20 px-3 py-2'>
<Package className='h-4 w-4 text-muted-foreground' />
<span className='text-sm text-muted-foreground'>
Всего товаров:
</span>
<span className='text-sm font-semibold text-foreground'>
{stats?.totalProducts ?? 0}
</span>
</div>

<div className='flex gap-3'>
<Button
size='sm'
onClick={() => handleExport('json')}
disabled={exporting}
>
<FileJson className='mr-1.5 h-4 w-4' />
JSON
</Button>
<Button
size='sm'
variant='secondary'
onClick={() => handleExport('csv')}
disabled={exporting}
>
<FileSpreadsheet className='mr-1.5 h-4 w-4' />
CSV
</Button>
</div>
</div>

{/* Import section */}
<div className='rounded-2xl border border-border bg-muted/10 p-6 transition-colors hover:bg-muted/15'>
<div className='flex items-center gap-3 mb-4'>
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
<span className='text-sm'>
Нажмите или перетащите файл
</span>
<span className='text-[11px] text-muted-foreground/60'>
.json или .csv
</span>
<input
ref={fileRef}
type='file'
accept='.json,.csv'
onChange={handleImport}
className='hidden'
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
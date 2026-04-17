import { useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import {
Plus,
Trash2,
Send,
X,
Webhook,
Link2,
Zap,
CheckCircle2,
AlertCircle,
Globe,
} from 'lucide-react'

const EVENTS = [
'product.created',
'product.updated',
'order.created',
'order.updated',
] as const

const EVENT_COLORS: Record<string, { color: string; bg: string }> = {
'product.created': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
'product.updated': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
'order.created': { color: 'text-amber-500', bg: 'bg-amber-500/10' },
'order.updated': { color: 'text-violet-500', bg: 'bg-violet-500/10' },
}

export function WebhooksPage() {
const { data: webhooks, refetch } = trpc.webhooks.getAll.useQuery()
const deleteMut = trpc.webhooks.delete.useMutation({
onSuccess: () => refetch(),
})
const testMut = trpc.webhooks.test.useMutation()
const [showForm, setShowForm] = useState(false)
const [testResult, setTestResult] = useState<{ id: string; data: any } | null>(null)

return (
<div className='space-y-5'>
{/* Header */}
<div className='flex items-center justify-between'>
<div className='flex items-center gap-3'>
<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
<Webhook className='h-5 w-5 text-primary' />
</div>
<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
Вебхуки
</h1>
</div>
<Button size='sm' onClick={() => setShowForm(true)}>
<Plus className='mr-1 h-4 w-4' /> Добавить
</Button>
</div>

{/* Cards grid */}
{webhooks && webhooks.length > 0 ? (
<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
{webhooks.map((wh: any) => (
<div
key={wh.id}
className='group flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/10 transition-colors hover:bg-muted/20'
>
{/* URL header */}
<div className='flex items-start gap-3 p-4 pb-3'>
<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
<Globe className='h-4 w-4 text-primary' />
</div>
<div className='min-w-0 flex-1'>
<p className='break-all text-sm font-medium text-foreground leading-snug'>
{wh.url}
</p>
</div>
</div>

{/* Events */}
<div className='flex flex-wrap gap-1.5 px-4 pb-3'>
{wh.events.map((ev: string) => {
const ec = EVENT_COLORS[ev] ?? {
color: 'text-muted-foreground',
bg: 'bg-muted',
}
return (
<span
key={ev}
className={`rounded-full ${ec.bg} px-2 py-0.5 text-[10px] font-medium ${ec.color}`}
>
{ev}
</span>
)
})}
</div>

{/* Test result */}
{testResult?.id === wh.id && (
<div className='mx-4 mb-3 rounded-lg bg-muted/30 p-2.5 text-[11px] text-muted-foreground font-mono break-all'>
{JSON.stringify(testResult.data)}
</div>
)}

{/* Actions */}
<div className='mt-auto flex border-t border-border'>
<button
onClick={async () => {
const data = await testMut.mutateAsync(wh.id)
setTestResult({ id: wh.id, data })
}}
disabled={testMut.isPending}
className='flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5'
>
<Send className='h-3.5 w-3.5' />
Тест
</button>
<div className='w-px bg-border' />
<button
onClick={() => {
if (confirm('Удалить вебхук?')) deleteMut.mutate(wh.id)
}}
className='flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive'
>
<Trash2 className='h-3.5 w-3.5' />
Удалить
</button>
</div>
</div>
))}
</div>
) : (
<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
<Webhook className='mb-3 h-10 w-10 text-muted-foreground/20' />
<p className='text-sm text-muted-foreground'>
Нет зарегистрированных вебхуков
</p>
</div>
)}

{/* Modal */}
{showForm && (
<WebhookFormModal
onClose={() => setShowForm(false)}
onSuccess={() => {
setShowForm(false)
refetch()
}}
/>
)}
</div>
)
}

/* ============== Webhook Form Modal ============== */

function WebhookFormModal({
onClose,
onSuccess,
}: {
onClose: () => void
onSuccess: () => void
}) {
const createMut = trpc.webhooks.create.useMutation({ onSuccess })
const [url, setUrl] = useState('')
const [events, setEvents] = useState<string[]>([])

const toggleEvent = (ev: string) => {
setEvents(prev =>
prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev],
)
}

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault()
createMut.mutate({ url, events })
}

return (
<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
<div className='flex w-full max-w-md flex-col rounded-2xl border border-border bg-card shadow-2xl'>
{/* Header */}
<div className='flex items-center justify-between border-b border-border px-6 py-4'>
<h2 className='text-lg font-semibold text-foreground'>
Новый вебхук
</h2>
<button
onClick={onClose}
className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
>
<X className='h-5 w-5' />
</button>
</div>

{/* Body */}
<form
onSubmit={handleSubmit}
className='flex-1 overflow-y-auto px-6 py-5 space-y-5'
>
{/* URL field */}
<div>
<label className='mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
<Link2 className='h-3 w-3' />
URL
</label>
<input
value={url}
onChange={e => setUrl(e.target.value)}
type='url'
required
className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
placeholder='https://example.com/webhook'
/>
</div>

{/* Events */}
<div>
<label className='mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
<Zap className='h-3 w-3' />
События
</label>
<div className='space-y-2'>
{EVENTS.map(ev => {
const ec = EVENT_COLORS[ev] ?? {
color: 'text-muted-foreground',
bg: 'bg-muted',
}
const checked = events.includes(ev)
return (
<label
key={ev}
className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
checked
? `border-primary/30 ${ec.bg}`
: 'border-border bg-muted/10 hover:bg-muted/20'
}`}
>
<div
className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
checked
? 'border-primary bg-primary'
: 'border-muted-foreground/30'
}`}
>
{checked && (
<CheckCircle2 className='h-3 w-3 text-primary-foreground' />
)}
</div>
<span
className={`text-sm font-medium ${
checked ? ec.color : 'text-muted-foreground'
}`}
>
{ev}
</span>
</label>
)
})}
</div>
</div>
</form>

{/* Footer */}
<div className='flex justify-end gap-2 border-t border-border px-6 py-4'>
<Button variant='ghost' type='button' onClick={onClose}>
Отмена
</Button>
<Button
type='submit'
disabled={events.length === 0 || createMut.isPending}
onClick={handleSubmit}
>
Создать
</Button>
</div>
</div>
</div>
)
}
import { useMemo, useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'
import {
Search,
Package,
Phone,
MapPin,
MessageSquare,
Clock,
User,
ShoppingBag,
X,
ChevronRight,
Ban,
Truck,
CheckCircle2,
CreditCard,
CircleDot,
} from 'lucide-react'

type Status = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

const STATUS_CONFIG: Record<
Status,
{ label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
PENDING: {
label: 'Новый',
color: 'text-amber-500',
bg: 'bg-amber-500/10',
border: 'border-amber-500/30',
icon: CircleDot,
},
PAID: {
label: 'Оплачен',
color: 'text-blue-500',
bg: 'bg-blue-500/10',
border: 'border-blue-500/30',
icon: CreditCard,
},
SHIPPED: {
label: 'Отправлен',
color: 'text-violet-500',
bg: 'bg-violet-500/10',
border: 'border-violet-500/30',
icon: Truck,
},
DELIVERED: {
label: 'Доставлен',
color: 'text-emerald-500',
bg: 'bg-emerald-500/10',
border: 'border-emerald-500/30',
icon: CheckCircle2,
},
CANCELLED: {
label: 'Отменён',
color: 'text-red-500',
bg: 'bg-red-500/10',
border: 'border-red-500/30',
icon: Ban,
},
}

const TABS: { key: Status | 'ALL'; label: string }[] = [
{ key: 'ALL', label: 'Все' },
{ key: 'PENDING', label: 'Новые' },
{ key: 'PAID', label: 'Оплачены' },
{ key: 'SHIPPED', label: 'Отправлены' },
{ key: 'DELIVERED', label: 'Доставлены' },
{ key: 'CANCELLED', label: 'Отменены' },
]

export function OrdersPage() {
const [activeTab, setActiveTab] = useState<Status | 'ALL'>('ALL')
const [search, setSearch] = useState('')
const [selectedId, setSelectedId] = useState<string | null>(null)
const [page, setPage] = useState(1)

const { data, refetch } = trpc.orders.getAllOrders.useQuery({
status: activeTab === 'ALL' ? undefined : activeTab,
page,
limit: 24,
})

const items = data?.items ?? []
const totalPages = data?.totalPages ?? 1

const filtered = useMemo(() => {
if (!search) return items
const q = search.toLowerCase()
return items.filter(
(o: any) =>
o.id.toLowerCase().includes(q) ||
o.user?.name?.toLowerCase().includes(q) ||
o.user?.email?.toLowerCase().includes(q) ||
o.phone?.toLowerCase().includes(q),
)
}, [items, search])

// Count badges per status
const { data: pendingData } = trpc.orders.getAllOrders.useQuery({ status: 'PENDING', page: 1, limit: 1 })
const { data: paidData } = trpc.orders.getAllOrders.useQuery({ status: 'PAID', page: 1, limit: 1 })

const selectedOrder = filtered.find((o: any) => o.id === selectedId)

return (
<div className='space-y-5'>
{/* Header */}
<div className='flex items-center justify-between'>
<div className='flex items-center gap-3'>
<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
<ShoppingBag className='h-5 w-5 text-primary' />
</div>
<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
Заказы
</h1>
</div>

{/* Quick counters */}
<div className='flex gap-2'>
{(pendingData?.total ?? 0) > 0 && (
<button
onClick={() => { setActiveTab('PENDING'); setPage(1) }}
className='flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/20'
>
<CircleDot className='h-3 w-3' />
{pendingData?.total} новых
</button>
)}
{(paidData?.total ?? 0) > 0 && (
<button
onClick={() => { setActiveTab('PAID'); setPage(1) }}
className='flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-500/20'
>
<CreditCard className='h-3 w-3' />
{paidData?.total} оплачено
</button>
)}
</div>
</div>

{/* Tabs */}
<div className='flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/20 p-1'>
{TABS.map(tab => (
<button
key={tab.key}
onClick={() => {
setActiveTab(tab.key)
setPage(1)
setSearch('')
}}
className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
activeTab === tab.key
? 'bg-background text-foreground shadow-sm'
: 'text-muted-foreground hover:text-foreground'
}`}
>
{tab.label}
{tab.key !== 'ALL' && activeTab === tab.key && data?.total != null && (
<span className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-semibold ${STATUS_CONFIG[tab.key as Status].bg} ${STATUS_CONFIG[tab.key as Status].color}`}>
{data.total}
</span>
)}
</button>
))}
</div>

{/* Search */}
<div className='relative'>
<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
<input
value={search}
onChange={e => setSearch(e.target.value)}
placeholder='Поиск по номеру, имени, email, телефону...'
className='flex h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
/>
</div>

{/* Cards grid */}
{filtered.length > 0 ? (
<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
{filtered.map((order: any) => (
<OrderCard
key={order.id}
order={order}
onClick={() => setSelectedId(order.id)}
/>
))}
</div>
) : (
<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-16'>
<ShoppingBag className='mb-3 h-10 w-10 text-muted-foreground/20' />
<p className='text-sm text-muted-foreground'>
{search ? 'Ничего не найдено' : 'Нет заказов'}
</p>
</div>
)}

{/* Pagination */}
{totalPages > 1 && !search && (
<div className='flex items-center justify-center gap-2 pt-2'>
<button
onClick={() => setPage(p => Math.max(1, p - 1))}
disabled={page === 1}
className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
>
Назад
</button>
<span className='text-xs text-muted-foreground'>
{page} / {totalPages}
</span>
<button
onClick={() => setPage(p => Math.min(totalPages, p + 1))}
disabled={page === totalPages}
className='rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40'
>
Далее
</button>
</div>
)}

{/* Detail modal */}
{selectedOrder && (
<OrderModal
order={selectedOrder}
onClose={() => setSelectedId(null)}
onStatusChange={() => {
refetch()
setSelectedId(null)
}}
/>
)}
</div>
)
}

/* ============== Order Card ============== */

function OrderCard({ order, onClick }: { order: any; onClick: () => void }) {
const status = order.status as Status
const st = STATUS_CONFIG[status]
const StatusIcon = st.icon

const date = new Date(order.createdAt).toLocaleString('ru-RU', {
day: '2-digit',
month: '2-digit',
hour: '2-digit',
minute: '2-digit',
})

const itemCount = order.items?.length ?? 0
const customerName = order.user?.name ?? order.user?.email ?? 'Аноним'

return (
<div
onClick={onClick}
className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-colors hover:bg-muted/30 ${st.border} bg-muted/10`}
>
{/* Status strip at top */}
<div className={`h-1 ${st.bg.replace('/10', '/40')}`} />

{/* Content */}
<div className='flex flex-1 flex-col gap-3 p-4'>
{/* Order number + status */}
<div className='flex items-center justify-between'>
<span className='font-mono text-xs font-semibold text-muted-foreground'>
#{order.id.slice(-6)}
</span>
<div className={`flex items-center gap-1 rounded-full ${st.bg} px-2 py-0.5`}>
<StatusIcon className={`h-3 w-3 ${st.color}`} />
<span className={`text-[10px] font-medium ${st.color}`}>
{st.label}
</span>
</div>
</div>

{/* Total */}
<div className='text-2xl font-bold tabular-nums text-foreground'>
{order.total.toLocaleString('ru-RU')} ₽
</div>

{/* Customer */}
<div className='flex items-center gap-1.5 text-sm text-foreground'>
<User className='h-3.5 w-3.5 text-muted-foreground' />
<span className='truncate'>{customerName}</span>
</div>

{/* Meta row */}
<div className='mt-auto flex items-center justify-between text-[11px] text-muted-foreground'>
<span className='flex items-center gap-1'>
<Clock className='h-3 w-3' />
{date}
</span>
<span className='flex items-center gap-1'>
<Package className='h-3 w-3' />
{itemCount} товар{itemCount === 1 ? '' : itemCount < 5 ? 'а' : 'ов'}
</span>
</div>

{/* Open button */}
<button className='flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20'>
Подробнее
<ChevronRight className='h-3 w-3' />
</button>
</div>
</div>
)
}

/* ============== Order Modal ============== */

function OrderModal({
order,
onClose,
onStatusChange,
}: {
order: any
onClose: () => void
onStatusChange: () => void
}) {
const updateStatus = trpc.orders.updateStatus.useMutation({
onSuccess: onStatusChange,
})

const status = order.status as Status
const st = STATUS_CONFIG[status]
const StatusIcon = st.icon

const date = new Date(order.createdAt).toLocaleString('ru-RU', {
day: '2-digit',
month: 'long',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
})

const customerName = order.user?.name ?? order.user?.email ?? 'Аноним'

// Determine next logical statuses
const transitions: Record<Status, { next: Status; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
PENDING: [
{ next: 'PAID', label: 'Оплачен', icon: CreditCard },
{ next: 'CANCELLED', label: 'Отменить', icon: Ban },
],
PAID: [
{ next: 'SHIPPED', label: 'Отправить', icon: Truck },
{ next: 'CANCELLED', label: 'Отменить', icon: Ban },
],
SHIPPED: [
{ next: 'DELIVERED', label: 'Доставлен', icon: CheckCircle2 },
],
DELIVERED: [],
CANCELLED: [],
}

const availableTransitions = transitions[status] ?? []

return (
<div className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
<div className='flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh]'>
{/* Header */}
<div className='flex items-center justify-between border-b border-border px-6 py-4'>
<div className='flex items-center gap-3'>
<div className={`flex h-10 w-10 items-center justify-center rounded-xl ${st.bg}`}>
<StatusIcon className={`h-5 w-5 ${st.color}`} />
</div>
<div>
<div className='flex items-center gap-2'>
<h2 className='text-lg font-semibold text-foreground'>
Заказ #{order.id.slice(-6)}
</h2>
<span className={`rounded-full ${st.bg} px-2.5 py-0.5 text-xs font-medium ${st.color}`}>
{st.label}
</span>
</div>
<p className='text-xs text-muted-foreground'>{date}</p>
</div>
</div>
<button
onClick={onClose}
className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
>
<X className='h-5 w-5' />
</button>
</div>

{/* Body */}
<div className='flex-1 overflow-y-auto px-6 py-5 space-y-5'>
{/* Customer info */}
<div className='rounded-xl border border-border bg-muted/10 p-4 space-y-3'>
<div className='flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
<User className='h-3 w-3' />
Покупатель
</div>
<div className='grid gap-3 sm:grid-cols-2'>
<div className='flex items-center gap-2'>
<User className='h-4 w-4 text-muted-foreground' />
<span className='text-sm text-foreground'>{customerName}</span>
</div>
{order.phone && (
<div className='flex items-center gap-2'>
<Phone className='h-4 w-4 text-muted-foreground' />
<span className='text-sm text-foreground'>{order.phone}</span>
</div>
)}
{order.address && (
<div className='flex items-center gap-2 sm:col-span-2'>
<MapPin className='h-4 w-4 shrink-0 text-muted-foreground' />
<span className='text-sm text-foreground'>{order.address}</span>
</div>
)}
{order.comment && (
<div className='flex items-start gap-2 sm:col-span-2'>
<MessageSquare className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
<span className='text-sm italic text-muted-foreground'>{order.comment}</span>
</div>
)}
</div>
</div>

{/* Items list */}
<div className='space-y-3'>
<div className='flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
<Package className='h-3 w-3' />
Товары ({order.items?.length ?? 0})
</div>
<div className='rounded-xl border border-border overflow-hidden'>
{order.items?.map((item: any, i: number) => (
<div
key={item.id}
className={`flex items-center gap-3 px-4 py-3 ${
i > 0 ? 'border-t border-border/50' : ''
}`}
>
{/* Product image placeholder */}
<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/30'>
<Package className='h-4 w-4 text-muted-foreground/30' />
</div>

{/* Name */}
<div className='flex-1 min-w-0'>
<div className='truncate text-sm font-medium text-foreground'>
{item.product?.name ?? 'Товар удалён'}
</div>
<div className='text-xs text-muted-foreground'>
{item.quantity} шт.  {item.price.toLocaleString('ru-RU')} ₽
</div>
</div>

{/* Subtotal */}
<span className='shrink-0 text-sm font-semibold tabular-nums text-foreground'>
{(item.quantity * item.price).toLocaleString('ru-RU')} ₽
</span>
</div>
))}
</div>

{/* Total */}
<div className='flex items-center justify-end gap-3 px-1'>
<span className='text-sm text-muted-foreground'>Итого:</span>
<span className='text-xl font-bold tabular-nums text-foreground'>
{order.total.toLocaleString('ru-RU')} ₽
</span>
</div>
</div>
</div>

{/* Footer  status actions */}
{availableTransitions.length > 0 && (
<div className='flex items-center justify-end gap-2 border-t border-border px-6 py-4'>
{availableTransitions.map(tr => {
const TrIcon = tr.icon
const isCancelAction = tr.next === 'CANCELLED'
return (
<Button
key={tr.next}
size='sm'
variant={isCancelAction ? 'ghost' : 'primary'}
disabled={updateStatus.isPending}
onClick={() =>
updateStatus.mutate({ id: order.id, status: tr.next })
}
className={isCancelAction ? 'text-destructive hover:text-destructive' : ''}
>
<TrIcon className='mr-1.5 h-3.5 w-3.5' />
{tr.label}
</Button>
)
})}
</div>
)}
</div>
</div>
)
}
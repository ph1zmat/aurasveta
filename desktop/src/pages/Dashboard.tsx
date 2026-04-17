import { useState } from 'react'
import { trpc } from '../lib/trpc'
import {
Package,
ShoppingCart,
Users,
LayoutDashboard,
Clock,
User,
TrendingUp,
CircleDot,
CreditCard,
ChevronRight,
ShoppingBag,
X,
Phone,
MapPin,
MessageSquare,
Ban,
Truck,
CheckCircle2,
} from 'lucide-react'
import { Button } from '../components/ui/Button'

type Status = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

const STATUS_CONFIG: Record<
Status,
{ label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
PENDING: { label: 'Новый', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: CircleDot },
PAID: { label: 'Оплачен', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: CreditCard },
SHIPPED: { label: 'Отправлен', color: 'text-violet-500', bg: 'bg-violet-500/10', icon: Truck },
DELIVERED: { label: 'Доставлен', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
CANCELLED: { label: 'Отменён', color: 'text-red-500', bg: 'bg-red-500/10', icon: Ban },
}

export function DashboardPage() {
const { data: stats } = trpc.admin.getStats.useQuery()
const { data: recentPending, refetch: refetchPending } = trpc.orders.getAllOrders.useQuery({
status: 'PENDING',
page: 1,
limit: 8,
})
const { data: recentPaid, refetch: refetchPaid } = trpc.orders.getAllOrders.useQuery({
status: 'PAID',
page: 1,
limit: 4,
})

const [selectedOrder, setSelectedOrder] = useState<any>(null)

const pendingOrders = recentPending?.items ?? []
const paidOrders = recentPaid?.items ?? []

const statCards = [
{
label: 'Товары',
value: stats?.totalProducts ?? 0,
icon: Package,
color: 'text-blue-500',
bg: 'bg-blue-500/10',
},
{
label: 'Заказы',
value: stats?.totalOrders ?? 0,
icon: ShoppingCart,
color: 'text-emerald-500',
bg: 'bg-emerald-500/10',
},
{
label: 'Пользователи',
value: stats?.totalUsers ?? 0,
icon: Users,
color: 'text-violet-500',
bg: 'bg-violet-500/10',
},
]

return (
<div className='space-y-6'>
{/* Header */}
<div className='flex items-center gap-3'>
<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
<LayoutDashboard className='h-5 w-5 text-primary' />
</div>
<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
Дашборд
</h1>
</div>

{/* Stat cards */}
<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
{statCards.map(card => {
const Icon = card.icon
return (
<div
key={card.label}
className='rounded-2xl border border-border bg-muted/10 p-5 transition-colors hover:bg-muted/20'
>
<div className='flex items-center justify-between'>
<span className='text-sm text-muted-foreground'>
{card.label}
</span>
<div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
<Icon className={`h-4 w-4 ${card.color}`} />
</div>
</div>
<p className='mt-3 text-3xl font-bold tabular-nums text-foreground'>
{card.value.toLocaleString('ru-RU')}
</p>
</div>
)
})}
</div>

{/* Recent orders  cards */}
<div className='space-y-4'>
<div className='flex items-center justify-between'>
<div className='flex items-center gap-2'>
<div className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
<CircleDot className='h-3.5 w-3.5 text-amber-500' />
Новые заказы
</div>
{pendingOrders.length > 0 && (
<span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-500'>
{recentPending?.total ?? 0}
</span>
)}
</div>
</div>

{pendingOrders.length > 0 ? (
<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
{pendingOrders.map((order: any) => (
<MiniOrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
))}
</div>
) : (
<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12'>
<ShoppingBag className='mb-2 h-8 w-8 text-muted-foreground/20' />
<p className='text-sm text-muted-foreground'>Нет новых заказов</p>
</div>
)}
</div>

{/* Recently paid */}
{paidOrders.length > 0 && (
<div className='space-y-4'>
<div className='flex items-center gap-2'>
<div className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
<CreditCard className='h-3.5 w-3.5 text-blue-500' />
Оплаченные
</div>
<span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500/10 px-1.5 text-[10px] font-semibold text-blue-500'>
{recentPaid?.total ?? 0}
</span>
</div>
<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
{paidOrders.map((order: any) => (
<MiniOrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
))}
</div>
</div>
)}

{/* Top products */}
<div className='space-y-4'>
<div className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
<TrendingUp className='h-3.5 w-3.5 text-emerald-500' />
Топ товаров
</div>

{stats?.topProducts && stats.topProducts.length > 0 ? (
<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
{stats.topProducts.map((tp: any) => {
const maxQty = Math.max(...stats.topProducts.map((t: any) => t._sum?.quantity ?? 0))
const qty = tp._sum?.quantity ?? 0
const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0

return (
<div
key={tp.productId}
className='relative overflow-hidden rounded-2xl border border-border bg-muted/10 p-4 transition-colors hover:bg-muted/20'
>
<div
className='absolute bottom-0 left-0 h-1 bg-emerald-500/30'
style={{ width: `${pct}%` }}
/>
<div className='text-sm font-medium text-foreground truncate'>
{tp.product?.name ?? tp.productId}
</div>
<div className='mt-1 flex items-center gap-1.5'>
<Package className='h-3 w-3 text-muted-foreground' />
<span className='text-lg font-bold tabular-nums text-foreground'>
{qty}
</span>
<span className='text-xs text-muted-foreground'>шт.</span>
</div>
</div>
)
})}
</div>
) : (
<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12'>
<TrendingUp className='mb-2 h-8 w-8 text-muted-foreground/20' />
<p className='text-sm text-muted-foreground'>Нет данных</p>
</div>
)}
</div>

{/* Order detail modal */}
{selectedOrder && (
<OrderModal
order={selectedOrder}
onClose={() => setSelectedOrder(null)}
onStatusChange={() => {
refetchPending()
refetchPaid()
setSelectedOrder(null)
}}
/>
)}
</div>
)
}

/* ============== Mini Order Card ============== */

function MiniOrderCard({ order, onClick }: { order: any; onClick: () => void }) {
const status = (order.status as Status) ?? 'PENDING'
const st = STATUS_CONFIG[status]
const date = new Date(order.createdAt).toLocaleString('ru-RU', {
day: '2-digit',
month: '2-digit',
hour: '2-digit',
minute: '2-digit',
})
const customerName = order.user?.name ?? order.user?.email ?? 'Аноним'
const itemCount = order.items?.length ?? 0

return (
<div
onClick={onClick}
className={`relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-muted/10 transition-colors hover:bg-muted/20 ${st.bg.replace('/10', '/5')} border-border`}
>
<div className={`h-1 ${st.bg.replace('/10', '/40')}`} />
<div className='flex flex-1 flex-col gap-2 p-3'>
<div className='flex items-center justify-between'>
<span className='font-mono text-[11px] text-muted-foreground'>
#{order.id.slice(-6)}
</span>
<span className={`rounded-full ${st.bg} px-2 py-0.5 text-[10px] font-medium ${st.color}`}>
{st.label}
</span>
</div>
<div className='text-xl font-bold tabular-nums text-foreground'>
{order.total.toLocaleString('ru-RU')} ₽
</div>
<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
<User className='h-3 w-3' />
<span className='truncate'>{customerName}</span>
</div>
<div className='mt-auto flex items-center justify-between text-[10px] text-muted-foreground'>
<span className='flex items-center gap-1'>
<Clock className='h-3 w-3' />
{date}
</span>
<span className='flex items-center gap-1'>
<Package className='h-3 w-3' />
{itemCount}
</span>
</div>
{/* Подробнее button */}
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

const transitions: Record<
Status,
{ next: Status; label: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
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
<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/30'>
<Package className='h-4 w-4 text-muted-foreground/30' />
</div>
<div className='flex-1 min-w-0'>
<div className='truncate text-sm font-medium text-foreground'>
{item.product?.name ?? 'Товар удалён'}
</div>
<div className='text-xs text-muted-foreground'>
{item.quantity} шт.  {item.price.toLocaleString('ru-RU')} ₽
</div>
</div>
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
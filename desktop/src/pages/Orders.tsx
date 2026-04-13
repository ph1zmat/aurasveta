import { useState } from 'react'
import { trpc } from '../lib/trpc'
import { Button } from '../components/ui/Button'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  PAID: 'Оплачен',
  SHIPPED: 'Отправлен',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
}

const STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export function OrdersPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, refetch } = trpc.orders.getAllOrders.useQuery({
    page, limit: 20,
    status: statusFilter ? statusFilter as any : undefined,
  })
  const updateStatus = trpc.orders.updateStatus.useMutation({ onSuccess: () => refetch() })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold uppercase tracking-widest text-foreground">Заказы</h1>

      <select
        value={statusFilter}
        onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        className="h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="">Все статусы</option>
        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium">Товаров</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((order: any) => (
              <tr key={order.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{order.user?.name ?? order.user?.email}</td>
                <td className="px-4 py-3">{order.items?.length ?? 0}</td>
                <td className="px-4 py-3">{order.total.toLocaleString('ru-RU')} ₽</td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={e => updateStatus.mutate({ id: order.id, status: e.target.value as any })}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</Button>
          <span className="text-sm text-muted-foreground">{page} / {data.totalPages}</span>
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>→</Button>
        </div>
      )}
    </div>
  )
}
